# Local ELK + Cloud API Runbook (Free Tier)

Goal:
- Keep OCI VM lightweight and always reachable.
- Run ELK/Wazuh on local machine only when needed.

## Architecture
- Cloud (OCI): Nginx + FastAPI + dashboard at one public URL.
- Local machine: ELK/Wazuh Docker stack for deep analytics demo.

## A) Deploy Light Mode on OCI
On VM (`opc`):

```bash
cd ~/oracle
chmod +x 04_free_tier_light_mode.sh
./04_free_tier_light_mode.sh --host 92.4.88.117
```

Verify:
- `http://92.4.88.117/`
- `http://92.4.88.117/api/docs`

## B) Run ELK Locally Only For Demo
On local machine (Windows terminal in repo):

```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-3\elk-wazuh-compose"
docker compose up -d
```

After demo:

```powershell
docker compose down
```

## C) Live Demo Sequence (Instructor)
1. Open cloud portal `http://92.4.88.117/`.
2. Trigger UC-016, UC-018, UC-019 from portal.
3. Show runtime evidence updating in cloud portal.
4. Optionally show local ELK/Wazuh dashboard for deep observability.

## D) Operational Rule
- Keep cloud VM in light mode always.
- Start heavy local stack only during rehearsals or final demo.
