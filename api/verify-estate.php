<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

$pdo = db();

function fetch_invite(PDO $pdo, string $rawToken): ?array {
    $tokenHash = hash('sha256', $rawToken);
    $stmt = $pdo->prepare(
        'SELECT vi.*, e.name AS estate_name, e.area, e.state
         FROM verification_invites vi
         JOIN estates e ON e.id = vi.estate_id
         WHERE vi.token_hash = :hash'
    );
    $stmt->execute([':hash' => $tokenHash]);
    $invite = $stmt->fetch();
    return $invite ?: null;
}

function invite_public_status(array $invite): string {
    if (strtotime($invite['expires_at']) < time()) return 'expired';
    if ($invite['status'] !== 'pending') return $invite['status']; // submitted/approved/rejected
    return 'pending';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rawToken = $_GET['token'] ?? '';
    if (!$rawToken) json_response(['error' => 'token required'], 400);

    $invite = fetch_invite($pdo, $rawToken);
    if (!$invite) json_response(['status' => 'invalid']);

    json_response([
        'status' => invite_public_status($invite),
        'estateName' => $invite['estate_name'],
        'area' => $invite['area'],
        'state' => $invite['state'],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();

    $rawToken = clean_string($_POST['token'] ?? null, 80);
    if (!$rawToken) json_response(['error' => 'token required'], 400);

    if (!rate_limit_check('verify_estate_submit_ip', hash_ip(client_ip()), 20, 3600)) {
        json_response(['error' => 'too many attempts, try again later'], 429);
    }

    $invite = fetch_invite($pdo, $rawToken);
    if (!$invite || invite_public_status($invite) !== 'pending') {
        json_response(['error' => 'this link is invalid, expired, or already used'], 400);
    }

    $contactPerson = clean_string($_POST['contactPerson'] ?? null, 120);
    $contactPhone = clean_string($_POST['contactPhone'] ?? null, 40);
    $notes = clean_string($_POST['notes'] ?? null, 1000);

    if (!$contactPerson) json_response(['error' => 'contact person required'], 400);

    $allowedMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
    $maxBytes = 5 * 1024 * 1024;
    $savedPaths = [];

    $uploadDir = __DIR__ . '/../uploads/verification/' . $invite['estate_id'];
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        json_response(['error' => 'could not prepare upload storage'], 500);
    }

    foreach (['image1', 'image2', 'image3'] as $field) {
        if (empty($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
            json_response(['error' => 'exactly 3 photos are required'], 400);
        }
        $tmpPath = $_FILES[$field]['tmp_name'];
        if ($_FILES[$field]['size'] <= 0 || $_FILES[$field]['size'] > $maxBytes) {
            json_response(['error' => 'each photo must be under 5MB'], 400);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $tmpPath);
        finfo_close($finfo);

        if (!isset($allowedMimes[$mime]) || getimagesize($tmpPath) === false) {
            json_response(['error' => 'photos must be JPEG or PNG images'], 400);
        }

        $filename = bin2hex(random_bytes(12)) . '.' . $allowedMimes[$mime];
        $destPath = $uploadDir . '/' . $filename;
        if (!move_uploaded_file($tmpPath, $destPath)) {
            json_response(['error' => 'failed to save photo'], 500);
        }
        $savedPaths[] = '/uploads/verification/' . $invite['estate_id'] . '/' . $filename;
    }

    $pdo->prepare(
        "UPDATE verification_invites
         SET status = 'submitted', contact_person = :person, contact_phone = :phone, notes = :notes,
             image1_path = :p1, image2_path = :p2, image3_path = :p3, submitted_at = now()
         WHERE id = :id"
    )->execute([
        ':person' => $contactPerson,
        ':phone' => $contactPhone,
        ':notes' => $notes,
        ':p1' => $savedPaths[0],
        ':p2' => $savedPaths[1],
        ':p3' => $savedPaths[2],
        ':id' => $invite['id'],
    ]);

    json_response(['ok' => true]);
}

json_response(['error' => 'method not allowed'], 405);
