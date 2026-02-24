param(
    [int]$IntervalSeconds = 60
)

# Build absolute path to sync script (PSScriptRoot may be empty in background jobs, so use explicit path)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SyncScriptPath = Join-Path $scriptDir "sync_es_to_wazuh_indexer.ps1"

if (-not (Test-Path $SyncScriptPath)) {
    Write-Error "Sync script not found: $SyncScriptPath"
    exit 1
}

Write-Host "[sync-loop] Starting continuous sync every $IntervalSeconds seconds"

while ($true) {
    $startedAt = Get-Date
    Write-Host "[sync-loop] $(Get-Date -Format o) running sync..."

    try {
        & $SyncScriptPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[sync-loop] Sync exited with code $LASTEXITCODE"
        }
    }
    catch {
        Write-Host "[sync-loop] Sync error: $($_.Exception.Message)"
    }

    $elapsed = (Get-Date) - $startedAt
    $sleepFor = [Math]::Max(1, $IntervalSeconds - [int]$elapsed.TotalSeconds)
    Start-Sleep -Seconds $sleepFor
}
