# ALDS Sprint 3 & 4 — Quick Start Guide

Fast, optimized guide to run the backend API and React frontend dashboard. No Docker dependencies required.

---

## Prerequisites

- **Windows 10/11** with PowerShell 5.1+
- **Python 3.9+** with venv
- **Node.js 18+** with npm
- Python virtual environment already created in `Sprint-3/.venv`
- Node modules already installed in `Sprint-4/Front-End/sentinelauth-ui/node_modules`

---

## Quick Start (2 minutes)

### Terminal 1: Start Backend API

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-3"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

✅ Backend running on `http://localhost:8001`

### Terminal 2: Start Frontend Dashboard

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-4\Front-End\sentinelauth-ui"
npm run dev
```

✅ Frontend running on `http://localhost:5173`

### Terminal 3: Open Dashboard

```powershell
Start-Process "http://localhost:5173/"
```

✅ Dashboard opens in browser showing live KPI metrics

---

## Setup (One-time)

### 1. Install Python Dependencies

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-3"
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Install Node Dependencies

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-4\Front-End\sentinelauth-ui"
npm install
```

### 3. Configure Frontend API URL

Create `.env.local` in the frontend directory:

```
VITE_API_BASE_URL=http://localhost:8001
```

This ensures the React dashboard connects to the backend on port 8001 (not 8000, which may be occupied).

---

## Accessing Services

| Service | URL | Purpose |
|---------|-----|---------|
| **React Dashboard** | `http://localhost:5173/` | Main UI - KPIs, alerts, triage, containment |
| **FastAPI Docs** | `http://localhost:8001/docs` | Swagger interactive API testing |
| **FastAPI Openapi** | `http://localhost:8001/openapi.json` | OpenAPI specification |

---

## Database

**Location:** `Sprint-3/alds.db` (SQLite)

Automatically created on first backend startup. Contains:
- Login events
- Detection rules
- Incident cases
- Triage annotations
- Mitigation logs

**To reset database:**

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-3"
rm alds.db
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Database will be recreated with seed data.

---

## API Endpoints

### Analytics & KPIs

```powershell
# Get KPI metrics (shown on dashboard)
curl http://localhost:8001/analytics/kpi

# Get risky users
curl http://localhost:8001/analytics/risky-users?limit=10

# Get threat heatmap
curl http://localhost:8001/analytics/threat-heatmap
```

### Events & Triage

```powershell
# List login events
curl http://localhost:8001/events?limit=50

# List enriched events
curl http://localhost:8001/events/enriched?limit=50

# Update event triage status
curl -X POST http://localhost:8001/events/1/triage `
  -H "Content-Type: application/json" `
  -d '{"status":"verified","analyst":"john","severity":"high","notes":"test"}'
```

### Cases & Containment

```powershell
# List incident cases
curl http://localhost:8001/cases?limit=100

# Create new case
curl -X POST http://localhost:8001/cases `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Incident","status":"open","priority":"high"}'

# List containment tickets
curl http://localhost:8001/sprint4/containment-tickets?limit=50
```

---

## Simulating Security Events

Trigger test scenarios via API:

```powershell
# UC-012: Privilege Escalation
curl -X POST http://localhost:8001/simulate/uc_012 `
  -H "Content-Type: application/json" `
  -d '{"user_id": "user123"}'

# UC-013: Account Compromise
curl -X POST http://localhost:8001/simulate/uc_013 `
  -H "Content-Type: application/json" `
  -d '{"user_id": "user123", "ip": "192.168.1.50"}'

# UC-014: Policy Violation
curl -X POST http://localhost:8001/simulate/uc_014 `
  -H "Content-Type: application/json" `
  -d '{"user_id": "user123"}'
```

Dashboard updates in real-time with new alert counts.

---

## Port Conflict Resolution

**Issue:** Port 8000 may be occupied by Splunk or other services.

**Solution:** Backend always runs on port 8001 (see `VITE_API_BASE_URL` in `.env.local`).

If you need to use port 8000 instead:

1. Kill Splunk or other service on port 8000
2. Change port in backend startup: `uvicorn app.main:app --port 8000`
3. Update `.env.local` to match: `VITE_API_BASE_URL=http://localhost:8000`
4. Restart frontend

---

## Troubleshooting

### "Failed to fetch" error on dashboard

**Cause:** Frontend and backend using different ports, or backend not running.

**Fix:**
1. Verify backend is running: Check terminal output for `Uvicorn running on http://0.0.0.0:8001`
2. Check `.env.local` exists and contains: `VITE_API_BASE_URL=http://localhost:8001`
3. Reload dashboard in browser: `Ctrl+R` or `Cmd+Shift+R`

### Backend fails to start

**Check what's using port 8001:**

```powershell
netstat -ano | findstr ":8001"
```

If port is occupied, either:
- Kill the process: `taskkill /PID <pid> /F`
- Use a different port: `uvicorn app.main:app --port 8002` (then update `.env.local`)

### Frontend development server won't start

```powershell
# Clear node cache
cd Sprint-4/Front-End/sentinelauth-ui
rm -r node_modules
npm install
npm run dev
```

### Database errors

```powershell
# Reset to fresh database
cd Sprint-3
rm alds.db
.\.venv\Scripts\Activate.ps1
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"
uvicorn app.main:app --reload --port 8001
```

### API endpoints return 404

Verify backend is running on correct port:

```powershell
curl http://localhost:8001/analytics/kpi
```

If 404, check [complete API reference](./app/main.py) and [extended routes](./app/extended_api.py).

---

## Stopping Services

**Stop Backend:**
```powershell
# Press Ctrl+C in the terminal running uvicorn
```

**Stop Frontend:**
```powershell
# Press Ctrl+C in the terminal running npm run dev
```

---

## Next Steps

- **Dashboard Tour:** Open `http://localhost:5173/` and explore each section (Overview, Detection Center, Alert Triage, etc.)
- **API Testing:** Open `http://localhost:8001/docs` for interactive Swagger UI
- **Simulate Events:** Use the endpoint examples above to generate test data
- **Docker Integration:** See `Sprint-3/elk-wazuh-compose/` if you need ELK/Wazuh later

---

*Last updated: February 2026*
