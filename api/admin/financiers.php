<?php
require_once __DIR__ . '/../_db.php';
require_once __DIR__ . '/../_lib.php';

require_admin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT * FROM financiers ORDER BY name');
    json_response(['financiers' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $body = json_decode(file_get_contents('php://input'), true);
    $body = is_array($body) ? $body : [];

    $name = clean_string($body['name'] ?? null, 200);
    $email = clean_string($body['contactEmail'] ?? null, 200);
    $phone = clean_string($body['contactPhone'] ?? null, 40);
    $notes = clean_string($body['notes'] ?? null, 500);

    if (!$name || !$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'name and a valid contact email are required'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO financiers (name, contact_email, contact_phone, notes) VALUES (:name, :email, :phone, :notes) RETURNING id'
    );
    $stmt->execute([':name' => $name, ':email' => $email, ':phone' => $phone, ':notes' => $notes]);
    json_response(['ok' => true, 'id' => $stmt->fetch()['id']]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    check_csrf();
    $body = json_decode(file_get_contents('php://input'), true);
    $body = is_array($body) ? $body : [];
    $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) json_response(['error' => 'id required'], 400);

    $fields = [];
    $params = [':id' => $id];
    if (array_key_exists('name', $body)) { $fields[] = 'name = :name'; $params[':name'] = clean_string($body['name'], 200); }
    if (array_key_exists('contactEmail', $body)) { $fields[] = 'contact_email = :email'; $params[':email'] = clean_string($body['contactEmail'], 200); }
    if (array_key_exists('contactPhone', $body)) { $fields[] = 'contact_phone = :phone'; $params[':phone'] = clean_string($body['contactPhone'], 40); }
    if (array_key_exists('notes', $body)) { $fields[] = 'notes = :notes'; $params[':notes'] = clean_string($body['notes'], 500); }
    if (array_key_exists('isActive', $body)) { $fields[] = 'is_active = :active'; $params[':active'] = $body['isActive'] ? 't' : 'f'; }
    if (!$fields) json_response(['error' => 'nothing to update'], 400);
    $fields[] = 'updated_at = now()';

    $pdo->prepare('UPDATE financiers SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($params);
    json_response(['ok' => true]);
}

json_response(['error' => 'method not allowed'], 405);
