<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'method not allowed'], 405);
}

$stmt = db()->query('SELECT id, name FROM financiers WHERE is_active = true ORDER BY name');
header('Cache-Control: public, max-age=300');
json_response($stmt->fetchAll());
