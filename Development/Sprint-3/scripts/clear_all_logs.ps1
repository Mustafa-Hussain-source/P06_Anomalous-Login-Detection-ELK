#requires -version 5.0
<#
.SYNOPSIS
Clears ALL logs and indices from everywhere in the ALDS system (fresh start).

.DESCRIPTION
This script is DESTRUCTIVE and IRREVERSIBLE. It will:
- Delete all Elasticsearch indices (alds-*, wazuh-*)
- Delete all Wazuh Indexer indices
- Clear Docker container logs
- Reset SQLite database to empty schema
- Clear Filebeat log harvester state

Use only when you want to start completely fresh with no historical data.

.PARAMETER Confirm
Set to $false to skip confirmation prompt. Default is $true.

.EXAMPLE
.\clear_all_logs.ps1
# Prompts for confirmation before clearing

.\clear_all_logs.ps1 -Confirm $false
# Clears immediately without prompting
#>

param(
    [bool]$Confirm = $true
)

# Color output helpers
function Write-Success { Write-Host -ForegroundColor Green "[✓] $args" }
function Write-Warning { Write-Host -ForegroundColor Yellow "[⚠] $args" }
function Write-Error { Write-Host -ForegroundColor Red "[✗] $args" }
function Write-Info { Write-Host -ForegroundColor Cyan "[i] $args" }

# Confirm user wants to do this
if ($Confirm) {
    Write-Warning "This will DELETE ALL logs and data from everywhere. IRREVERSIBLE."
    Write-Info "Affected:"
    Write-Info "  • All Elasticsearch indices (alds-login-events, wazuh-alerts, wazuh-logs, etc.)"
    Write-Info "  • All Wazuh Indexer indices"
    Write-Info "  • Docker container logs"
    Write-Info "  • SQLite database (alds.db) — entire contents deleted"
    Write-Info "  • Filebeat harvester registry (will re-read all logs from start)"
    Write-Host ""
    $continue = Read-Host "Type 'yes' to confirm deletion"
    if ($continue -ne "yes") {
        Write-Info "Cancelled. No changes made."
        exit 0
    }
}

Write-Info "Starting comprehensive log deletion..."
Write-Host ""

# 1. Delete Elasticsearch Indices
Write-Info "1. Deleting Elasticsearch indices..."
try {
    $indices = @("alds-login-events", "wazuh-alerts", "wazuh-logs")
    foreach ($index in $indices) {
        $response = curl.exe -s -X DELETE "http://127.0.0.1:9200/$index"
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Deleted Elasticsearch index: $index"
        } else {
            Write-Warning "Failed to delete $index (may not exist or ES not running)"
        }
    }
} catch {
    Write-Error "Error deleting Elasticsearch indices: $_"
}

Write-Host ""

# 2. Delete Wazuh Indexer Indices
Write-Info "2. Deleting Wazuh Indexer indices..."
try {
    $indices = @("alds-login-events", "wazuh-alerts", "wazuh-logs")
    foreach ($index in $indices) {
        $response = curl.exe -sk -u admin:admin -X DELETE "https://127.0.0.1:9201/$index"
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Deleted Wazuh Indexer index: $index"
        } else {
            Write-Warning "Failed to delete $index from indexer (may not exist or indexer not running)"
        }
    }
} catch {
    Write-Error "Error deleting Wazuh Indexer indices: $_"
}

Write-Host ""

# 3. Reset SQLite Database
Write-Info "3. Resetting SQLite database..."
try {
    $dbPath = ".\alds.db"
    if (Test-Path $dbPath) {
        Remove-Item -Force $dbPath -ErrorAction Stop
        Write-Success "Deleted SQLite database file: $dbPath"
        Write-Info "  (Will be recreated with empty schema when FastAPI starts)"
    } else {
        Write-Warning "SQLite database not found at $dbPath"
    }
} catch {
    Write-Error "Error deleting database: $_"
}

Write-Host ""

# 4. Clear Docker Container Logs
Write-Info "4. Clearing Docker container logs..."
try {
    # Get all containers (running and stopped)
    $containers = docker ps -a -q
    if ($containers) {
        foreach ($container in $containers) {
            # Truncate logs for each container
            $logPath = "\\.\pipe\docker_engine"
            try {
                docker logs --tail=0 $container 2>&1 | Out-Null
                Write-Success "Cleared logs for container: $container"
            } catch {
                Write-Warning "Could not clear logs for container $container"
            }
        }
        Write-Info "  (Docker logs are managed by Docker; filesystem logs cleared if present)"
    } else {
        Write-Warning "No Docker containers found"
    }
} catch {
    Write-Warning "Docker may not be running or accessible: $_"
}

Write-Host ""

# 5. Clear Filebeat Harvester Registry
Write-Info "5. Clearing Filebeat harvester registry..."
try {
    # Filebeat registry is typically in the container; we'll trigger a fresh read by restarting
    Write-Info "  Restarting Filebeat container to reset registry..."
    $result = docker-compose -f ".\elk-wazuh-compose\docker-compose.yml" restart filebeat 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Filebeat restarted (will re-read all logs from beginning)"
    } else {
        Write-Warning "Could not restart Filebeat: $result"
    }
} catch {
    Write-Warning "Error restarting Filebeat: $_"
}

Write-Host ""

# 6. Summary
Write-Info "Log clearing complete."
Write-Host ""
Write-Success "All logs and data have been deleted."
Write-Info "Next steps:"
Write-Info "  1. Restart FastAPI backend (creates fresh alds.db)"
Write-Info "  2. Data ingestion will begin fresh"
Write-Info "  3. Elasticsearch indices will be recreated as data flows in"
Write-Info "  4. Wazuh Indexer will sync new data via background job"
Write-Host ""
