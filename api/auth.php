<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';
require_once __DIR__ . '/mailer.php';

function cookie_secure(): bool {
    return defined('SESSION_COOKIE_SECURE') ? (bool) SESSION_COOKIE_SECURE : true;
}

function json_body(): array {
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

$action = $_GET['action'] ?? '';

if ($action === 'request') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'method not allowed'], 405);
    check_csrf();

    $body = json_body();
    $email = clean_string($body['email'] ?? null, 200);
    $redirectTo = clean_string($body['redirectTo'] ?? null, 200);

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'invalid email'], 400);
    }

    // Always return the same generic response below regardless of what
    // happens past this point, so this endpoint can't be used to check
    // whether an email has an account (and rate-limited requests fail
    // silently rather than revealing the limit was hit).
    $ipOk = rate_limit_check('magic_link_request_ip', hash_ip(client_ip()), 20, 3600);
    $emailOk = rate_limit_check('magic_link_request_email', $email, 5, 3600);

    if ($ipOk && $emailOk) {
        $pdo = db();
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT id FROM users WHERE lower(email) = lower(:email)');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            $insert = $pdo->prepare('INSERT INTO users (email) VALUES (:email) RETURNING id');
            $insert->execute([':email' => $email]);
            $user = $insert->fetch();
        }

        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);

        $pdo->prepare(
            "INSERT INTO magic_link_tokens (user_id, token_hash, purpose, redirect_to, expires_at, requested_ip_hash)
             VALUES (:uid, :hash, 'login', :redirect, now() + interval '15 minutes', :iph)"
        )->execute([
            ':uid' => $user['id'],
            ':hash' => $tokenHash,
            ':redirect' => $redirectTo,
            ':iph' => hash_ip(client_ip()),
        ]);
        $pdo->commit();

        $link = (cookie_secure() ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] . '/api/auth.php?action=verify&token=' . $rawToken;
        $bodyHtml =
            '<p>Click below to sign in to housedata.ng. This link expires in 15 minutes and works once.</p>' .
            '<p><a href="' . htmlspecialchars($link) . '">Sign in to housedata.ng</a></p>' .
            '<p>If you didn\'t request this, you can ignore this email.</p>';
        send_mail($email, 'Sign in to housedata.ng', $bodyHtml);
    }

    json_response(['ok' => true]);
}

/** Looks up a magic link token by its raw value, or null if unusable. */
function lookup_usable_token(PDO $pdo, string $rawToken): ?array {
    $tokenHash = hash('sha256', $rawToken);
    $stmt = $pdo->prepare('SELECT * FROM magic_link_tokens WHERE token_hash = :hash');
    $stmt->execute([':hash' => $tokenHash]);
    $token = $stmt->fetch();
    if (!$token || $token['used_at'] !== null || strtotime($token['expires_at']) < time()) {
        return null;
    }
    return $token;
}

/**
 * Renders a same-origin, one-click confirmation page instead of completing
 * login on the bare GET. Some email providers/security scanners auto-visit
 * links in emails to check for malware before a human ever clicks — since
 * this token is single-use, that alone would silently burn it. Requiring
 * an explicit button click (a JS-driven POST) defeats that: scanners fetch
 * the URL but don't execute JS or click buttons.
 */
function render_confirm_page(string $rawToken): void {
    header('Content-Type: text/html; charset=UTF-8');
    ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirm sign-in — Housedata.ng</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="ab-body">
<main class="ab-main" style="max-width:480px;margin:80px auto;text-align:center;">
  <h1 class="ab-h2">Confirm sign-in</h1>
  <p class="ab-lede">Click below to finish signing in to housedata.ng.</p>
  <button type="button" class="finance-btn finance-btn-primary" id="confirm-btn">Finish signing in</button>
</main>
<script>
(function () {
  var rawToken = <?php echo json_encode($rawToken); ?>;
  function getCsrfCookie() {
    var match = document.cookie.match(/(?:^|;\s*)hd_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
  document.getElementById("confirm-btn").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    fetch("/api/session.php")
      .then(function () {
        return fetch("/api/auth.php?action=complete", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfCookie() },
          body: JSON.stringify({ token: rawToken })
        });
      })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) {
          window.location.href = "/?login=error";
          return;
        }
        window.location.href = result.data.redirectTo || "/";
      })
      .catch(function () {
        window.location.href = "/?login=error";
      });
  });
})();
</script>
</body>
</html>
    <?php
    exit;
}

if ($action === 'verify') {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(['error' => 'method not allowed'], 405);

    $rawToken = $_GET['token'] ?? '';
    if (!$rawToken || !lookup_usable_token(db(), $rawToken)) {
        header('Location: /?login=error');
        exit;
    }

    render_confirm_page($rawToken);
}

if ($action === 'complete') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'method not allowed'], 405);
    check_csrf();

    $body = json_body();
    $rawToken = clean_string($body['token'] ?? null, 80);
    $pdo = db();
    $token = $rawToken ? lookup_usable_token($pdo, $rawToken) : null;
    if (!$token) json_response(['error' => 'invalid or expired'], 400);

    $tokenHash = hash('sha256', $rawToken);
    $pdo->beginTransaction();
    $pdo->prepare('UPDATE magic_link_tokens SET used_at = now() WHERE token_hash = :hash')
        ->execute([':hash' => $tokenHash]);

    $sessionRaw = bin2hex(random_bytes(32));
    $sessionHash = hash('sha256', $sessionRaw);
    $pdo->prepare(
        "INSERT INTO sessions (session_token_hash, user_id, expires_at) VALUES (:hash, :uid, now() + interval '30 days')"
    )->execute([':hash' => $sessionHash, ':uid' => $token['user_id']]);
    $pdo->prepare('UPDATE users SET last_login_at = now() WHERE id = :id')
        ->execute([':id' => $token['user_id']]);
    $pdo->commit();

    setcookie('hd_session', $sessionRaw, [
        'expires' => time() + 30 * 24 * 3600,
        'path' => '/',
        'secure' => cookie_secure(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    json_response(['ok' => true, 'redirectTo' => $token['redirect_to'] ?: '/']);
}

if ($action === 'logout') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'method not allowed'], 405);
    check_csrf();

    if (!empty($_COOKIE['hd_session'])) {
        $hash = hash('sha256', $_COOKIE['hd_session']);
        db()->prepare('UPDATE sessions SET revoked_at = now() WHERE session_token_hash = :hash')
            ->execute([':hash' => $hash]);
    }
    setcookie('hd_session', '', ['expires' => time() - 3600, 'path' => '/']);
    json_response(['ok' => true]);
}

json_response(['error' => 'unknown action'], 400);
