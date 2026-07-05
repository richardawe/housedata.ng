<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

$user = require_user();
if (!$user) {
    json_response(['error' => 'sign in required'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = db()->prepare(
        'SELECT id, name, filters, is_active, created_at FROM saved_searches WHERE user_id = :uid ORDER BY created_at DESC'
    );
    $stmt->execute([':uid' => $user['id']]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['filters'] = json_decode($row['filters'], true);
        $row['is_active'] = (bool) $row['is_active'];
    }
    json_response(['savedSearches' => $rows]);
}

if ($method === 'POST') {
    check_csrf();
    $body = json_decode(file_get_contents('php://input'), true);
    $name = is_array($body) ? clean_string($body['name'] ?? null, 120) : null;
    $filters = is_array($body) ? ($body['filters'] ?? null) : null;

    if (!is_array($filters)) json_response(['error' => 'filters required'], 400);

    // Only keep the fields app.js's `state` object actually tracks, so an
    // arbitrary payload can't get stored verbatim.
    $cleanFilters = [
        'status' => clean_string($filters['status'] ?? 'all', 30),
        'type' => clean_string($filters['type'] ?? 'all', 20),
        'stateFilter' => clean_string($filters['stateFilter'] ?? 'all', 60),
        'area' => clean_string($filters['area'] ?? 'all', 80),
        'query' => clean_string($filters['query'] ?? '', 120),
    ];

    $stmt = db()->prepare(
        'INSERT INTO saved_searches (user_id, name, filters) VALUES (:uid, :name, :filters)
         RETURNING id, name, filters, is_active, created_at'
    );
    $stmt->execute([':uid' => $user['id'], ':name' => $name, ':filters' => json_encode($cleanFilters)]);
    $row = $stmt->fetch();
    $row['filters'] = json_decode($row['filters'], true);
    $row['is_active'] = (bool) $row['is_active'];
    json_response($row, 201);
}

if ($method === 'DELETE') {
    check_csrf();
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if (!$id) json_response(['error' => 'id required'], 400);

    db()->prepare('DELETE FROM saved_searches WHERE id = :id AND user_id = :uid')
        ->execute([':id' => $id, ':uid' => $user['id']]);
    json_response(['ok' => true]);
}

json_response(['error' => 'method not allowed'], 405);
