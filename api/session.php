<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';

// Issued/refreshed unconditionally, regardless of login state — this is
// how the CSRF cookie gets established before any form is used, since
// index.html is a static file with no per-request server rendering to
// inject a token into.
if (empty($_COOKIE['hd_csrf'])) {
    $csrf = bin2hex(random_bytes(24));
    setcookie('hd_csrf', $csrf, [
        'expires' => time() + 30 * 24 * 3600,
        'path' => '/',
        'secure' => defined('SESSION_COOKIE_SECURE') ? (bool) SESSION_COOKIE_SECURE : true,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    $_COOKIE['hd_csrf'] = $csrf;
}

$user = require_user();

if ($user) {
    $isAdmin = $user['is_admin'] || in_array(strtolower($user['email']), BOOTSTRAP_ADMIN_EMAILS, true);
    json_response(['loggedIn' => true, 'email' => $user['email'], 'isAdmin' => $isAdmin]);
} else {
    json_response(['loggedIn' => false]);
}
