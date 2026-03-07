# Sprint-4 How To Use

This guide explains how to run and demo Sprint-4 use cases (UC-016, UC-018, UC-019) using the current ALDS setup.

## Scope
- UC-016: Auto-Revoke Compromised API Keys
- UC-018: Auto-Block Administrative Console Logins
- UC-019: Automated Containment Ticket Creation

## Prerequisites
- Python installed (same interpreter used for Sprint-3/Sprint-4 tests)
- Dependencies installed from `Development/Sprint-3/requirements.txt`
- Project path:
  - `P06_Anomalous-Login-Detection-ELK`

## 1) Run Sprint-4 Unit/System Tests
From `Development/Sprint-4`:

```powershell
python -m compileall uc_automation.py test_uc_automation.py
python -m unittest -v test_uc_automation.py
```

Expected: all tests pass (`Ran 5 tests ... OK`).

## 2) Run Sprint-4 CLI Flows Directly
From `Development/Sprint-4`:

```powershell
python uc_automation.py
```

This runs sample UC-016/018/019 payloads and prints mitigation results.

Run a specific UC with payload file:

```powershell
python uc_automation.py --uc-id UC-016 --payload-file artifacts\payload_uc016.json --evidence-file artifacts\runtime_demo_evidence.jsonl
```

## 3) Run Full Runtime Path (Sprint-3 API + Sprint-4 Integration)
From `Development/Sprint-3`:

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Keep this terminal running.

## 4) Open Dashboard UI
Open:
- `Development/Sprint-3/dashboard/index.html`

Use dashboard buttons:
- `Run UC-016 (API Key Revoke)`
- `Run UC-018 (Admin Console Block)`
- `Run UC-019 (Containment Ticket)`

Observe updates in:
- `Mitigation Log`
- `Sprint-4 Runtime Evidence`

## 5) API Endpoints Used for Sprint-4 Demo
- `POST /simulate/uc-016`
- `POST /simulate/uc-018`
- `POST /simulate/uc-019`
- `GET /sprint4/evidence?limit=25`
- `GET /mitigations?limit=25`

You can verify quickly in browser:
- `http://localhost:8000/docs`

## 6) Evidence Locations
- Runtime evidence JSONL:
  - `Development/Sprint-4/artifacts/runtime_mitigation_evidence.jsonl`
- Optional manual run evidence:
  - `Development/Sprint-4/artifacts/run_now_evidence.jsonl`

## 7) Common Issues
- API not reachable in dashboard:
  - Ensure uvicorn is running on `http://localhost:8000`.
- Sprint-4 evidence table empty:
  - Trigger UC-016/018/019 at least once.
  - Check file exists at `Development/Sprint-4/artifacts/runtime_mitigation_evidence.jsonl`.
- UC-018/019 fail in CLI:
  - UC-018 payload must include `username`.
  - UC-019 payload must include `entity`.

## 8) Demo Sequence (Recommended)
1. Start API (`uvicorn`).
2. Open dashboard.
3. Trigger UC-016, then UC-018, then UC-019.
4. Show mitigation records and Sprint-4 evidence rows.
5. Export screenshots for submission evidence.
