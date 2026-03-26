# Update (OCI + Deployment)

Date: 2026-03-08

## What We Covered
- Created and configured OCI networking and security for public access.
- Provisioned a new, stronger VM and moved to a clean light-mode approach.
- Chose architecture: cloud VM runs portal + FastAPI, ELK/Wazuh runs locally when needed.
- Uploaded project + deployment scripts to VM.
- Fixed deployment issues:
  - Oracle Linux package mismatch (`python3-virtualenv` not available).
  - FastAPI startup issue on Python 3.9 (`eval_type_backport` required).
  - Nginx proxy/OpenAPI routing for docs.
  - VM firewall rules for HTTP/HTTPS.
- Pruned `oracle/` folder to minimal files for clean operations.

## Current State
- On VM, runtime services have been stopped to avoid unnecessary costs:
  - `alds-api`: inactive
  - `nginx`: inactive
  - no listeners on ports `80`/`8000`

## Post-Prune Validation (2026-03-08)
- Executed a full `start -> smoke test -> stop` cycle after VM pruning.
- Final smoke test result (VM localhost):
  - `WEB: 200` (`/`)
  - `DOCS: 200` (`/api/docs`)
- Services were stopped again after validation:
  - `alds-api`: inactive
  - `nginx`: inactive

One-time fix applied on VM:
- Cause: Nginx static root points to dashboard under `/home/opc/...`, and traversal/read permissions were insufficient for the Nginx worker user.
- Fix commands used:

```bash
sudo chmod o+rx /home/opc
sudo chmod o+rx /home/opc/Github
sudo chmod o+rx /home/opc/Github/P06_Anomalous-Login-Detection-ELK
sudo chmod o+rx /home/opc/Github/P06_Anomalous-Login-Detection-ELK/Development
sudo chmod o+rx /home/opc/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3
sudo chmod -R o+rX /home/opc/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3/dashboard
```

## Minimal Start Commands (VM)
Use after SSH to VM (`opc@140.245.22.112`):

```bash
cd ~/oracle
chmod +x 04_free_tier_light_mode.sh
./04_free_tier_light_mode.sh --host 140.245.22.112
```

Verify:
- `http://140.245.22.112/`
- `http://140.245.22.112/api/docs`

## Minimal Stop Commands (VM)

```bash
sudo systemctl stop alds-api || true
sudo systemctl stop nginx || true
pkill -f uvicorn || true
```

## Optional Maximum Cost Control
Stopping services reduces load, but VM still accrues compute charges.
For maximum savings, stop the instance in OCI Console:
- `Compute -> Instances -> alds-p06-vm -> Stop`

## Local ELK/Wazuh (On Demand)
Run locally only when needed:

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-3\elk-wazuh-compose"
docker compose up -d
```

Stop after demo:

```powershell
docker compose down
```
