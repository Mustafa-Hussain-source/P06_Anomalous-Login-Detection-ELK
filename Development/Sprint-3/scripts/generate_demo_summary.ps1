#requires -version 5.0

param(
    [string]$BaseUrl = "http://localhost:8000",
    [int]$Limit = 300,
    [string]$OutputDir = "demo_reports"
)

$ErrorActionPreference = "Stop"

function Write-Info { Write-Host -ForegroundColor Cyan "[INFO] $args" }
function Write-Pass { Write-Host -ForegroundColor Green "[PASS] $args" }

function Add-Separator {
    param([System.Collections.Generic.List[string]]$Lines)
    $Lines.Add("--------------------------------------------------------------------------------")
}

function Invoke-ApiJson {
    param(
        [string]$Uri
    )

    $response = Invoke-WebRequest -UseBasicParsing -Method GET -Uri $Uri
    if ([int]$response.StatusCode -ne 200) {
        throw "Request failed: $Uri (status $($response.StatusCode))"
    }
    return ($response.Content | ConvertFrom-Json)
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$reportDirPath = Join-Path $projectRoot $OutputDir
if (-not (Test-Path $reportDirPath)) {
    New-Item -ItemType Directory -Path $reportDirPath | Out-Null
}

$latestPath = Join-Path $reportDirPath "backend_summary_latest.txt"

Write-Info "Fetching backend events and mitigation logs"
$events = Invoke-ApiJson -Uri "$BaseUrl/events?limit=$Limit"
$mitigations = Invoke-ApiJson -Uri "$BaseUrl/mitigations?limit=$Limit"

if (-not $events) { $events = @() }
if (-not $mitigations) { $mitigations = @() }

$eventCounts = @{}
foreach ($e in $events) {
    $key = [string]$e.event_action
    if (-not $eventCounts.ContainsKey($key)) { $eventCounts[$key] = 0 }
    $eventCounts[$key]++
}

$mitigationCounts = @{}
foreach ($m in $mitigations) {
    $key = [string]$m.action
    if (-not $mitigationCounts.ContainsKey($key)) { $mitigationCounts[$key] = 0 }
    $mitigationCounts[$key]++
}

$blockedActions = @(
    "account_locked_block",
    "geofence_violation",
    "ip_blacklist_block",
    "mfa_challenge_required"
)

$blockedEvents = @($events | Where-Object { $blockedActions -contains $_.event_action } | Select-Object -First 20)
$latestEvents = @($events | Select-Object -First 10)
$latestMitigations = @($mitigations | Select-Object -First 10)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("ALDS SPRINT 3 - BACKEND DEMO SUMMARY")
$lines.Add("Report Type : Backend Security Evidence")
$lines.Add("Generated At: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')")
$lines.Add("Source API  : $BaseUrl")
$lines.Add("Sample Size : events=$Limit, mitigations=$Limit")
$lines.Add("")
Add-Separator -Lines $lines
$lines.Add("SNAPSHOT")
Add-Separator -Lines $lines
$lines.Add("- Total events fetched: $($events.Count)")
$lines.Add("- Total mitigations fetched: $($mitigations.Count)")
$lines.Add("- Blocking evidence events (top 20 scanned): $($blockedEvents.Count)")
$lines.Add("")

Add-Separator -Lines $lines
$lines.Add("EVENT ACTION COUNTS")
Add-Separator -Lines $lines
if ($eventCounts.Count -eq 0) {
    $lines.Add("(none) : 0")
} else {
    foreach ($entry in ($eventCounts.GetEnumerator() | Sort-Object -Property Value -Descending)) {
        $lines.Add(("{0,-32} : {1,5}" -f $entry.Key, $entry.Value))
    }
}
$lines.Add("")

Add-Separator -Lines $lines
$lines.Add("MITIGATION ACTION COUNTS")
Add-Separator -Lines $lines
if ($mitigationCounts.Count -eq 0) {
    $lines.Add("(none) : 0")
} else {
    foreach ($entry in ($mitigationCounts.GetEnumerator() | Sort-Object -Property Value -Descending)) {
        $lines.Add(("{0,-32} : {1,5}" -f $entry.Key, $entry.Value))
    }
}
$lines.Add("")

Add-Separator -Lines $lines
$lines.Add("LATEST BLOCKING EVIDENCE (TOP 20)")
Add-Separator -Lines $lines
if ($blockedEvents.Count -eq 0) {
    $lines.Add("(none)")
} else {
    $lines.Add(("{0,-25} {1,-22} {2,-18} {3,-26} {4,6}" -f "timestamp", "username", "ip_address", "event_action", "risk"))
    foreach ($e in $blockedEvents) {
        $lines.Add(("{0,-25} {1,-22} {2,-18} {3,-26} {4,6}" -f $e.timestamp, $e.username, $e.ip_address, $e.event_action, $e.risk_score))
    }
}
$lines.Add("")

Add-Separator -Lines $lines
$lines.Add("LATEST EVENTS (TOP 10)")
Add-Separator -Lines $lines
if ($blockedEvents.Count -eq 0) {
    if ($latestEvents.Count -eq 0) {
        $lines.Add("(none)")
    } else {
        $lines.Add(("{0,-25} {1,-22} {2,-26} {3,-12} {4,-8}" -f "timestamp", "username", "event_action", "suspicious", "country"))
        foreach ($e in $latestEvents) {
            $lines.Add(("{0,-25} {1,-22} {2,-26} {3,-12} {4,-8}" -f $e.timestamp, $e.username, $e.event_action, $e.is_suspicious, $e.country))
        }
    }
} else {
    if ($latestEvents.Count -eq 0) {
        $lines.Add("(none)")
    } else {
        $lines.Add(("{0,-25} {1,-22} {2,-26} {3,-12} {4,-8}" -f "timestamp", "username", "event_action", "suspicious", "country"))
        foreach ($e in $latestEvents) {
            $lines.Add(("{0,-25} {1,-22} {2,-26} {3,-12} {4,-8}" -f $e.timestamp, $e.username, $e.event_action, $e.is_suspicious, $e.country))
        }
    }
}
$lines.Add("")

Add-Separator -Lines $lines
$lines.Add("LATEST MITIGATIONS (TOP 10)")
Add-Separator -Lines $lines
if ($latestMitigations.Count -eq 0) {
    $lines.Add("(none)")
} else {
    $lines.Add(("{0,-25} {1,-8} {2,-24} {3,-18} {4,-10}" -f "timestamp", "uc_id", "target_identifier", "action", "status"))
    foreach ($m in $latestMitigations) {
        $lines.Add(("{0,-25} {1,-8} {2,-24} {3,-18} {4,-10}" -f $m.timestamp, $m.uc_id, $m.target_identifier, $m.action, $m.status))
    }
}
$lines.Add("")

Add-Separator -Lines $lines
$lines.Add("DEMO INTERPRETATION")
Add-Separator -Lines $lines
$lines.Add("- Presence of account_locked_block, geofence_violation, ip_blacklist_block, and")
$lines.Add("  mfa_challenge_required indicates active enforcement in the auth flow.")
$lines.Add("- Mitigation actions account_lock, ip_block, session_kill, and mfa_stepup provide")
$lines.Add("  an auditable response trail for operational review and validation.")

Set-Content -Path $latestPath -Value $lines -Encoding UTF8
Write-Pass "Updated backend summary report: $latestPath"
