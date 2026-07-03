<?php
/**
 * Aggregates the raw event logs into a summary for the dashboard. Reads
 * every analytics-data/events-*.jsonl file — small-scale civic site, so
 * no database needed. This file lives inside dashboard/, which you
 * should password-protect via cPanel's "Directory Privacy" tool before
 * this data is meaningful to keep private (see README).
 */

header('Content-Type: application/json');

$dataDir = dirname(__DIR__) . '/analytics-data';
$files = is_dir($dataDir) ? glob($dataDir . '/events-*.jsonl') : [];
sort($files);

// Keep at most the last 6 months of log files to bound how much this
// script has to read as the site accumulates history.
$files = array_slice($files, -6);

$totalPageviews = 0;
$pageviewsByPage = [];
$sessions = [];
$dailyPageviews = []; // 'Y-m-d' => count
$statesFiltered = [];
$typeFilters = [];
$statusFilters = [];
$viewToggles = [];
$estateClicks = []; // id => count
$infraToggleOn = 0;
$calcOpens = 0;
$aboutMreifOpens = 0;
$accessBankClicks = 0;
$abCalcUsed = 0;
$deviceCounts = [];

foreach ($files as $file) {
    $handle = fopen($file, 'r');
    if (!$handle) continue;
    while (($line = fgets($handle)) !== false) {
        $line = trim($line);
        if ($line === '') continue;
        $event = json_decode($line, true);
        if (!is_array($event) || !isset($event['type'])) continue;

        $type = $event['type'];
        $ts = $event['ts'] ?? null;
        $day = $ts ? substr($ts, 0, 10) : null;
        $session = $event['session'] ?? null;
        $device = $event['device'] ?? 'unknown';
        $data = is_array($event['data'] ?? null) ? $event['data'] : [];

        if ($session) $sessions[$session] = true;
        if ($device) $deviceCounts[$device] = ($deviceCounts[$device] ?? 0) + 1;

        switch ($type) {
            case 'pageview':
                $totalPageviews++;
                $page = $event['page'] ?? 'unknown';
                $pageviewsByPage[$page] = ($pageviewsByPage[$page] ?? 0) + 1;
                if ($day) $dailyPageviews[$day] = ($dailyPageviews[$day] ?? 0) + 1;
                break;
            case 'filter_state':
                $v = $data['value'] ?? 'unknown';
                $statesFiltered[$v] = ($statesFiltered[$v] ?? 0) + 1;
                break;
            case 'filter_type':
                $v = $data['value'] ?? 'unknown';
                $typeFilters[$v] = ($typeFilters[$v] ?? 0) + 1;
                break;
            case 'filter_status':
                $v = $data['value'] ?? 'unknown';
                $statusFilters[$v] = ($statusFilters[$v] ?? 0) + 1;
                break;
            case 'view_toggle':
                $v = $data['value'] ?? 'unknown';
                $viewToggles[$v] = ($viewToggles[$v] ?? 0) + 1;
                break;
            case 'estate_click':
                $id = $data['id'] ?? 'unknown';
                $estateClicks[$id] = ($estateClicks[$id] ?? 0) + 1;
                break;
            case 'infra_toggle':
                if (($data['on'] ?? '0') === '1') $infraToggleOn++;
                break;
            case 'calc_open':
                $calcOpens++;
                break;
            case 'about_mreif_open':
                $aboutMreifOpens++;
                break;
            case 'access_bank_click':
                $accessBankClicks++;
                break;
            case 'ab_calc_used':
                $abCalcUsed++;
                break;
        }
    }
    fclose($handle);
}

arsort($statesFiltered);
arsort($estateClicks);
ksort($dailyPageviews);
$dailyPageviews = array_slice($dailyPageviews, -30, null, true);

echo json_encode([
    'generatedAt' => gmdate('c'),
    'totalPageviews' => $totalPageviews,
    'uniqueSessions' => count($sessions),
    'pageviewsByPage' => $pageviewsByPage,
    'dailyPageviews' => $dailyPageviews,
    'deviceCounts' => $deviceCounts,
    'topStatesFiltered' => array_slice($statesFiltered, 0, 15, true),
    'typeFilters' => $typeFilters,
    'statusFilters' => $statusFilters,
    'viewToggles' => $viewToggles,
    'topEstateClicks' => array_slice($estateClicks, 0, 10, true),
    'infraToggleOnCount' => $infraToggleOn,
    'financing' => [
        'calculatorOpens' => $calcOpens,
        'aboutMreifOpens' => $aboutMreifOpens,
        'accessBankClicks' => $accessBankClicks,
        'accessBankCalculatorUsed' => $abCalcUsed
    ]
]);
