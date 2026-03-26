#!/usr/bin/env bash
set -euo pipefail

# Safe baseline reset + capability audit for OCI VM.
# Does not delete project files. Keeps data intact.

echo "==[1] Stop running app/services (safe) =="
sudo systemctl stop alds-api 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Stop compose stack if present
if [[ -f "$HOME/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3/elk-wazuh-compose/docker-compose.yml" ]]; then
  cd "$HOME/Github/P06_Anomalous-Login-Detection-ELK/Development/Sprint-3/elk-wazuh-compose"
  docker compose down || true
fi

# Kill any leftover processes
pkill -f uvicorn || true
pkill -f 02_oraclelinux_one_shot_deploy.sh || true

# Clear stale package locks
sudo rm -f /var/run/dnf.pid /var/run/yum.pid || true

# Refresh package metadata (no full upgrade yet)
sudo dnf clean all || true
sudo dnf makecache || true

echo "==[2] Collect baseline system facts =="
REPORT_DIR="$HOME/oracle"
REPORT_FILE="$REPORT_DIR/vm_baseline_report_$(date +%Y%m%d_%H%M%S).txt"
mkdir -p "$REPORT_DIR"

{
  echo "===== VM BASELINE REPORT ====="
  date
  echo

  echo "--- OS ---"
  cat /etc/os-release || true
  echo

  echo "--- CPU ---"
  lscpu || true
  echo

  echo "--- Memory ---"
  free -h || true
  echo

  echo "--- Disk (block) ---"
  lsblk || true
  echo

  echo "--- Disk (filesystem) ---"
  df -h || true
  echo

  echo "--- Top memory consumers ---"
  ps aux --sort=-%mem | head -n 20 || true
  echo

  echo "--- Top CPU consumers ---"
  ps aux --sort=-%cpu | head -n 20 || true
  echo

  echo "--- Docker version/info ---"
  docker --version || true
  docker info 2>/dev/null | sed -n '1,80p' || true
  echo

  echo "--- Docker leftover objects ---"
  docker ps -a || true
  echo
  docker images || true
  echo

  echo "--- Systemd quick status ---"
  systemctl is-active sshd || true
  systemctl is-active docker || true
  systemctl is-active nginx || true
  systemctl is-active alds-api || true
  echo

  echo "--- Network listeners ---"
  ss -tulpen | head -n 120 || true
  echo

  echo "--- DNF updates summary ---"
  dnf check-update || true
} | tee "$REPORT_FILE"

echo "==[3] Optional cleanup to reclaim disk =="
# Comment out if you want to keep all caches/images.
docker system prune -f || true

echo "== Done =="
echo "Report: $REPORT_FILE"
