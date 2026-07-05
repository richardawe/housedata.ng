<?php
/** Sends a JSON response with the given status code and exits. */
function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/** Truncates and coerces to string so a payload can't blow up a query or log. */
function clean_string($value, int $maxLen = 120): ?string {
    if (!is_string($value) && !is_numeric($value)) return null;
    return mb_substr((string) $value, 0, $maxLen);
}
