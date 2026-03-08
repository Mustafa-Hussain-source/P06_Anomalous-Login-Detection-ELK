#!/usr/bin/env bash
set -euo pipefail

# One-shot deploy for Oracle Linux (opc user) on OCI VM.
# Usage:
#   chmod +x 02_oraclelinux_one_shot_deploy.sh
#   ./02_oraclelinux_one_shot_deploy.sh --host 92.4.88.117 --repo-url <git-url>
# Optional if repo is already present at ~/Github:
#   ./02_oraclelinux_one_shot_deploy.sh --host 92.4.88.117

HOST=""
REPO_URL=""
BASE_DIR="$HOME/Github"
PROJECT_REL="P06_Anomalous-Login-Detection-ELK/Development/Sprint-3"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --repo-url)
      REPO_URL="${2:-}"
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

echo "[1/9] Install dependencies"
sudo dnf -y update
sudo dnf -y install git python3 python3-pip python3-virtualenv docker nginx policycoreutils-python-utils
sudo systemctl enable --now docker

mkdir -p "$BASE_DIR"

if [[ ! -d "$BASE_DIR/P06_Anomalous-Login-Detection-ELK" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    echo "Repo missing at $BASE_DIR/P06_Anomalous-Login-Detection-ELK and no --repo-url provided."
    echo "Provide --repo-url or copy project directory first."
    exit 1
  fi
  echo "[2/9] Clone repository"
  git clone "$REPO_URL" "$BASE_DIR"
else
  echo "[2/9] Repository already present"
fi

APP_DIR="$BASE_DIR/$PROJECT_REL"
DASHBOARD_JS="$APP_DIR/dashboard/assets/js/app.js"
COMPOSE_DIR="$APP_DIR/elk-wazuh-compose"

if [[ ! -d "$APP_DIR" ]]; then
  echo "App directory not found: $APP_DIR"
  exit 1
fi

echo "[3/9] Python environment"
cd "$APP_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[4/9] Patch dashboard API base to /api"
if grep -q 'const API_BASE = "http://localhost:8000";' "$DASHBOARD_JS"; then
  sed -i 's|const API_BASE = "http://localhost:8000";|const API_BASE = "/api";|' "$DASHBOARD_JS"
fi

echo "[5/9] Configure systemd service (FastAPI)"
sudo tee /etc/systemd/system/alds-api.service >/dev/null <<EOF
[Unit]
Description=ALDS FastAPI Service
After=network.target

[Service]
User=opc
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/.venv/bin
ExecStart=$APP_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now alds-api

echo "[6/9] Configure Nginx single-portal reverse proxy"
sudo tee /etc/nginx/conf.d/alds.conf >/dev/null <<EOF
server {
    listen 80;
    server_name _;

    root $APP_DIR/dashboard;
    index index.html;

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

sudo setsebool -P httpd_can_network_connect 1
sudo nginx -t
sudo systemctl enable --now nginx

echo "[7/9] Start ELK/Wazuh Docker Compose"
cd "$COMPOSE_DIR"
docker compose up -d

echo "[8/9] Service checks"
sudo systemctl --no-pager status alds-api | sed -n '1,25p'
sudo systemctl --no-pager status nginx | sed -n '1,25p'
docker compose ps

echo "[9/9] Done"
echo "Portal: http://$HOST/"
echo "API docs: http://$HOST/api/docs"
