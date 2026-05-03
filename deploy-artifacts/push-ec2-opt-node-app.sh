#!/usr/bin/env bash
# Sync this repo onto EC2 under /opt/node-app, recreate compose stack,
# install node-docker-compose.service, enable docker + nginx at boot.
#
# Usage:
#   export SSH_KEY=/path/to/your-key.pem
#   ./deploy-artifacts/push-ec2-opt-node-app.sh
#
# Optional:
#   EC2_HOST=184.33.85.114 EC2_USER=ec2-user ./deploy-artifacts/push-ec2-opt-node-app.sh
#
set -euo pipefail

SSH_KEY="${SSH_KEY:?export SSH_KEY=/path/to/your-instance-key.pem}"
if [[ ! -r "$SSH_KEY" ]]; then
  echo "ERROR: SSH_KEY is not a readable file: $SSH_KEY" >&2
  echo "Fix: export SSH_KEY=/absolute/path/to/your-real-key.pem" >&2
  exit 1
fi
EC2_HOST="${EC2_HOST:-184.33.85.114}"
EC2_USER="${EC2_USER:-ec2-user}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_HOST}")
RSYNC_RSH='ssh -i '"$SSH_KEY"' -o StrictHostKeyChecking=accept-new'

echo "==> Syncing repo to ${EC2_USER}@${EC2_HOST}:/tmp/node-app-sync (excluding heavy dirs)"
rsync -avz \
  --exclude node_modules \
  --exclude '**/target' \
  --exclude .git \
  --exclude '.cursor' \
  -e "$RSYNC_RSH" \
  "${REPO_ROOT}/" \
  "${EC2_USER}@${EC2_HOST}:/tmp/node-app-sync/"

echo "==> Remote: merge into /opt/node-app, compose up, systemd"
"${SSH[@]}" bash -s <<'REMOTE'
set -euxo pipefail
sudo mkdir -p /opt/node-app
sudo rsync -a /tmp/node-app-sync/ /opt/node-app/

sudo systemctl enable docker nginx 2>/dev/null || true

COMPOSE_FILE=/opt/node-app/node_backend_app/docker-compose.yaml
sudo docker compose -f "$COMPOSE_FILE" up -d

if [ -f /opt/node-app/deploy-artifacts/node-docker-compose.service ]; then
  sudo cp /opt/node-app/deploy-artifacts/node-docker-compose.service /etc/systemd/system/node-docker-compose.service
else
  echo "Missing /opt/node-app/deploy-artifacts/node-docker-compose.service" >&2
  exit 1
fi
sudo systemctl daemon-reload
sudo systemctl enable --now node-docker-compose.service

sudo systemctl status node-docker-compose.service --no-pager || true
sudo docker compose -f "$COMPOSE_FILE" ps
REMOTE

echo "==> Done. Open http://${EC2_HOST}/ when status checks pass."
