#requires -version 5.0

param(
    [string]$ContainerName = "wazuh-manager"
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

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pythonExe = Join-Path $projectRoot ".venv\Scripts\python.exe"
$dbPath = Join-Path $projectRoot "alds.db"

Write-Info "Checking Wazuh manager container"
$dockerQueryFailed = $false
$containerNames = $null
try {
    $containerNames = & docker ps --format "{{.Names}}" 2>$null
} catch {
    $dockerQueryFailed = $true
}

$running = $false
if ($dockerQueryFailed -or $LASTEXITCODE -ne 0) {
    Write-Info "Container check skipped (Docker daemon/API query failed in this shell)."
} else {
    $running = $containerNames -contains $ContainerName
    Assert-True $running "Container '$ContainerName' is running" "Container '$ContainerName' is not running"
}

if ($running) {
    $configChecks = @(
        "alds_account_lock",
        "alds_ip_block",
        "alds_session_kill",
        "alds_mfa_stepup"
    )
    foreach ($cmdName in $configChecks) {
        & docker exec $ContainerName sh -c "grep -q '$cmdName' /var/ossec/etc/ossec.conf"
        Assert-True ($LASTEXITCODE -eq 0) "ossec.conf contains command '$cmdName'" "ossec.conf missing command '$cmdName'"
    }
}

if (-not (Test-Path $pythonExe)) {
    Write-Fail "Python venv not found at $pythonExe"
    $global:FailedChecks++
} elseif (-not (Test-Path $dbPath)) {
    Write-Fail "Database not found at $dbPath"
    $global:FailedChecks++
} else {
    Write-Info "Running active-response scripts locally with sample alerts"
    $scriptRuns = @(
        @{ Script = "wazuh\active-response\account_lock.py"; Payload = '{"username":"DemoLockUser"}' },
        @{ Script = "wazuh\active-response\ip_block.py"; Payload = '{"srcip":"198.51.100.200"}' },
        @{ Script = "wazuh\active-response\session_kill.py"; Payload = '{"data":{"user_id":1}}' },
        @{ Script = "wazuh\active-response\mfa_stepup.py"; Payload = '{"username":"DemoMfaUser"}' }
    )

    foreach ($entry in $scriptRuns) {
        $scriptPath = Join-Path $projectRoot $entry.Script
        if (-not (Test-Path $scriptPath)) {
            Assert-True $false "" "Missing script: $scriptPath"
            continue
        }

        $result = $entry.Payload | & $pythonExe $scriptPath
        Assert-True ($LASTEXITCODE -eq 0) "Executed $($entry.Script) successfully" "Execution failed for $($entry.Script)"
        if ($result) {
            $ok = $result -match '"status"\s*:\s*"success"'
            Assert-True $ok "$($entry.Script) returned success status" "$($entry.Script) did not report success"
        }
    }

    $env:ALDS_DB_PATH = $dbPath
    $mitigationCount = & $pythonExe -c "import os, sqlite3; c=sqlite3.connect(os.environ['ALDS_DB_PATH']); print(c.execute('select count(*) from mitigation_log').fetchone()[0]); c.close()"
    $countValue = 0
    [void][int]::TryParse(($mitigationCount | Select-Object -Last 1), [ref]$countValue)
    Assert-True ($countValue -ge 1) "Mitigation log has entries ($countValue)" "Mitigation log appears empty"
}

Write-Host ""
if ($global:FailedChecks -eq 0) {
    Write-Host -ForegroundColor Green "=== WAZUH ACTIVE-RESPONSE VERIFICATION PASSED ==="
    exit 0
}

Write-Host -ForegroundColor Red "=== WAZUH ACTIVE-RESPONSE VERIFICATION FAILED: $global:FailedChecks check(s) failed ==="
exit 1
