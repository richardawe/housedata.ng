<?php
/**
 * Minimal self-hosted event logger for housedata.ng. No third-party
 * analytics service — events are appended as JSON lines to a local file,
 * rotated monthly. Privacy by default: no IP address, no user agent
 * string, and no persistent cookie is stored — the client sends a random
 * session id that resets every browser session (see analytics.js).
 */

header('Content-Type: application/json');

// Only same-origin POSTs are meaningful here; this isn't a public API.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid payload']);
    exit;
}

// Allowlist of event types this endpoint will accept. Anything else is
// silently dropped rather than logged, so this can't become an arbitrary
// write vector.
$allowedTypes = [
    'pageview', 'filter_state', 'filter_type', 'filter_status',
    'view_toggle', 'estate_click', 'infra_toggle', 'calc_open',
    'about_mreif_open', 'access_bank_click', 'ab_calc_used'
];

$type = isset($input['type']) ? (string) $input['type'] : '';
if (!in_array($type, $allowedTypes, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'unknown event type']);
    exit;
}

/** Truncate and coerce to string so a payload can't blow up the log file. */
function clean_string($value, $maxLen = 120) {
    if (!is_string($value) && !is_numeric($value)) return null;
    $s = (string) $value;
    return mb_substr($s, 0, $maxLen);
}

$sessionId = clean_string($input['session'] ?? null, 40);
$page = clean_string($input['page'] ?? null, 80);
$device = clean_string($input['device'] ?? null, 12);

// Free-form per-event fields, still length- and depth-limited.
$data = [];
if (isset($input['data']) && is_array($input['data'])) {
    $i = 0;
    foreach ($input['data'] as $key => $value) {
        if ($i++ >= 8) break; // cap number of fields
        $k = clean_string($key, 40);
        $v = clean_string(is_array($value) ? '' : $value, 120);
        if ($k !== null) $data[$k] = $v;
    }
}

$event = [
    'ts' => gmdate('c'),
    'type' => $type,
    'page' => $page,
    'session' => $sessionId,
    'device' => $device,
    'data' => $data,
];

$dir = __DIR__ . '/analytics-data';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

$file = $dir . '/events-' . gmdate('Y-m') . '.jsonl';
file_put_contents($file, json_encode($event) . "\n", FILE_APPEND | LOCK_EX);

http_response_code(204);
