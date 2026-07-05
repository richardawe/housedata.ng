<?php
require_once __DIR__ . '/../_db.php';
require_once __DIR__ . '/../_lib.php';
require_once __DIR__ . '/../mailer.php';

$admin = require_admin();
$pdo = db();

/** Turns "Coral Garden Estate" + "Lagos" into a unique estate id like the existing seed data's slugs. */
function generate_estate_slug(PDO $pdo, string $name, string $state): string {
    $base = strtolower(trim($name . '-' . $state));
    $base = preg_replace('/[^a-z0-9]+/', '-', $base);
    $base = trim($base, '-');
    $base = $base !== '' ? $base : 'estate';

    $slug = $base;
    $suffix = 2;
    while (true) {
        $stmt = $pdo->prepare('SELECT 1 FROM estates WHERE id = :id');
        $stmt->execute([':id' => $slug]);
        if (!$stmt->fetch()) return $slug;
        $slug = $base . '-' . $suffix;
        $suffix++;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status = isset($_GET['status']) ? clean_string($_GET['status'], 20) : 'pending';
    $sql = 'SELECT * FROM submissions';
    $params = [];
    if ($status && $status !== 'all') {
        $sql .= ' WHERE status = :status';
        $params[':status'] = $status;
    }
    $sql .= ' ORDER BY created_at DESC LIMIT 200';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    json_response(['submissions' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $body = json_decode(file_get_contents('php://input'), true);
    $body = is_array($body) ? $body : [];

    $submissionId = filter_var($body['submissionId'] ?? null, FILTER_VALIDATE_INT);
    $action = clean_string($body['action'] ?? null, 20);
    $reviewNotes = clean_string($body['reviewNotes'] ?? null, 1000);

    if (!$submissionId || !in_array($action, ['approve', 'reject'], true)) {
        json_response(['error' => 'submissionId and action (approve|reject) required'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM submissions WHERE id = :id AND status = :status');
    $stmt->execute([':id' => $submissionId, ':status' => 'pending']);
    $submission = $stmt->fetch();
    if (!$submission) json_response(['error' => 'no pending submission with that id'], 404);

    if ($action === 'reject') {
        $pdo->prepare(
            'UPDATE submissions SET status = :status, reviewed_by = :admin, reviewed_at = now(), review_notes = :notes WHERE id = :id'
        )->execute([
            ':status' => 'rejected',
            ':admin' => $admin['id'],
            ':notes' => $reviewNotes,
            ':id' => $submissionId,
        ]);

        $bodyHtml =
            '<p>Hi ' . htmlspecialchars($submission['submitter_name']) . ',</p>' .
            '<p>Thanks for submitting <strong>' . htmlspecialchars($submission['name']) . '</strong> to housedata.ng. ' .
            'After review, we\'re not able to publish it at this time.</p>' .
            ($reviewNotes ? '<p><strong>Notes:</strong> ' . htmlspecialchars($reviewNotes) . '</p>' : '') .
            '<p>If you believe this was a mistake or have updated information, feel free to submit again.</p>';
        send_mail($submission['submitter_email'], 'Update on your housedata.ng submission', $bodyHtml);

        json_response(['ok' => true]);
    }

    // approve
    $estateId = generate_estate_slug($pdo, $submission['name'], $submission['state']);
    $sourceNote = $submission['source_note_draft']
        ?: ('Submitted directly by ' . $submission['developer_org'] . ' — verify before relying on this.');

    $pdo->beginTransaction();

    $pdo->prepare(
        'INSERT INTO estates (
            id, name, state, lga, area, type, status, lat, lng, unit_types, units_text, price_range,
            contact_name, contact_phone, contact_email, contact_website, source_note, source, is_active
        ) VALUES (
            :id, :name, :state, :lga, :area, :type, :status, :lat, :lng, :unit_types, :units_text, :price_range,
            :contact_name, :contact_phone, :contact_email, :contact_website, :source_note, \'developer_submission\', true
        )'
    )->execute([
        ':id' => $estateId,
        ':name' => $submission['name'],
        ':state' => $submission['state'],
        ':lga' => $submission['lga'],
        ':area' => $submission['area'],
        ':type' => $submission['type'],
        ':status' => $submission['estate_status'],
        ':lat' => $submission['lat'],
        ':lng' => $submission['lng'],
        ':unit_types' => $submission['unit_types'],
        ':units_text' => $submission['units_text'],
        ':price_range' => $submission['price_range'],
        ':contact_name' => $submission['contact_name'],
        ':contact_phone' => $submission['contact_phone'],
        ':contact_email' => $submission['contact_email'],
        ':contact_website' => $submission['contact_website'],
        ':source_note' => $sourceNote,
    ]);

    $pdo->prepare(
        'UPDATE submissions SET status = :status, reviewed_by = :admin, reviewed_at = now(), created_estate_id = :eid WHERE id = :id'
    )->execute([
        ':status' => 'approved',
        ':admin' => $admin['id'],
        ':eid' => $estateId,
        ':id' => $submissionId,
    ]);

    $pdo->commit();

    $link = (defined('SESSION_COOKIE_SECURE') && SESSION_COOKIE_SECURE ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] . '/?estate=' . urlencode($estateId);
    $bodyHtml =
        '<p>Hi ' . htmlspecialchars($submission['submitter_name']) . ',</p>' .
        '<p>Good news — <strong>' . htmlspecialchars($submission['name']) . '</strong> is now live on housedata.ng.</p>' .
        '<p><a href="' . htmlspecialchars($link) . '">View the listing</a></p>';
    send_mail($submission['submitter_email'], 'Your estate is live on housedata.ng', $bodyHtml);

    json_response(['ok' => true, 'estateId' => $estateId]);
}

json_response(['error' => 'method not allowed'], 405);
