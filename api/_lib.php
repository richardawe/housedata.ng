<?php
/**
 * Sends a JSON response with the given status code and exits. Defaults to
 * Cache-Control: no-store, since most endpoints return session-specific or
 * otherwise dynamic data — callers that want the public estates listing's
 * 5-minute cache set their own Cache-Control header before calling this.
 */
function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    $hasCacheControl = false;
    foreach (headers_list() as $header) {
        if (stripos($header, 'Cache-Control:') === 0) { $hasCacheControl = true; break; }
    }
    if (!$hasCacheControl) {
        header('Cache-Control: no-store');
    }
    echo json_encode($data);
    exit;
}

/** Truncates and coerces to string so a payload can't blow up a query or log. */
function clean_string($value, int $maxLen = 120): ?string {
    if (!is_string($value) && !is_numeric($value)) return null;
    return mb_substr((string) $value, 0, $maxLen);
}

/**
 * Returns {id, email, is_admin} for the current hd_session cookie, or null
 * if there isn't one / it's expired / revoked. Callers must require_once
 * _db.php themselves first (same convention as every other endpoint).
 */
function require_user(): ?array {
    if (empty($_COOKIE['hd_session'])) return null;

    $tokenHash = hash('sha256', $_COOKIE['hd_session']);
    $stmt = db()->prepare(
        'SELECT u.id, u.email, u.is_admin FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.session_token_hash = :hash AND s.revoked_at IS NULL AND s.expires_at > now()'
    );
    $stmt->execute([':hash' => $tokenHash]);
    $user = $stmt->fetch();
    if (!$user) return null;

    // Touch last_seen_at at most once an hour rather than on every request.
    db()->prepare(
        "UPDATE sessions SET last_seen_at = now()
         WHERE session_token_hash = :hash AND last_seen_at < now() - interval '1 hour'"
    )->execute([':hash' => $tokenHash]);

    $user['is_admin'] = (bool) $user['is_admin'];
    return $user;
}

/** Same as require_user(), but 403s (and exits) if there's no admin session. */
function require_admin(): array {
    $user = require_user();
    if (!$user || !$user['is_admin']) {
        json_response(['error' => 'forbidden'], 403);
    }
    return $user;
}

/** Double-submit CSRF check: the header must match the readable hd_csrf cookie. 403s and exits on mismatch. */
function check_csrf(): void {
    $cookie = $_COOKIE['hd_csrf'] ?? '';
    $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($cookie === '' || $header === '' || !hash_equals($cookie, $header)) {
        json_response(['error' => 'csrf check failed'], 403);
    }
}

/** SHA-256 of the client IP, salted so raw IPs are never stored (matches the analytics privacy stance). */
function hash_ip(string $ip): string {
    return hash('sha256', RATE_LIMIT_SALT . '|' . $ip);
}

function client_ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Fixed-window rate limiter backed by the rate_limits table. Returns true
 * if this request is still within the allowed count for the current
 * window, false if the caller should be rejected/ignored. $identifier is
 * hashed internally, so pass the raw IP/email — never a pre-hashed value.
 */
function rate_limit_check(string $bucket, string $identifier, int $maxPerWindow, int $windowSeconds): bool {
    $identifierHash = hash('sha256', RATE_LIMIT_SALT . '|' . strtolower($identifier));
    $windowStartTs = intdiv(time(), $windowSeconds) * $windowSeconds;
    $windowStart = gmdate('Y-m-d H:i:s', $windowStartTs);

    $stmt = db()->prepare(
        'INSERT INTO rate_limits (bucket, identifier_hash, window_start, count)
         VALUES (:bucket, :idh, :ws, 1)
         ON CONFLICT (bucket, identifier_hash, window_start)
         DO UPDATE SET count = rate_limits.count + 1
         RETURNING count'
    );
    $stmt->execute([':bucket' => $bucket, ':idh' => $identifierHash, ':ws' => $windowStart]);
    $row = $stmt->fetch();
    return ((int) $row['count']) <= $maxPerWindow;
}
