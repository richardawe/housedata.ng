<?php
/**
 * Template for api/config.php, which is gitignored and must be created
 * once directly on the server (cPanel File Manager or SFTP) — never via
 * a git commit or the deploy workflow. Copy this file to config.php on
 * the server and fill in real values.
 *
 * Same handling as the FTP/analytics secrets documented in README.md:
 * real credentials only ever exist as GitHub Actions repo secrets or,
 * for this file, as an untracked file on the server itself.
 */

// Postgres connection (from cPanel's "PostgreSQL Databases" tool).
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'your_db_name');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// SMTP (e.g. a Gmail account with an App Password, or any SMTP provider).
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'you@example.com');
define('SMTP_PASS', 'your_app_password');
define('SMTP_FROM', 'you@example.com');
define('SMTP_FROM_NAME', 'Housedata.ng');

// Random string used only to salt hashed IPs for rate limiting — never
// used for anything security-critical, just needs to be unique per
// deployment. Generate with: php -r "echo bin2hex(random_bytes(32));"
define('RATE_LIMIT_SALT', 'change_me');

// Set true once the site is confirmed served over HTTPS (see README's
// SSL note) so auth/session cookies are marked Secure.
define('SESSION_COOKIE_SECURE', true);
