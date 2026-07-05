<?php
require_once __DIR__ . '/../_db.php';
require_once __DIR__ . '/../_lib.php';
require_once __DIR__ . '/../mailer.php';

$admin = require_admin();
$pdo = db();

/** Same contact resolution as api/estates.php's format_estate(), just the email. */
function resolve_contact_email(array $estateRow): ?string {
    return $estateRow['agency_key'] ? $estateRow['agency_email'] : $estateRow['contact_email'];
}

const ESTATE_SELECT = 'SELECT e.id, e.name, e.agency_key, e.contact_email, a.email AS agency_email
                        FROM estates e LEFT JOIN agencies a ON a.key = e.agency_key';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status = isset($_GET['status']) ? clean_string($_GET['status'], 20) : null;
    $sql = 'SELECT vi.id, vi.estate_id, e.name AS estate_name, vi.contact_email, vi.status,
                   vi.contact_person, vi.contact_phone, vi.notes,
                   vi.image1_path, vi.image2_path, vi.image3_path,
                   vi.created_at, vi.expires_at, vi.submitted_at, vi.reviewed_at
            FROM verification_invites vi
            JOIN estates e ON e.id = vi.estate_id';
    $params = [];
    if ($status) {
        $sql .= ' WHERE vi.status = :status';
        $params[':status'] = $status;
    }
    $sql .= ' ORDER BY vi.created_at DESC LIMIT 200';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    json_response(['invites' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $body = json_decode(file_get_contents('php://input'), true);
    $estateId = is_array($body) ? clean_string($body['estateId'] ?? null, 80) : null;
    if (!$estateId) json_response(['error' => 'estateId required'], 400);

    $stmt = $pdo->prepare(ESTATE_SELECT . ' WHERE e.id = :id AND e.is_active = true');
    $stmt->execute([':id' => $estateId]);
    $estate = $stmt->fetch();
    if (!$estate) json_response(['error' => 'estate not found'], 404);

    $email = resolve_contact_email($estate);
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'no contact email on file for this estate'], 400);
    }

    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);

    $pdo->prepare(
        "INSERT INTO verification_invites (estate_id, token_hash, invited_by, contact_email, expires_at)
         VALUES (:eid, :hash, :admin, :email, now() + interval '7 days')"
    )->execute([
        ':eid' => $estateId,
        ':hash' => $tokenHash,
        ':admin' => $admin['id'],
        ':email' => $email,
    ]);

    $link = 'https://' . $_SERVER['HTTP_HOST'] . '/verify-estate.html?token=' . $rawToken;
    $bodyHtml =
        '<p>Hi,</p>' .
        '<p>Housedata.ng lists <strong>' . htmlspecialchars($estate['name']) . '</strong> as a housing estate, compiled from public sources. ' .
        'We\'d like to verify these details directly with you and mark the listing as agency/developer-confirmed.</p>' .
        '<p><a href="' . htmlspecialchars($link) . '">Confirm your listing on housedata.ng</a></p>' .
        '<p>It takes a couple of minutes: confirm a contact person/phone, and upload 3 photos of the estate. ' .
        'A team member reviews every submission before the listing is marked Verified. This link expires in 7 days and works once.</p>' .
        '<p>If this isn\'t your listing or you\'d rather not participate, you can ignore this email.</p>';
    send_mail($email, 'Verify your listing on housedata.ng', $bodyHtml);

    json_response(['ok' => true, 'sentTo' => $email]);
}

json_response(['error' => 'method not allowed'], 405);
