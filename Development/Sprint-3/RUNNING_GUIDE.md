# ALDS Sprint 3 — Complete Running Guide

This guide walks you through starting the entire ALDS system: FastAPI backend, Docker Compose stack (ELK + Wazuh), database, log ingestion pipeline, and continuous sync.

---

## Prerequisites

- **Windows 10/11** with PowerShell 5.1+
- **Docker Desktop** installed and running
- **Python 3.9+** with venv support
- **Git Bash or WSL** (optional; for file path consistency)
- All required Python packages (see [Installing Dependencies](#installing-dependencies))

---

## Quick Start (5 minutes)

### 1. Navigate to Project Root

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"
```

### 2. Activate Python Virtual Environment

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Start Docker Services (ELK + Wazuh Stack)

```powershell
cd .\elk-wazuh-compose
docker-compose up -d
```

Wait 30–60 seconds for all services to initialize.

### 4. Start FastAPI Backend (New Terminal)

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start Continuous Log Sync (New Terminal)

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"
Start-Job -FilePath ".\scripts\sync_es_to_wazuh_indexer_loop.ps1"
```

### 6. Access the Dashboards

Open these in your browser:

| Service | URL | Purpose |
|---------|-----|---------|
| **FastAPI (Backend API)** | `http://localhost:8000/docs` | Swagger API documentation & testing |
| **Kibana (ELK Analytics)** | `http://localhost:5601` | Elasticsearch data exploration & visualization |
| **Wazuh Dashboard** | `http://localhost:5602` | Native Wazuh security dashboard |
| **Wazuh API** | `https://localhost:55000` | Security alerts & agent management (requires auth) |

### 7. Enable Wazuh Active-Response (for IPS proof)

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"
.\scripts\enable_wazuh_active_response.ps1
```

Then verify wiring and deterministic script execution proof:

```powershell
.\scripts\verify_wazuh_active_response.ps1
```

### 8. Run End-to-End IPS Demo Verification

```powershell
.\scripts\demo_run.ps1
```

---

## Detailed Startup Steps

### Installing Dependencies

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### Starting Docker Services

Navigate to the Docker Compose directory:

```powershell
cd .\elk-wazuh-compose
docker-compose up -d
```

**Services that will start:**
- Elasticsearch (port 9200) — Data store for logs & events
- Logstash (port 5000) — Log processing pipeline
- Filebeat — Log harvester (Docker-internal, port 5044 input)
- Kibana (port 5601) — ELK dashboard
- Wazuh Manager (port 55000) — Security event generator
- Wazuh Indexer (port 9201) — OpenSearch data store
- Wazuh Dashboard (port 5602) — Wazuh UI

**Check service status:**

```powershell
docker-compose ps
```

All services should show `Up` status. If any fail, check logs:

```powershell
docker-compose logs <service-name>
```

### Starting the FastAPI Backend

In a new PowerShell terminal:

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"
.\.venv\Scripts\Activate.ps1

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000/docs`.

**Database:** SQLite database (`alds.db`) will be created automatically in the project root.

### Starting Log Sync Automation

In a new PowerShell terminal:

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"

# Start continuous sync (runs in background job)
Start-Job -FilePath ".\scripts\sync_es_to_wazuh_indexer_loop.ps1"

# Verify job is running
Get-Job
```

The sync loop mirrors all Elasticsearch data to Wazuh Indexer every 60 seconds.

---

## Accessing Dashboards

### Kibana (ELK Analytics)

1. Open `http://localhost:5601`
2. Go to **Discover** → select index (e.g., `alds-login-events`, `wazuh-logs`, `wazuh-alerts`)
3. View, filter, and analyze ingested data

### Wazuh Dashboard (Native Security UI)

1. Open `http://localhost:5602`
2. Login with default credentials: `admin` / `admin`
3. Go to **Index Management** to see synced ALDS indices
4. Create index patterns for visualization (if needed)

### Wazuh API (Programmatic Access)

```powershell
# Get authentication token (default credentials: wazuh/wazuh)
$response = curl.exe -sk -u wazuh:wazuh `
  -X POST https://127.0.0.1:55000/security/user/authenticate

# List all agents
curl.exe -sk -u wazuh:wazuh `
  -H "Authorization: Bearer <token-from-above>" `
  https://127.0.0.1:55000/agents

# Query login events (ALDS custom index)
curl.exe -s http://127.0.0.1:9200/alds-login-events/_search | jq .
```

---

## Data Flow & Log Ingestion

```
┌──────────────────────────────────────────────────┐
│  FastAPI Backend (app/main.py, port 8000)        │
│  ↓ Writes login events                            │
│  SQLite (alds.db)                                │
│  ↑ Read by Logstash JDBC every 5 seconds        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Wazuh Manager (port 55000)                       │
│  ↓ Generates security alerts & logs              │
│  /var/ossec/logs/* (in container)               │
│  ↑ Harvested by Filebeat                        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Filebeat (harvester) + Logstash (processor)     │
│  ↓ Parse, enrich, route by dataset              │
│  Elasticsearch (port 9200)                      │
│  ├─ alds-login-events     (JDBC events)         │
│  ├─ wazuh-alerts          (alerts.json)         │
│  └─ wazuh-logs            (manager logs)        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Sync Loop (every 60 seconds)                     │
│  ↓ Mirror all indices from Elasticsearch        │
│  Wazuh Indexer (port 9201)                      │
│  ↑ Displayed in Wazuh Dashboard                 │
└──────────────────────────────────────────────────┘
```

---

## Testing Log Ingestion

### Check Elasticsearch Indices

```powershell
# List all indices with doc counts
curl.exe -s http://127.0.0.1:9200/_cat/indices?v

# View login events
curl.exe -s http://127.0.0.1:9200/alds-login-events/_search | jq .

# View Wazuh logs
curl.exe -s http://127.0.0.1:9200/wazuh-logs/_search | jq .

# View Wazuh alerts
curl.exe -s http://127.0.0.1:9200/wazuh-alerts/_search | jq .
```

### Check Wazuh Indexer Sync

```powershell
# Verify indices synced to Wazuh Indexer
curl.exe -sk -u admin:admin `
  https://127.0.0.1:9201/_cat/indices?v

# Compare doc counts (should match Elasticsearch)
curl.exe -sk -u admin:admin `
  https://127.0.0.1:9201/alds-login-events/_search | jq '.hits.total'
```

---

## Simulating Security Events

The ALDS backend includes built-in simulators. Trigger them via the FastAPI API:

```powershell
# UC-012: Privilege Escalation
curl.exe -X POST http://localhost:8000/simulate/uc_012 \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'

# UC-013: Account Compromise
curl.exe -X POST http://localhost:8000/simulate/uc_013 \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "ip": "192.168.1.50"}'

# UC-014: Policy Violation
curl.exe -X POST http://localhost:8000/simulate/uc_014 \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

View generated events in Kibana immediately after triggering.

---

## Stopping Services

### Stop FastAPI Backend

Press `Ctrl+C` in the terminal running uvicorn.

### Stop Docker Services

```powershell
cd .\elk-wazuh-compose
docker-compose down
```

Or to stop without removing containers:

```powershell
docker-compose stop
```

### Stop Sync Loop Job

```powershell
# View running jobs
Get-Job

# Stop specific job
Stop-Job -Id <job-id>

# Or stop all jobs
Stop-Job -State Running
```

---

## Clearing All Logs (Fresh Start)

To delete all logs and indices from everywhere and start fresh, run:

```powershell
.\scripts\clear_all_logs.ps1
```

This will:
- Delete all Elasticsearch indices (alds-*, wazuh-*)
- Delete all Wazuh Indexer indices
- Clear Docker container logs
- Reset SQLite database to empty schema
- Clear log harvester state

**Warning:** This is destructive and irreversible. All data will be lost.

See [clear_all_logs.ps1](./scripts/clear_all_logs.ps1) for details.

---

## Troubleshooting

### Services won't start in Docker

```powershell
# Check why a service failed
docker-compose logs <service-name>

# Rebuild and restart
docker-compose down
docker-compose up -d --force-recreate
```

### Backend won't connect to database

```powershell
# Check if alds.db exists
Test-Path .\alds.db

# If missing, delete any stale file and restart FastAPI
rm -Force .\alds.db
uvicorn app.main:app --reload
```

### No data in Elasticsearch after 5 minutes

```powershell
# Check Logstash is running and reading database
docker-compose logs logstash | tail -20

# Manually trigger database insert via backend
curl.exe -X POST http://localhost:8000/simulate/uc_012 \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test"}'

# Wait 5 seconds, then check Elasticsearch
curl.exe -s http://127.0.0.1:9200/alds-login-events/_search | jq '.hits.total'
```

### Wazuh Dashboard doesn't show ALDS indices

1. Verify sync is running: `Get-Job`
2. Check Wazuh Indexer has data: `curl.exe -sk -u admin:admin https://127.0.0.1:9201/alds-login-events/_search`
3. Refresh Wazuh Dashboard browser tab
4. Go to **Index Management** and refresh if needed

### Sync loop job fails silently

```powershell
# Check job output
Get-Job | Receive-Job

# Restart job
Stop-Job -Id <id>
Start-Job -FilePath ".\scripts\sync_es_to_wazuh_indexer_loop.ps1"
```

---

## Port Reference

| Port | Service | URL | Auth |
|------|---------|-----|------|
| 8000 | FastAPI | `http://localhost:8000/docs` | None |
| 5601 | Kibana | `http://localhost:5601` | None |
| 5602 | Wazuh Dashboard | `http://localhost:5602` | admin/admin |
| 9200 | Elasticsearch | `http://localhost:9200` | None |
| 9201 | Wazuh Indexer | `https://localhost:9201` | admin/admin |
| 55000 | Wazuh API | `https://localhost:55000` | wazuh/wazuh |
| 5000 | Logstash (input) | Internal | None |
| 5044 | Filebeat (input) | Internal | None |

---

## Next Steps

1. **Create index patterns** in Wazuh Dashboard for ALDS indices
2. **Build visualizations** of login events and security alerts
3. **Configure active responses** in Wazuh Manager (account lock, IP block, etc.)
4. **Test end-to-end** by triggering simulated events and observing alert pipeline

---

*Last updated: February 2026*
