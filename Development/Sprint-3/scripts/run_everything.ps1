#requires -version 5.1

param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$ApiBaseUrl = "http://127.0.0.1:8000",
    [int]$ApiWaitSeconds = 90,
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

function Write-Info { Write-Host -ForegroundColor Cyan "[INFO] $args" }
function Write-Pass { Write-Host -ForegroundColor Green "[PASS] $args" }
function Write-Warn { Write-Host -ForegroundColor Yellow "[WARN] $args" }
function Write-Fail { Write-Host -ForegroundColor Red "[FAIL] $args" }

function Start-DetachedPowerShell {
    param(
        [string]$ScriptOrCommand,
        [switch]$IsFile
    )

    $args = @("-ExecutionPolicy", "Bypass")
    if ($IsFile) {
        $args += @("-File", $ScriptOrCommand)
    }
    else {
        $args += @("-Command", $ScriptOrCommand)
    }

    Start-Process -FilePath "powershell.exe" -ArgumentList $args -WindowStyle Normal | Out-Null
}

function Wait-ApiReady {
    param(
        [string]$Url,
        [int]$TimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "$Url/openapi.json" -Method GET -TimeoutSec 5
            if ([int]$response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {}
        Start-Sleep -Seconds 2
    }
    return $false
}

$venvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$dashboardPath = Join-Path $ProjectRoot "dashboard\index.html"
$verifyScript = Join-Path $ProjectRoot "scripts\demo_verify.ps1"
$syncLoopScript = Join-Path $ProjectRoot "scripts\sync_es_to_wazuh_indexer_loop.ps1"
$composePath = Join-Path $ProjectRoot "elk-wazuh-compose"

if (-not (Test-Path $venvPython)) {
    throw "Virtual environment python not found at: $venvPython"
}

Write-Info "[A] Starting FastAPI uvicorn in detached PowerShell..."
$apiCommand = "Set-Location -LiteralPath '$ProjectRoot'; & '$venvPython' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Start-DetachedPowerShell -ScriptOrCommand $apiCommand

Write-Info "Waiting for API readiness..."
if (Wait-ApiReady -Url $ApiBaseUrl -TimeoutSeconds $ApiWaitSeconds) {
    Write-Pass "API is reachable at $ApiBaseUrl"
}
else {
    Write-Fail "API did not become ready within $ApiWaitSeconds seconds"
    exit 1
}

Write-Info "[B] Starting Docker services (ELK + Wazuh)..."
Push-Location $composePath
try {
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        throw "docker-compose up -d failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
Write-Pass "Docker services are up (or already running)."

Write-Info "[C] Opening HTML dashboard..."
if (-not (Test-Path $dashboardPath)) {
    throw "Dashboard file not found: $dashboardPath"
}
Start-Process -FilePath $dashboardPath | Out-Null
Write-Pass "Dashboard opened."

if (-not $SkipVerify) {
    Write-Info "[D] Running backend demo checklist..."
    & $verifyScript -BaseUrl $ApiBaseUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Backend verification failed (demo_verify.ps1 exit code: $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
    Write-Pass "Backend verification passed."
}
else {
    Write-Warn "Skipping backend verification by request (-SkipVerify)."
}

Write-Info "[E] Starting continuous Elasticsearch → Wazuh sync..."
Start-DetachedPowerShell -ScriptOrCommand $syncLoopScript -IsFile
Write-Pass "Continuous sync process started."

Write-Host ""
Write-Pass "ALL STEPS COMPLETE"
Write-Host "API: $ApiBaseUrl/docs"
Write-Host "Kibana: http://127.0.0.1:5601"
Write-Host "Wazuh Dashboard: http://127.0.0.1:5602"