<?php
require_once __DIR__ . '/../_db.php';
require_once __DIR__ . '/../_lib.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'method not allowed'], 405);
}

$status = isset($_GET['status']) ? clean_string($_GET['status'], 20) : null;

$sql = 'SELECT * FROM leads';
$params = [];
if ($status) {
    $sql .= ' WHERE status = :status';
    $params[':status'] = $status;
}
$sql .= ' ORDER BY created_at DESC LIMIT 200';

$stmt = db()->prepare($sql);
$stmt->execute($params);
json_response(['leads' => $stmt->fetchAll()]);
