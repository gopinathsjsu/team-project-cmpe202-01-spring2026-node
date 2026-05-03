#!/usr/bin/env bash
# Sync this repo onto EC2 under /opt/node-app, recreate compose stack,
# install node-docker-compose.service, enable docker + nginx at boot.
#
# Usage:
#   export SSH_KEY=/path/to/your-key.pem
#   ./deploy-artifacts/push-ec2-opt-node-app.sh
#
# Or EC2 Instance Connect (no .pem — needs aws CLI configured, e.g. aws configure):
#   export EC2_USE_INSTANCE_CONNECT=1 EC2_INSTANCE_ID=i-xxxxxxxx
#   ./deploy-artifacts/push-ec2-opt-node-app.sh
#
# Requires Node/npm locally to build node_frontend_app/dist before rsync.
#
# Optional TLS (GPS / geolocation needs https://YOUR-DOMAIN — not http://PUBLIC_IP alone):
#   1. Point DNS A record for NODE_TLS_HOSTNAME → EC2 Elastic IP.
#   2. On EC2: sudo bash deploy-artifacts/issue-le-cert-webroot.sh (needs NODE_TLS_HOSTNAME + CERTBOT_EMAIL).
#   3. Deploy with: export NODE_TLS_HOSTNAME=app.example.com ...
#
# TLS is re-applied automatically if LetsEncrypt certs exist under
# /etc/letsencrypt/live/<name>/ even when NODE_TLS_HOSTNAME is unset (single cert only).
#
# Recover from nginx down / ERR_CONNECTION_REFUSED without a full redeploy — on EC2:
#   sudo bash /opt/node-app/deploy-artifacts/heal-remote.sh
#
# Optional:
#   EC2_HOST=184.33.85.114 EC2_USER=ec2-user ./deploy-artifacts/push-ec2-opt-node-app.sh
#
# --- If EC2 Instance Connect (browser) says “Error establishing SSH connection” ---
# Console Instance Connect reaches :22 via AWS infra, NOT your laptop’s public IP alone.
# In the INSTANCE security group, add BOTH (or Instance Connect stays broken):
#   • Type SSH, port 22, Source = managed prefix list for this REGION, e.g. us-west-2:
#       com.amazonaws.us-west-2.ec2-instance-connect
#     (VPC console → Managed prefix lists → Owner AWS → search “ec2-instance-connect”.)
#   • Type SSH, port 22, Source = My IP (needed for Terminal/ssh/Cursor using a .pem key).
# Same SG must still be ATTACHED on the ENI as the running instance (check instance → Security).
# If SSH still hangs after SG is correct: instance may be overloaded — EC2 Actions → Reboot instance.
#
# Compose project is pinned to `-p node-platform` (matches `name:` in docker-compose.yaml).
# If an older EC2 deploy used default project name `node_backend_app`, tear it down once so you
# do not run two Postgres stacks:
#   sudo docker compose -p node_backend_app -f /opt/node-app/node_backend_app/docker-compose.yaml down
#
# --- DevTools Network: /api/v1/... fails ~30s; main.js takes minutes ---
# Usually events-service (8080) not ready, restarting, or host CPU/RAM saturated by `docker compose --build`.
# On the instance: `docker compose ps` and `curl -sS localhost:8080/actuator/health`. Avoid full --build on tiny
# tiers while serving users; prefer deploy when quiet or use a larger instance / build elsewhere.
#
set -euo pipefail

EC2_HOST="${EC2_HOST:-184.33.85.114}"
EC2_USER="${EC2_USER:-ec2-user}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

USE_EIC="${EC2_USE_INSTANCE_CONNECT:-}"
if [[ "${USE_EIC}" == "1" || "${USE_EIC}" == "true" ]]; then
  EC2_INSTANCE_ID="${EC2_INSTANCE_ID:?set EC2_INSTANCE_ID for EC2_USE_INSTANCE_CONNECT (e.g. i-025d7d38d127217e4)}"
  if ! command -v aws >/dev/null 2>&1; then
    echo "ERROR: aws CLI not found (install AWS CLI v2)." >&2
    exit 1
  fi
  EIC_TMP="$(mktemp -d)"
  trap 'rm -rf "${EIC_TMP}"' EXIT
  SSH_KEY="${EIC_TMP}/eic"
  ssh-keygen -t ed25519 -f "$SSH_KEY" -N "" -q
  AWS_REGION="${AWS_REGION:-$(aws configure get region)}"
  EC2_AVAILABILITY_ZONE="${EC2_AVAILABILITY_ZONE:-}"
  if [[ -z "${EC2_AVAILABILITY_ZONE}" ]]; then
    EC2_AVAILABILITY_ZONE="$(aws ec2 describe-instances --region "$AWS_REGION" \
      --instance-ids "$EC2_INSTANCE_ID" \
      --query 'Reservations[0].Instances[0].Placement.AvailabilityZone' \
      --output text)"
  fi
  eic_send_key() {
    aws ec2-instance-connect send-ssh-public-key \
      --region "$AWS_REGION" \
      --availability-zone "$EC2_AVAILABILITY_ZONE" \
      --instance-id "$EC2_INSTANCE_ID" \
      --instance-os-user "$EC2_USER" \
      --ssh-public-key "file://${SSH_KEY}.pub"
  }
else
  SSH_KEY="${SSH_KEY:?export SSH_KEY=/path/to/your-instance-key.pem, or use EC2_USE_INSTANCE_CONNECT=1 EC2_INSTANCE_ID=...}"
  if [[ ! -r "$SSH_KEY" ]]; then
    echo "ERROR: SSH_KEY is not a readable file: $SSH_KEY" >&2
    echo 'Fix: export SSH_KEY=/path/to/key.pem  OR  EC2_USE_INSTANCE_CONNECT=1 EC2_INSTANCE_ID=i-...' >&2
    exit 1
  fi
  eic_send_key() { true; }
fi

SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_HOST}")
RSYNC_RSH='ssh -i '"$SSH_KEY"' -o StrictHostKeyChecking=accept-new'

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js LTS, then re-run." >&2
  exit 1
fi

echo "==> Building frontend (vite dist for nginx)"
(
  cd "${REPO_ROOT}/node_frontend_app"
  npm ci
  npm run build
)

echo "==> Syncing repo to ${EC2_USER}@${EC2_HOST}:/tmp/node-app-sync (excluding heavy dirs)"
if [[ "${USE_EIC}" == "1" || "${USE_EIC}" == "true" ]]; then
  echo "==> EC2 Instance Connect: pushing ephemeral SSH key (valid ~60s; fresh push before ssh step)"
  eic_send_key
fi
rsync -avz \
  --exclude node_modules \
  --exclude '**/target' \
  --exclude .git \
  --exclude '.cursor' \
  -e "$RSYNC_RSH" \
  "${REPO_ROOT}/" \
  "${EC2_USER}@${EC2_HOST}:/tmp/node-app-sync/"

echo "==> Remote: merge into /opt/node-app, compose up, systemd"
if [[ "${USE_EIC}" == "1" || "${USE_EIC}" == "true" ]]; then
  eic_send_key
fi
NODE_TLS_LOCAL="${NODE_TLS_HOSTNAME:-}"
PUSH_PARALLEL="${COMPOSE_PARALLEL_LIMIT:-}"
# Quote the heredoc so local-machine comment backticks cannot run command substitution via ssh stdin.
"${SSH[@]}" env NODE_TLS_HOSTNAME="${NODE_TLS_LOCAL}" COMPOSE_PARALLEL_LIMIT="${PUSH_PARALLEL}" bash -s <<'REMOTE'
set -euxo pipefail
sudo mkdir -p /opt/node-app
sudo rsync -a /tmp/node-app-sync/ /opt/node-app/

# SPA must be readable/traversable by the nginx worker (often nginx:nginx).
sudo chmod -R a+rX /opt/node-app/node_frontend_app/dist 2>/dev/null || true
# SELinux enforcing: nginx is otherwise blocked from reading custom paths under /opt.
if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce 2>/dev/null || echo Disabled)" == "Enforcing" ]] && command -v chcon >/dev/null 2>&1; then
  if [[ -d /opt/node-app/node_frontend_app/dist ]]; then
    sudo chcon -Rt httpd_sys_content_t /opt/node-app/node_frontend_app/dist 2>/dev/null || true
  fi
fi
if [[ ! -f /opt/node-app/node_frontend_app/dist/index.html ]]; then
  echo "ERROR: Built frontend missing: /opt/node-app/node_frontend_app/dist/index.html
node_frontend_app/dist is gitignored and is NOT in raw git/S3 app bundles unless your CI builds it (npm run build).
Fix: run this push script locally (it runs npm ci && npm run build before rsync), or build on another machine and copy dist/ to the server under that path." >&2
  exit 1
fi

sudo systemctl enable docker nginx 2>/dev/null || true
# So SSH sessions can run `docker` / `docker compose` without sudo (new shells pick up docker group).
sudo usermod -aG docker ec2-user 2>/dev/null || true

sudo rm -f /etc/nginx/conf.d/default.conf
sudo cp -a /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak.node-deploy-$(date +%s)"
sudo python3 /opt/node-app/deploy-artifacts/strip-nginx-stock-default-server.py /etc/nginx/nginx.conf
sudo env NODE_TLS_HOSTNAME="${NODE_TLS_HOSTNAME:-}" bash /opt/node-app/deploy-artifacts/assemble-nginx-node-app.sh "${NODE_TLS_HOSTNAME:-}"
sudo nginx -t
if ! sudo systemctl is-active --quiet nginx 2>/dev/null; then
  sudo systemctl start nginx || true
fi

COMPOSE_FILE=/opt/node-app/node_backend_app/docker-compose.yaml
# Limit parallel image pulls/builds so small instances avoid OOM killing nginx/sshd mid-deploy.
# Default 1 minimizes RAM spikes on small instances (fewer concurrent image builds); override with COMPOSE_PARALLEL_LIMIT=2 if you have headroom.
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"
# BuildKit enables Dockerfiles `# syntax=docker/dockerfile:1` and Maven --mount caches (fits small EBS disks).
export DOCKER_BUILDKIT=1
# Stop legacy Compose project (default directory name before we pinned name: node-platform) so host ports are not trapped.
sudo docker compose -p node_backend_app -f "$COMPOSE_FILE" down 2>/dev/null || true
# --build so every microservice image picks up code changes (identity, events, booking, notifications, discovery, …).
sudo env COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}" DOCKER_BUILDKIT=1 docker compose -p node-platform -f "$COMPOSE_FILE" up -d --build

WAIT_STACK=/opt/node-app/deploy-artifacts/lib/wait-for-stack-ready.sh
sudo chmod +x "$WAIT_STACK" 2>/dev/null || true
echo "Waiting for JVM services before reloading nginx…"
sudo env WAIT_STACK_SECS="${WAIT_STACK_SECS:-540}" bash "$WAIT_STACK" "$COMPOSE_FILE" || echo "WARN: some services not readiness-OK yet; check docker compose ps and logs." >&2

sudo nginx -t
if ! sudo systemctl is-active --quiet nginx 2>/dev/null; then
  echo "WARN: nginx not active after docker compose; starting" >&2
  sudo systemctl start nginx || true
fi
sudo systemctl reload nginx 2>/dev/null || sudo systemctl restart nginx
if ! curl -fsS --connect-timeout 5 -o /dev/null http://127.0.0.1/; then
  echo "WARN: probe http://127.0.0.1/ failed; restarting nginx once" >&2
  sudo systemctl restart nginx
  sleep 1
  curl -fsS --connect-timeout 8 -o /dev/null http://127.0.0.1/ || echo "WARN: nginx still not serving HTTP locally — check nginx -t and logs" >&2
fi

if [ -f /opt/node-app/deploy-artifacts/node-docker-compose.service ]; then
  sudo cp /opt/node-app/deploy-artifacts/node-docker-compose.service /etc/systemd/system/node-docker-compose.service
else
  echo "Missing /opt/node-app/deploy-artifacts/node-docker-compose.service" >&2
  exit 1
fi
sudo systemctl daemon-reload
sudo systemctl enable --now node-docker-compose.service

sudo systemctl status node-docker-compose.service --no-pager || true
sudo docker compose -p node-platform -f "$COMPOSE_FILE" ps
REMOTE

if [[ -n "${NODE_TLS_LOCAL}" ]]; then
  echo "==> For geolocation/GPS open https://${NODE_TLS_LOCAL}/ (after LetsEncrypt certs are on the server)."
fi
echo "==> Done. Open http://${EC2_HOST}/ (HTTP by IP) or https://YOUR-DOMAIN/ when TLS is configured."
echo "==> If the instance public IP changed, update DNS A records to match EC2 (${EC2_HOST}). Use an Elastic IP to avoid drift."
echo "==> Site down but SSH works? On EC2: sudo bash /opt/node-app/deploy-artifacts/ensure-app-running.sh"
