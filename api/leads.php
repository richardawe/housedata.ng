<?php
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_lib.php';
require_once __DIR__ . '/mailer.php';

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

$financierId = filter_var($body['financierId'] ?? null, FILTER_VALIDATE_INT);
$applicantName = clean_string($body['applicantName'] ?? null, 120);
$applicantEmail = clean_string($body['applicantEmail'] ?? null, 200);
$applicantPhone = clean_string($body['applicantPhone'] ?? null, 40);
$estateId = clean_string($body['estateId'] ?? null, 80);
$estateName = clean_string($body['estateName'] ?? null, 200) ?: 'General financing inquiry';
$loanContext = is_array($body['loanContext'] ?? null) ? $body['loanContext'] : null;

if (!$financierId || !$applicantName || !$applicantEmail || !filter_var($applicantEmail, FILTER_VALIDATE_EMAIL) || !$applicantPhone) {
    json_response(['error' => 'name, a valid email, phone, and a lender are required'], 400);
}

if (!rate_limit_check('lead_submit_ip', hash_ip(client_ip()), 10, 3600)) {
    json_response(['error' => 'too many submissions — try again later'], 429);
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id, name, contact_email FROM financiers WHERE id = :id AND is_active = true');
$stmt->execute([':id' => $financierId]);
$financier = $stmt->fetch();
if (!$financier) json_response(['error' => 'invalid lender selected'], 400);

// If an estateId was passed, trust the DB's own name over whatever the
// client sent — avoids a mismatched/spoofed estateName being stored
// against a real estateId.
if ($estateId) {
    $estStmt = $pdo->prepare('SELECT name FROM estates WHERE id = :id AND is_active = true');
    $estStmt->execute([':id' => $estateId]);
    $estateRow = $estStmt->fetch();
    if ($estateRow) {
        $estateName = $estateRow['name'];
    } else {
        $estateId = null;
    }
}

$insert = $pdo->prepare(
    'INSERT INTO leads (estate_id, estate_name_snapshot, financier_id, financier_name_snapshot,
                         applicant_name, applicant_email, applicant_phone, loan_context, ip_hash)
     VALUES (:eid, :ename, :fid, :fname, :aname, :aemail, :aphone, :ctx, :iph)
     RETURNING id'
);
$insert->execute([
    ':eid' => $estateId,
    ':ename' => $estateName,
    ':fid' => $financier['id'],
    ':fname' => $financier['name'],
    ':aname' => $applicantName,
    ':aemail' => $applicantEmail,
    ':aphone' => $applicantPhone,
    ':ctx' => $loanContext ? json_encode($loanContext) : null,
    ':iph' => hash_ip(client_ip()),
]);
$leadId = $insert->fetch()['id'];

$contextLines = '';
if ($loanContext) {
    foreach ($loanContext as $key => $value) {
        $contextLines .= '<li>' . htmlspecialchars((string) $key) . ': ' . htmlspecialchars((string) $value) . '</li>';
    }
}

$bodyHtml =
    '<p>New financing lead from housedata.ng</p>' .
    '<p><strong>Estate:</strong> ' . htmlspecialchars($estateName) . '</p>' .
    '<p><strong>Applicant:</strong> ' . htmlspecialchars($applicantName) . '<br>' .
    'Email: ' . htmlspecialchars($applicantEmail) . '<br>' .
    'Phone: ' . htmlspecialchars($applicantPhone) . '</p>' .
    ($contextLines ? '<p><strong>Loan estimate context:</strong></p><ul>' . $contextLines . '</ul>' : '') .
    '<p>This lead was captured via housedata.ng\'s mortgage calculator. housedata.ng is not a lender and makes no guarantee about this applicant.</p>';

$sent = send_mail($financier['contact_email'], 'New financing lead: ' . $estateName, $bodyHtml);

$pdo->prepare(
    'UPDATE leads SET status = :status, email_sent_at = :sent_at, email_error = :err WHERE id = :id'
)->execute([
    ':status' => $sent ? 'sent' : 'failed',
    ':sent_at' => $sent ? gmdate('Y-m-d H:i:s') : null,
    ':err' => $sent ? null : 'send_mail failed',
    ':id' => $leadId,
]);

json_response(['ok' => true]);
