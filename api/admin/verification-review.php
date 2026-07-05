<?php
require_once __DIR__ . '/../_db.php';
require_once __DIR__ . '/../_lib.php';

$admin = require_admin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'method not allowed'], 405);
check_csrf();

$body = json_decode(file_get_contents('php://input'), true);
$inviteId = is_array($body) ? filter_var($body['inviteId'] ?? null, FILTER_VALIDATE_INT) : null;
$action = is_array($body) ? clean_string($body['action'] ?? null, 20) : null;

if (!$inviteId || !in_array($action, ['approve', 'reject'], true)) {
    json_response(['error' => 'inviteId and action (approve|reject) required'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM verification_invites WHERE id = :id AND status = :status');
$stmt->execute([':id' => $inviteId, ':status' => 'submitted']);
$invite = $stmt->fetch();
if (!$invite) json_response(['error' => 'no pending submission with that id'], 404);

$pdo->beginTransaction();

if ($action === 'approve') {
    $pdo->prepare(
        "INSERT INTO estate_verifications (estate_id, verified_by, method, contact_person, notes, expires_at)
         VALUES (:eid, :admin, 'document_review', :person, :notes, now() + interval '1 year')"
    )->execute([
        ':eid' => $invite['estate_id'],
        ':admin' => $admin['id'],
        ':person' => $invite['contact_person'],
        ':notes' => $invite['notes'],
    ]);
    $pdo->prepare('UPDATE estates SET verified = true, verified_at = now() WHERE id = :eid')
        ->execute([':eid' => $invite['estate_id']]);
}

$pdo->prepare(
    'UPDATE verification_invites SET status = :status, reviewed_by = :admin, reviewed_at = now() WHERE id = :id'
)->execute([
    ':status' => $action === 'approve' ? 'approved' : 'rejected',
    ':admin' => $admin['id'],
    ':id' => $inviteId,
]);

$pdo->commit();
json_response(['ok' => true]);
