<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

$user = require_user();
if (!$user) {
    json_response(['error' => 'sign in required'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = db()->prepare('SELECT estate_id FROM bookmarks WHERE user_id = :uid ORDER BY created_at DESC');
    $stmt->execute([':uid' => $user['id']]);
    $ids = array_column($stmt->fetchAll(), 'estate_id');
    json_response(['estateIds' => $ids]);
}

if ($method === 'POST') {
    check_csrf();
    $body = json_decode(file_get_contents('php://input'), true);
    $estateId = is_array($body) ? clean_string($body['estateId'] ?? null, 80) : null;
    if (!$estateId) json_response(['error' => 'estateId required'], 400);

    db()->prepare(
        'INSERT INTO bookmarks (user_id, estate_id) VALUES (:uid, :eid) ON CONFLICT (user_id, estate_id) DO NOTHING'
    )->execute([':uid' => $user['id'], ':eid' => $estateId]);
    json_response(['ok' => true]);
}

if ($method === 'DELETE') {
    check_csrf();
    $estateId = clean_string($_GET['estateId'] ?? null, 80);
    if (!$estateId) json_response(['error' => 'estateId required'], 400);

    db()->prepare('DELETE FROM bookmarks WHERE user_id = :uid AND estate_id = :eid')
        ->execute([':uid' => $user['id'], ':eid' => $estateId]);
    json_response(['ok' => true]);
}

json_response(['error' => 'method not allowed'], 405);
