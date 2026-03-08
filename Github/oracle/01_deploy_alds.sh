#!/usr/bin/env bash
set -euo pipefail

# Deploy ALDS for one-portal online demo on OCI.
# Usage:
#   ./01_deploy_alds.sh --host <PUBLIC_DOMAIN_OR_IP> --repo-root ~/Github

HOST=""
REPO_ROOT="${HOME}/Github"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --repo-root)
      REPO_ROOT="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "Missing required --host <PUBLIC_DOMAIN_OR_IP>"
  exit 1
fi

PROJECT_DIR="${REPO_ROOT}/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3"
DASHBOARD_DIR="${PROJECT_DIR}/dashboard"
APP_DIR="${PROJECT_DIR}"
COMPOSE_DIR="${PROJECT_DIR}/elk-wazuh-compose"
SERVICE_OUT="/etc/systemd/system/alds-api.service"
CADDYFILE_OUT="/etc/caddy/Caddyfile"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "Project dir not found: $PROJECT_DIR"
  echo "Set correct location with --repo-root"
  exit 1
fi

echo "[1/7] Creating Python virtual environment and installing deps"
cd "$APP_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[2/7] Patching dashboard API base to same-origin /api"
APP_JS="${DASHBOARD_DIR}/assets/js/app.js"
if grep -q 'const API_BASE = "http://localhost:8000";' "$APP_JS"; then
  sed -i 's|const API_BASE = "http://localhost:8000";|const API_BASE = "/api";|' "$APP_JS"
fi

echo "[3/7] Writing systemd unit"
sudo tee "$SERVICE_OUT" >/dev/null <<EOF
[Unit]
Description=ALDS FastAPI Service
After=network.target

[Service]
User=${USER}
WorkingDirectory=${APP_DIR}
Environment=PATH=${APP_DIR}/.venv/bin
ExecStart=${APP_DIR}/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable alds-api
sudo systemctl restart alds-api

echo "[4/7] Writing Caddy config"
sudo tee "$CADDYFILE_OUT" >/dev/null <<EOF
${HOST} {
    root * ${DASHBOARD_DIR}
    file_server

    handle_path /api/* {
        reverse_proxy 127.0.0.1:8000
    }
}
EOF

sudo systemctl enable caddy
sudo systemctl restart caddy

echo "[5/7] Starting ELK/Wazuh compose stack"
cd "$COMPOSE_DIR"
docker compose up -d

echo "[6/7] Service status"
sudo systemctl --no-pager status alds-api | sed -n '1,20p'
sudo systemctl --no-pager status caddy | sed -n '1,20p'
docker compose ps

echo "[7/7] Done"
echo "Open: http://${HOST}/"
echo "API docs: http://${HOST}/api/docs"
