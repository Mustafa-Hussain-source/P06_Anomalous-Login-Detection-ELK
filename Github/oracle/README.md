# Oracle Deployment Kit (Single Portal)

This folder contains a ready-to-run deployment kit for hosting ALDS online on OCI with one portal URL.

Target outcome:
- Frontend portal and backend API served from one domain/IP.
- Portal served at `/`.
- API reverse proxied at `/api/*` to FastAPI on `127.0.0.1:8000`.

## Folder Contents
- `00_server_bootstrap.sh`: install system dependencies on Ubuntu VM.
- `01_deploy_alds.sh`: deploy app stack, venv, systemd, Caddy, and ELK/Wazuh compose.
- `02_oraclelinux_one_shot_deploy.sh`: one-shot deployment for Oracle Linux (`opc`) with Nginx reverse proxy.
- `Caddyfile.template`: Caddy reverse-proxy template.
- `alds-api.service.template`: systemd unit for FastAPI.
- `smoke_test_checklist.md`: 10-minute verification flow.

## Fast Start
Run these on the OCI Ubuntu VM after cloning this repo:

```bash
cd ~/Github/oracle
chmod +x 00_server_bootstrap.sh 01_deploy_alds.sh
./00_server_bootstrap.sh
./01_deploy_alds.sh --host <YOUR_PUBLIC_DOMAIN_OR_IP> --repo-root ~/Github
```

For Oracle Linux images (default `opc` user), use:

```bash
cd ~/Github/oracle
chmod +x 02_oraclelinux_one_shot_deploy.sh
./02_oraclelinux_one_shot_deploy.sh --host <YOUR_PUBLIC_IP_OR_DOMAIN>
```

If you use only IP (no domain), Caddy will still serve HTTP. For trusted HTTPS, attach a domain to the VM public IP.

## Required OCI Network Rules
Inbound allow:
- 22/tcp (SSH)
- 80/tcp (HTTP)
- 443/tcp (HTTPS)

Do not expose these publicly unless needed:
- 8000, 9200, 9201, 5601, 5602, 55000

## Notes
- This kit uses your existing Sprint-3 and Sprint-4 code paths.
- UC-016/018/019 are already triggerable from the dashboard.
- UC-019 currently logs evidence and creates in-memory tickets; real email ticketing requires an additional backend email integration step.
