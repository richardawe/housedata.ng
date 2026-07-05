<?php
/**
 * One-time import of data.js's estates/agencies into Postgres. CLI-only —
 * refuses to run over HTTP so it can't be triggered as a web request.
 *
 * Usage (from the repo root, after running scripts/dump-data-js.js):
 *   php scripts/import-data-js.php
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING, so it only ever adds rows
 * that don't already exist by id/key.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    echo "This script is CLI-only.\n";
    exit(1);
}

require_once __DIR__ . '/../api/_db.php';

$agenciesPath = __DIR__ . '/agencies.json';
$estatesPath = __DIR__ . '/estates.json';

if (!file_exists($agenciesPath) || !file_exists($estatesPath)) {
    fwrite(STDERR, "Missing scripts/agencies.json or scripts/estates.json — run `node scripts/dump-data-js.js` first.\n");
    exit(1);
}

$agencies = json_decode(file_get_contents($agenciesPath), true);
$estates = json_decode(file_get_contents($estatesPath), true);

if (!is_array($agencies) || !is_array($estates)) {
    fwrite(STDERR, "Failed to parse agencies.json/estates.json.\n");
    exit(1);
}

$pdo = db();
$pdo->beginTransaction();

try {
    $agencyStmt = $pdo->prepare(
        'INSERT INTO agencies (key, name, phone, email, website)
         VALUES (:key, :name, :phone, :email, :website)
         ON CONFLICT (key) DO NOTHING'
    );
    foreach ($agencies as $key => $a) {
        $agencyStmt->execute([
            ':key' => $key,
            ':name' => $a['name'],
            ':phone' => $a['phone'] ?? null,
            ':email' => $a['email'] ?? null,
            ':website' => $a['website'] ?? null,
        ]);
    }

    $estateStmt = $pdo->prepare(
        'INSERT INTO estates (
            id, name, state, lga, area, type, status, lat, lng,
            unit_types, units_text, price_range, agency_key,
            contact_name, contact_phone, contact_email, contact_website,
            source_note, source
        ) VALUES (
            :id, :name, :state, :lga, :area, :type, :status, :lat, :lng,
            :unit_types, :units_text, :price_range, :agency_key,
            :contact_name, :contact_phone, :contact_email, :contact_website,
            :source_note, \'seed\'
        ) ON CONFLICT (id) DO NOTHING'
    );
    foreach ($estates as $e) {
        $contact = $e['contact'] ?? null;
        $estateStmt->execute([
            ':id' => $e['id'],
            ':name' => $e['name'],
            ':state' => $e['state'],
            ':lga' => $e['lga'],
            ':area' => $e['area'],
            ':type' => $e['type'],
            ':status' => $e['status'],
            ':lat' => $e['lat'],
            ':lng' => $e['lng'],
            ':unit_types' => $e['unitTypes'] ?? null,
            ':units_text' => $e['units'] ?? null,
            ':price_range' => $e['priceRange'] ?? null,
            ':agency_key' => $e['agencyKey'] ?? null,
            ':contact_name' => $contact['name'] ?? null,
            ':contact_phone' => $contact['phone'] ?? null,
            ':contact_email' => $contact['email'] ?? null,
            ':contact_website' => $contact['website'] ?? null,
            ':source_note' => $e['sourceNote'] ?? null,
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, "Import failed, rolled back: " . $e->getMessage() . "\n");
    exit(1);
}

$countRow = $pdo->query('SELECT count(*) AS n FROM estates')->fetch();
$govRow = $pdo->query("SELECT count(*) AS n FROM estates WHERE type = 'Government'")->fetch();
$privRow = $pdo->query("SELECT count(*) AS n FROM estates WHERE type = 'Private'")->fetch();
$agencyCountRow = $pdo->query('SELECT count(*) AS n FROM agencies')->fetch();

printf(
    "Imported. estates=%d (Government=%d / Private=%d), agencies=%d\n",
    $countRow['n'], $govRow['n'], $privRow['n'], $agencyCountRow['n']
);

$expectedTotal = count($estates);
if ((int) $countRow['n'] !== $expectedTotal) {
    fwrite(STDERR, "WARNING: expected $expectedTotal estates in source JSON, table has {$countRow['n']} — check for id collisions or a partial prior import.\n");
    exit(1);
}
