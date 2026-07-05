<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'method not allowed'], 405);
}
check_csrf();

$body = json_decode(file_get_contents('php://input'), true);
$body = is_array($body) ? $body : [];

// Honeypot: real users never fill this (hidden off-screen). Pretend
// success and drop it silently rather than telling a bot it worked.
if (!empty($body['company'])) {
    json_response(['ok' => true]);
}

$name = clean_string($body['name'] ?? null, 200);
$state = clean_string($body['state'] ?? null, 60);
$lga = clean_string($body['lga'] ?? null, 80);
$area = clean_string($body['area'] ?? null, 200);
$type = in_array($body['type'] ?? null, ['Government', 'Private'], true) ? $body['type'] : 'Private';
$estateStatus = in_array($body['estateStatus'] ?? null, ['Completed', 'Announced', 'Planned', 'In Progress', 'Stalled'], true)
    ? $body['estateStatus'] : 'Announced';
$lat = filter_var($body['lat'] ?? null, FILTER_VALIDATE_FLOAT);
$lng = filter_var($body['lng'] ?? null, FILTER_VALIDATE_FLOAT);
$unitTypes = clean_string($body['unitTypes'] ?? null, 200);
$unitsText = clean_string($body['unitsText'] ?? null, 100);
$priceRange = clean_string($body['priceRange'] ?? null, 200);
$developerOrg = clean_string($body['developerOrg'] ?? null, 200);
$submitterName = clean_string($body['submitterName'] ?? null, 120);
$submitterEmail = clean_string($body['submitterEmail'] ?? null, 200);
$submitterPhone = clean_string($body['submitterPhone'] ?? null, 40);
$contactName = clean_string($body['contactName'] ?? null, 200);
$contactPhone = clean_string($body['contactPhone'] ?? null, 60);
$contactEmail = clean_string($body['contactEmail'] ?? null, 200);
$contactWebsite = clean_string($body['contactWebsite'] ?? null, 200);
$sourceNoteDraft = clean_string($body['sourceNoteDraft'] ?? null, 500);

$required = [$name, $state, $lga, $area, $developerOrg, $submitterName, $submitterEmail];
if (in_array(null, $required, true) || in_array('', $required, true) || $lat === false || $lng === false) {
    json_response(['error' => 'name, state, LGA, area, developer/org, your name, your email, and coordinates are required'], 400);
}
if (!filter_var($submitterEmail, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'a valid email is required'], 400);
}
if ($lat < 4 || $lat > 14 || $lng < 2 || $lng > 15) {
    json_response(['error' => 'coordinates look outside Nigeria — double-check them'], 400);
}

if (!rate_limit_check('submission_ip', hash_ip(client_ip()), 5, 3600)) {
    json_response(['error' => 'too many submissions — try again later'], 429);
}

db()->prepare(
    'INSERT INTO submissions (
        name, state, lga, area, type, estate_status, lat, lng, unit_types, units_text, price_range,
        developer_org, submitter_name, submitter_email, submitter_phone,
        contact_name, contact_phone, contact_email, contact_website, source_note_draft, submitter_ip_hash
    ) VALUES (
        :name, :state, :lga, :area, :type, :estate_status, :lat, :lng, :unit_types, :units_text, :price_range,
        :developer_org, :submitter_name, :submitter_email, :submitter_phone,
        :contact_name, :contact_phone, :contact_email, :contact_website, :source_note_draft, :iph
    )'
)->execute([
    ':name' => $name,
    ':state' => $state,
    ':lga' => $lga,
    ':area' => $area,
    ':type' => $type,
    ':estate_status' => $estateStatus,
    ':lat' => $lat,
    ':lng' => $lng,
    ':unit_types' => $unitTypes,
    ':units_text' => $unitsText,
    ':price_range' => $priceRange,
    ':developer_org' => $developerOrg,
    ':submitter_name' => $submitterName,
    ':submitter_email' => $submitterEmail,
    ':submitter_phone' => $submitterPhone,
    ':contact_name' => $contactName,
    ':contact_phone' => $contactPhone,
    ':contact_email' => $contactEmail,
    ':contact_website' => $contactWebsite,
    ':source_note_draft' => $sourceNoteDraft,
    ':iph' => hash_ip(client_ip()),
]);

json_response(['ok' => true]);
