#requires -version 5.0

param(
    [string]$ContainerName = "wazuh-manager"
)

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host -ForegroundColor Green "[OK] $args" }
function Write-Warning { Write-Host -ForegroundColor Yellow "[WARN] $args" }
function Write-Info { Write-Host -ForegroundColor Cyan "[i] $args" }

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ossecPathInContainer = "/var/ossec/etc/ossec.conf"
$localRulesPathInContainer = "/var/ossec/etc/rules/local_rules.xml"

$snippetPath = Join-Path $projectRoot "wazuh\active-response\ossec.conf.snippet"
$rulesPath = Join-Path $projectRoot "wazuh\rules.xml"

$scriptMappings = @(
    @{ Source = (Join-Path $projectRoot "wazuh\active-response\account_lock.py"); Target = "/var/ossec/active-response/bin/account_lock.py" },
    @{ Source = (Join-Path $projectRoot "wazuh\active-response\ip_block.py"); Target = "/var/ossec/active-response/bin/ip_block.py" },
    @{ Source = (Join-Path $projectRoot "wazuh\active-response\session_kill.py"); Target = "/var/ossec/active-response/bin/session_kill.py" },
    @{ Source = (Join-Path $projectRoot "wazuh\active-response\mfa_stepup.py"); Target = "/var/ossec/active-response/bin/mfa_stepup.py" }
)

if (-not (Test-Path $snippetPath)) { throw "Missing file: $snippetPath" }
if (-not (Test-Path $rulesPath)) { throw "Missing file: $rulesPath" }

Write-Info "Checking Docker container state: $ContainerName"
$running = (& docker ps --format "{{.Names}}") -contains $ContainerName
if (-not $running) {
    throw "Container '$ContainerName' is not running. Start compose stack first."
}
Write-Success "Container is running"

$tempDir = Join-Path $env:TEMP ("alds-wazuh-setup-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    $hostOssec = Join-Path $tempDir "ossec.conf"
    Write-Info "Pulling ossec.conf from container"
    & docker cp "${ContainerName}:${ossecPathInContainer}" "$hostOssec"

    $original = Get-Content -Path $hostOssec -Raw
    $snippet = Get-Content -Path $snippetPath -Raw

    if ($original -notmatch "<name>alds_account_lock</name>") {
        $endTag = "</ossec_config>"
        $insertAt = $original.LastIndexOf($endTag)
        if ($insertAt -lt 0) {
            throw "Could not locate closing </ossec_config> tag"
        }
        $updated = $original.Substring(0, $insertAt) + $snippet + "`r`n" + $endTag + "`r`n"
        Set-Content -Path $hostOssec -Value $updated -Encoding UTF8
        & docker cp "$hostOssec" "${ContainerName}:${ossecPathInContainer}"
        Write-Success "Injected active-response commands into ossec.conf"
    } else {
        Write-Info "ossec.conf already contains ALDS active-response commands"
    }

    Write-Info "Updating Wazuh local rules"
    & docker cp "$rulesPath" "${ContainerName}:${localRulesPathInContainer}"
    Write-Success "Copied ALDS rules to $localRulesPathInContainer"

    Write-Info "Copying active-response scripts"
    foreach ($mapping in $scriptMappings) {
        & docker cp $mapping.Source "${ContainerName}:$($mapping.Target)"
    }
    & docker exec $ContainerName sh -c "chmod +x /var/ossec/active-response/bin/account_lock.py /var/ossec/active-response/bin/ip_block.py /var/ossec/active-response/bin/session_kill.py /var/ossec/active-response/bin/mfa_stepup.py"
    Write-Success "Active-response scripts copied and marked executable"

    Write-Info "Restarting Wazuh manager"
    & docker restart $ContainerName | Out-Null
    Start-Sleep -Seconds 5
    Write-Success "Wazuh manager restarted"

    Write-Host ""
    Write-Success "ALDS active-response wiring applied successfully."
    Write-Info "Next: run .\scripts\verify_wazuh_active_response.ps1"
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
