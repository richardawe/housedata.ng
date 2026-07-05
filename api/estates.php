<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'method not allowed'], 405);
}

/** Shapes a DB row into the same object shape data.js used to provide. */
function format_estate(array $row): array {
    $enquiryContact = $row['agency_key']
        ? ['name' => $row['agency_name'], 'phone' => $row['agency_phone'], 'email' => $row['agency_email'], 'website' => $row['agency_website']]
        : ['name' => $row['contact_name'], 'phone' => $row['contact_phone'], 'email' => $row['contact_email'], 'website' => $row['contact_website']];

    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'state' => $row['state'],
        'type' => $row['type'],
        'lat' => (float) $row['lat'],
        'lng' => (float) $row['lng'],
        'area' => $row['area'],
        'lga' => $row['lga'],
        'unitTypes' => $row['unit_types'],
        'status' => $row['status'],
        'units' => $row['units_text'],
        'priceRange' => $row['price_range'],
        'agency' => $row['agency_display_name'],
        'enquiryContact' => $enquiryContact,
        'sourceNote' => $row['source_note'],
        'verified' => (bool) $row['verified'],
        'verifiedAt' => $row['verified_at'],
    ];
}

const ESTATE_SELECT = 'SELECT e.*, a.name AS agency_name, a.phone AS agency_phone, a.email AS agency_email, a.website AS agency_website
                        FROM estates e LEFT JOIN agencies a ON a.key = e.agency_key';

$pdo = db();

$id = isset($_GET['id']) ? clean_string($_GET['id'], 80) : null;

if ($id !== null) {
    $stmt = $pdo->prepare(ESTATE_SELECT . ' WHERE e.id = :id AND e.is_active = true');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) json_response(['error' => 'not found'], 404);
    header('Cache-Control: public, max-age=300');
    json_response(format_estate($row));
}

$conditions = ['e.is_active = true'];
$params = [];

$state = (!empty($_GET['state']) && $_GET['state'] !== 'all') ? clean_string($_GET['state'], 60) : null;
if ($state) { $conditions[] = 'e.state = :state'; $params[':state'] = $state; }

$lga = (!empty($_GET['lga']) && $_GET['lga'] !== 'all') ? clean_string($_GET['lga'], 80) : null;
if ($lga) { $conditions[] = 'e.lga = :lga'; $params[':lga'] = $lga; }

$type = (!empty($_GET['type']) && $_GET['type'] !== 'all') ? clean_string($_GET['type'], 20) : null;
if ($type) { $conditions[] = 'e.type = :type'; $params[':type'] = $type; }

$status = (!empty($_GET['status']) && $_GET['status'] !== 'all') ? clean_string($_GET['status'], 20) : null;
if ($status) { $conditions[] = 'e.status = :status'; $params[':status'] = $status; }

$q = isset($_GET['q']) ? clean_string($_GET['q'], 120) : null;
if ($q !== null && trim($q) !== '') {
    $conditions[] = "e.search_vector @@ plainto_tsquery('english', housedata_normalize_for_search(:q))";
    $params[':q'] = $q;
}

$stmt = $pdo->prepare(ESTATE_SELECT . ' WHERE ' . implode(' AND ', $conditions) . ' ORDER BY e.name');
$stmt->execute($params);
$rows = $stmt->fetchAll();

header('Cache-Control: public, max-age=300');
json_response(array_map('format_estate', $rows));
