#!/usr/bin/env bash
set -euo pipefail

# Bootstrap OCI Ubuntu VM with required packages.

if [[ "${EUID}" -eq 0 ]]; then
  echo "Run as a regular sudo-capable user, not root."
  exit 1
fi

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get -y upgrade
sudo DEBIAN_FRONTEND=noninteractive apt-get -y install \
  ca-certificates \
  curl \
  git \
  python3 \
  python3-pip \
  python3-venv \
  docker.io \
  docker-compose-plugin \
  caddy

sudo systemctl enable docker
sudo systemctl start docker

if ! groups | grep -q "\bdocker\b"; then
  sudo usermod -aG docker "$USER"
  echo "Added $USER to docker group. Log out and back in for group change to apply."
fi

echo "Bootstrap complete."
