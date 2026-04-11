#requires -version 5.0

param(
    [string]$BaseUrl = "http://localhost:8000",
    [switch]$ApplyWazuhWiring,
    [switch]$StrictWazuhWiring
)

$ErrorActionPreference = "Stop"

function Write-Info { Write-Host -ForegroundColor Cyan "[INFO] $args" }
function Write-Pass { Write-Host -ForegroundColor Green "[PASS] $args" }
function Write-Warn { Write-Host -ForegroundColor Yellow "[WARN] $args" }
function Write-Fail { Write-Host -ForegroundColor Red "[FAIL] $args" }

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$results = [ordered]@{
    ApiReachable = $false
    DemoVerify = $false
    WazuhWiringApply = $null
    WazuhVerify = $false
    BackendReport = $false
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [switch]$ContinueOnFailure
    )

    Write-Info "Running: $Name"
    try {
        & $Action
        Write-Pass "$Name completed"
        return $true
    } catch {
        Write-Fail "$Name failed: $($_.Exception.Message)"
        if (-not $ContinueOnFailure) {
            throw
        }
        return $false
    }
}

Write-Info "Demo orchestrator started"
Write-Info "Project root: $projectRoot"

$apiOk = Invoke-Step -Name "API reachability check" -Action {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/openapi.json" -Method GET
    if ([int]$response.StatusCode -ne 200) {
        throw "Unexpected status code: $($response.StatusCode)"
    }
}
$results.ApiReachable = $apiOk

if (-not $results.ApiReachable) {
    Write-Host ""
    Write-Fail "API is not reachable. Start uvicorn before demo."
    exit 1
}

if ($ApplyWazuhWiring) {
    $wazuhApplyOk = Invoke-Step -Name "Apply Wazuh active-response wiring" -ContinueOnFailure -Action {
        & (Join-Path $projectRoot "scripts\enable_wazuh_active_response.ps1")
        if ($LASTEXITCODE -ne 0) {
            throw "enable_wazuh_active_response.ps1 exited with code $LASTEXITCODE"
        }
    }
    $results.WazuhWiringApply = $wazuhApplyOk

    if ($StrictWazuhWiring -and -not $wazuhApplyOk) {
        Write-Host ""
        Write-Fail "Strict mode enabled: failing because Wazuh wiring apply did not complete."
        exit 1
    }
}

$demoVerifyOk = Invoke-Step -Name "Core IPS verification" -Action {
    & (Join-Path $projectRoot "scripts\demo_verify.ps1") -BaseUrl $BaseUrl
    if ($LASTEXITCODE -ne 0) {
        throw "demo_verify.ps1 exited with code $LASTEXITCODE"
    }
}
$results.DemoVerify = $demoVerifyOk

$wazuhVerifyOk = Invoke-Step -Name "Wazuh active-response verification" -Action {
    & (Join-Path $projectRoot "scripts\verify_wazuh_active_response.ps1")
    if ($LASTEXITCODE -ne 0) {
        throw "verify_wazuh_active_response.ps1 exited with code $LASTEXITCODE"
    }
}
$results.WazuhVerify = $wazuhVerifyOk

$backendReportOk = Invoke-Step -Name "Generate backend TXT summary" -Action {
    & (Join-Path $projectRoot "scripts\generate_demo_summary.ps1") -BaseUrl $BaseUrl
    if ($LASTEXITCODE -ne 0) {
        throw "generate_demo_summary.ps1 exited with code $LASTEXITCODE"
    }
}
$results.BackendReport = $backendReportOk

Write-Host ""
Write-Host "========== DEMO RUN SUMMARY =========="
if ($results.ApiReachable) { Write-Pass "API reachable" } else { Write-Fail "API reachable" }
if ($results.DemoVerify) { Write-Pass "Core IPS checks passed" } else { Write-Fail "Core IPS checks passed" }
if ($results.WazuhVerify) { Write-Pass "Wazuh active-response proof passed" } else { Write-Fail "Wazuh active-response proof passed" }
if ($results.BackendReport) { Write-Pass "Backend TXT report generated" } else { Write-Fail "Backend TXT report generated" }

if ($ApplyWazuhWiring) {
    if ($results.WazuhWiringApply -eq $true) {
        Write-Pass "Wazuh runtime wiring apply completed"
    } elseif ($results.WazuhWiringApply -eq $false) {
        Write-Warn "Wazuh runtime wiring apply failed in this shell (Docker API mismatch or container issue)"
    }
}

Write-Host "======================================"

if ($results.ApiReachable -and $results.DemoVerify -and $results.WazuhVerify -and $results.BackendReport) {
    Write-Host ""
    Write-Pass "DEMO READY"
    exit 0
}

Write-Host ""
Write-Fail "DEMO NOT READY"
exit 1
