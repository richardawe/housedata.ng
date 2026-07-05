<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/phpmailer/src/Exception.php';
require_once __DIR__ . '/../vendor/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/** Sends one HTML email via the configured SMTP account. Returns true/false, never throws. */
function send_mail(string $to, string $subject, string $bodyHtml): bool {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->Port = SMTP_PORT;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        // Fail fast rather than hanging the request (and tying up a PHP
        // worker) if the SMTP host is slow or unreachable.
        $mail->Timeout = 10;

        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $bodyHtml;
        $mail->AltBody = strip_tags(str_replace(['<p>', '<br>', '<br/>', '<br />'], "\n", $bodyHtml));

        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        error_log('send_mail failed to ' . $to . ': ' . $mail->ErrorInfo);
        return false;
    }
}
