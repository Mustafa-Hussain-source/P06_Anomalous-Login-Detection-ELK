#requires -version 5.0

param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Write-Pass { Write-Host -ForegroundColor Green "[PASS] $args" }
function Write-Fail { Write-Host -ForegroundColor Red "[FAIL] $args" }
function Write-Info { Write-Host -ForegroundColor Cyan "[INFO] $args" }

$global:FailedChecks = 0

function Assert-True {
    param(
        [bool]$Condition,
        [string]$SuccessMessage,
        [string]$FailureMessage
    )

    if ($Condition) {
        Write-Pass $SuccessMessage
    } else {
        Write-Fail $FailureMessage
        $global:FailedChecks++
    }
}

function Invoke-ApiJson {
    param(
        [string]$Method,
        [string]$Url,
        $Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Method = $Method
        Uri = $Url
        Headers = $Headers
        ContentType = "application/json"
        UseBasicParsing = $true
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-WebRequest @params
        $parsed = $response.Content
        $contentType = ""
        if ($response.Headers["Content-Type"]) {
            $contentType = [string]$response.Headers["Content-Type"]
        }
        if ($response.Content -and $contentType.ToLower().Contains("application/json")) {
            $parsed = $response.Content | ConvertFrom-Json
        }
        return @{ StatusCode = [int]$response.StatusCode; Body = $parsed }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
            $bodyText = ""
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $bodyText = $reader.ReadToEnd()
            } catch {
                $bodyText = ""
            }

            $parsed = $null
            if ($bodyText) {
                $trimmed = $bodyText.TrimStart()
                if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
                    try { $parsed = $bodyText | ConvertFrom-Json } catch { $parsed = $bodyText }
                } else {
                    $parsed = $bodyText
                }
            }

            return @{ StatusCode = $statusCode; Body = $parsed }
        }
        throw
    }
}

function Resolve-ApiBaseUrl {
    param([string]$Requested)

    $candidates = @($Requested, "http://localhost:8001", "http://127.0.0.1:8001", "http://localhost:8000", "http://127.0.0.1:8000") |
        Where-Object { $_ -and $_.Trim() -ne "" } |
        Select-Object -Unique

    foreach ($candidate in $candidates) {
        try {
            $ping = Invoke-ApiJson -Method "GET" -Url "$candidate/openapi.json"
            if ($ping.StatusCode -eq 200) {
                return $candidate
            }
        } catch {
            continue
        }
    }

    return $Requested
}

$BaseUrl = Resolve-ApiBaseUrl -Requested $BaseUrl

Write-Info "Checking API health at $BaseUrl/openapi.json"
$docs = Invoke-ApiJson -Method "GET" -Url "$BaseUrl/openapi.json"
Assert-True ($docs.StatusCode -eq 200) "API is reachable" "API is not reachable"

Write-Info "Checking Docker services"
$containerNames = $null
$dockerCheckFailed = $false
try {
    $containerNames = & docker ps --format "{{.Names}}" 2>$null
} catch {
    $dockerCheckFailed = $true
}
$requiredContainers = @(
    "elasticsearch",
    "logstash",
    "kibana",
    "wazuh-manager",
    "wazuh-indexer",
    "wazuh-dashboard",
    "filebeat"
)

if ($dockerCheckFailed -or $LASTEXITCODE -ne 0) {
    Write-Info "Docker service check skipped (daemon/API query failed in this shell)."
} else {
    $runningRequiredCount = 0
    foreach ($container in $requiredContainers) {
        if ($containerNames -contains $container) {
            $runningRequiredCount++
        }
    }
    Assert-True ($runningRequiredCount -ge 5) "Docker services are running ($runningRequiredCount/$($requiredContainers.Count) expected containers)" "Not enough Docker services are running ($runningRequiredCount/$($requiredContainers.Count))"
}

Write-Info "Resetting event state"
$clear = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/events/clear?seed=true"
Assert-True ($clear.StatusCode -eq 200) "Event state reset" "Failed to reset event state"

Write-Info "Baseline login check"
$baselineLogin = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "demo.baseline"
    password = "password123"
    user_agent = "demo_verify"
}
Assert-True (($baselineLogin.StatusCode -eq 200) -and $baselineLogin.Body.success) "Baseline login succeeds" "Baseline login failed"

Write-Info "Triggering UC-012 brute force simulation"
$uc012 = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/simulate/uc-012"
Assert-True ($uc012.StatusCode -eq 200) "UC-012 simulation started" "UC-012 simulation did not start"
Start-Sleep -Seconds 2

$lockedAttempt = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "Malicious Entity"
    password = "password123"
    user_agent = "demo_verify"
}
Assert-True ($lockedAttempt.StatusCode -eq 403) "UC-012 account lock enforced (403)" "UC-012 account lock not enforced"

Write-Info "Triggering UC-013 geofence simulation"
$uc013 = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/simulate/uc-013"
Assert-True ($uc013.StatusCode -eq 200) "UC-013 simulation started" "UC-013 simulation did not start"
Start-Sleep -Seconds 1

$geoIp = "198.51." + (Get-Random -Minimum 1 -Maximum 254) + "." + (Get-Random -Minimum 1 -Maximum 254)

$geofenceAttempt = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "Russian Threat Actor"
    password = "password123"
    user_agent = "demo_verify"
} -Headers @{
    "X-Forwarded-For" = $geoIp
    "X-Country" = "RU"
}
Assert-True (($geofenceAttempt.StatusCode -eq 200) -and (-not $geofenceAttempt.Body.success) -and ($geofenceAttempt.Body.message -eq "geofence blocked")) "UC-013 geofence block enforced" "UC-013 geofence block not enforced"

$blacklistAttempt = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "geo.demo"
    password = "password123"
    user_agent = "demo_verify"
} -Headers @{
    "X-Forwarded-For" = "5.255.255.1"
    "X-Country" = "PK"
}
Assert-True ($blacklistAttempt.StatusCode -eq 403) "IP blacklist pre-auth block enforced (403)" "IP blacklist pre-auth block not enforced"

Write-Info "Triggering UC-015 impossible travel simulation"
$uc015 = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/simulate/uc-015"
Assert-True ($uc015.StatusCode -eq 200) "UC-015 simulation started" "UC-015 simulation did not start"
Start-Sleep -Seconds 2

$mfaAttempt = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "Impossible Travel Tester"
    password = "password123"
    user_agent = "demo_verify"
}
Assert-True (($mfaAttempt.StatusCode -eq 200) -and (-not $mfaAttempt.Body.success) -and ($mfaAttempt.Body.message -eq "mfa required")) "MFA-required policy enforced" "MFA-required policy not enforced"

Write-Info "Triggering UC-017 blocked country simulation"
$uc017 = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/simulate/uc-017"
Assert-True ($uc017.StatusCode -eq 200) "UC-017 simulation started" "UC-017 simulation did not start"
Start-Sleep -Seconds 1

$blockedCountryAttempt = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "blocked.country.demo"
    password = "password123"
    user_agent = "demo_verify"
} -Headers @{
    "X-Forwarded-For" = "203.0.113.17"
    "X-Country" = "IR"
}
Assert-True (($blockedCountryAttempt.StatusCode -eq 200) -and (-not $blockedCountryAttempt.Body.success) -and ($blockedCountryAttempt.Body.message -eq "blocked country")) "UC-017 blocked country policy enforced" "UC-017 blocked country policy not enforced"

Write-Info "Triggering UC-020 password spray simulation"
$uc020 = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/simulate/uc-020"
Assert-True ($uc020.StatusCode -eq 200) "UC-020 simulation started" "UC-020 simulation did not start"
Start-Sleep -Seconds 2

# Deterministic UC-020 setup: generate spray attempts from the same IP so the next login is restricted.
$sprayIp = "203.0.113.20"
for ($i = 1; $i -le 6; $i++) {
    $null = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
        username = "password.spray.seed.$i"
        password = "wrong-password"
        user_agent = "demo_verify"
    } -Headers @{
        "X-Forwarded-For" = $sprayIp
        "X-Country" = "PK"
    }
}

$tempRestrictionAttempt = Invoke-ApiJson -Method "POST" -Url "$BaseUrl/login" -Body @{
    username = "password.spray.victim"
    password = "password123"
    user_agent = "demo_verify"
} -Headers @{
    "X-Forwarded-For" = $sprayIp
    "X-Country" = "PK"
}
Assert-True (($tempRestrictionAttempt.StatusCode -eq 200) -and (-not $tempRestrictionAttempt.Body.success) -and ($tempRestrictionAttempt.Body.message -eq "temporary restriction applied")) "UC-020 temporary access restriction enforced" "UC-020 temporary access restriction not enforced"

$events = Invoke-ApiJson -Method "GET" -Url "$BaseUrl/events?limit=200"
$mitigations = Invoke-ApiJson -Method "GET" -Url "$BaseUrl/mitigations?limit=200"

$eventActions = @()
if ($events.Body) {
    $eventActions = $events.Body | ForEach-Object { $_.event_action }
}

$hasIpBlockEvent = $eventActions -contains "ip_blacklist_block"
$hasMfaEvent = $eventActions -contains "mfa_challenge_required"
$hasBlockedCountryEvent = $eventActions -contains "blocked_country_login_attempt"
$hasTempRestrictionEvent = $eventActions -contains "temporary_access_restriction"

Assert-True $hasIpBlockEvent "Evidence includes ip_blacklist_block event" "Missing ip_blacklist_block event evidence"
Assert-True $hasMfaEvent "Evidence includes mfa_challenge_required event" "Missing mfa_challenge_required event evidence"
Assert-True $hasBlockedCountryEvent "Evidence includes blocked_country_login_attempt event" "Missing blocked_country_login_attempt event evidence"
Assert-True $hasTempRestrictionEvent "Evidence includes temporary_access_restriction event" "Missing temporary_access_restriction event evidence"
Assert-True (($mitigations.StatusCode -eq 200) -and ($mitigations.Body.Count -ge 1)) "Mitigation log populated" "Mitigation log is empty or unavailable"

Write-Host ""
if ($global:FailedChecks -eq 0) {
    Write-Host -ForegroundColor Green "=== DEMO VERIFICATION PASSED ==="
    exit 0
}

Write-Host -ForegroundColor Red "=== DEMO VERIFICATION FAILED: $global:FailedChecks check(s) failed ==="
exit 1
