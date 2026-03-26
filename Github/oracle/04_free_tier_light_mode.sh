#!/usr/bin/env bash
set -euo pipefail

# Free-tier light mode deployment:
# - Runs FastAPI + Nginx only on OCI VM
# - Skips Docker/ELK/Wazuh on VM
# - Intended for tiny OCI shapes (e.g., 1 GB RAM)
#
# Usage:
#   chmod +x 04_free_tier_light_mode.sh
#   ./04_free_tier_light_mode.sh --host <PUBLIC_IP_OR_DOMAIN>

HOST=""
BASE_DIR="$HOME/Github"
PROJECT_DIR="$BASE_DIR/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3"
APP_JS="$PROJECT_DIR/dashboard/assets/js/app.js"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "Missing --host"
  exit 1
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "Project not found at: $PROJECT_DIR"
  echo "Copy repo first to ~/Github"
  exit 1
fi

echo "[1/8] Install minimal runtime packages"
sudo dnf -y install git python3 python3-pip python3-devel nginx
python3 -m pip install --user --upgrade virtualenv || true

echo "[2/8] Optional swap creation for tiny VM"
if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
fi

echo "[3/8] Python environment"
cd "$PROJECT_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install eval_type_backport

echo "[4/8] Point dashboard to same-origin API (/api)"
if grep -q 'const API_BASE = "http://localhost:8000";' "$APP_JS"; then
  sed -i 's|const API_BASE = "http://localhost:8000";|const API_BASE = "/api";|' "$APP_JS"
fi

echo "[5/8] FastAPI systemd service"
sudo tee /etc/systemd/system/alds-api.service >/dev/null <<EOF
[Unit]
Description=ALDS FastAPI (Light Mode)
After=network.target

[Service]
User=opc
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$PROJECT_DIR/.venv/bin
ExecStart=$PROJECT_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now alds-api

echo "[6/8] Nginx reverse proxy + static portal"
sudo tee /etc/nginx/conf.d/alds.conf >/dev/null <<EOF
server {
  listen 80 default_server;
  server_name $HOST;

    root $PROJECT_DIR/dashboard;
    index index.html;

  # FastAPI Swagger UI loaded via /api/docs requests /openapi.json from root.
  # Proxy that root path to backend to prevent dashboard HTML being returned.
  location = /openapi.json {
    proxy_pass http://127.0.0.1:8000/openapi.json;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # Keep OAuth redirect endpoint on API backend for Swagger compatibility.
  location = /docs/oauth2-redirect {
    proxy_pass http://127.0.0.1:8000/docs/oauth2-redirect;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo setsebool -P httpd_can_network_connect 1 || true
sudo nginx -t
sudo systemctl enable --now nginx

echo "[7/8] Health checks"
sudo systemctl --no-pager status alds-api | sed -n '1,20p'
sudo systemctl --no-pager status nginx | sed -n '1,20p'

# Quick endpoint checks
curl -sSf http://127.0.0.1:8000/docs >/dev/null && echo "API local check: OK"
curl -sSf http://127.0.0.1/ >/dev/null && echo "Portal local check: OK"

echo "[8/8] Done"
echo "Portal: http://$HOST/"
echo "API docs: http://$HOST/api/docs"
echo "Note: ELK/Wazuh should run locally on your machine for this mode."
