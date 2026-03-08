# OCI Smoke Test Checklist (10 Minutes)

## 1) Core Services
Run on VM:

```bash
sudo systemctl status alds-api --no-pager
sudo systemctl status caddy --no-pager
cd ~/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3/elk-wazuh-compose
docker compose ps
```

Expected:
- `alds-api` active (running)
- `caddy` active (running)
- compose containers mostly `Up`

## 2) Portal and API Reachability
From your local browser:
- `http://<HOST>/`
- `http://<HOST>/api/docs`

Expected:
- Dashboard loads.
- Swagger docs load.

## 3) Trigger Use Cases From Portal
In dashboard, click in order:
1. `Run UC-016 (API Key Revoke)`
2. `Run UC-018 (Admin Console Block)`
3. `Run UC-019 (Containment Ticket)`

Expected:
- Control status returns to `Idle`.
- Mitigation log rows appear.
- Sprint-4 runtime evidence rows appear.

## 4) Verify Evidence File on Server
Run on VM:

```bash
tail -n 20 ~/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-4/artifacts/runtime_mitigation_evidence.jsonl
```

Expected:
- New JSONL rows for `UC-016`, `UC-018`, `UC-019`.

## 5) Quick Failure Recovery
If API fails:

```bash
sudo systemctl restart alds-api
sudo journalctl -u alds-api -n 80 --no-pager
```

If portal fails:

```bash
sudo systemctl restart caddy
sudo journalctl -u caddy -n 80 --no-pager
```

If compose stack fails:

```bash
cd ~/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3/elk-wazuh-compose
docker compose down
docker compose up -d
```

## 6) Demo Ready Check
You are demo-ready when all are true:
- One URL works for portal and API.
- UC-016/018/019 can be triggered live.
- Evidence is updating in UI and JSONL file.
