#!/usr/bin/env bash
# Request a LetsEncrypt certificate via HTTP-01 webroot so the SPA can run on HTTPS
# (Geolocation requires a browser secure context; http://PUBLIC_IP alone will not.)
#
# Prereqs on EC2:
#   * DNS A (or AAAA) points your hostname → this server's public IPv4 (/ IPv6).
#   * nginx already exposes /.well-known/acme-challenge/ (run assemble-nginx-node-app.sh / push-ec2-opt-node-app.sh first).
#
# Run on the EC2 host (SSH or Instance Connect).
# Prefer passing hostname + email as args — sudo resets env vars, so exports alone often fail:
#   sudo bash /opt/node-app/deploy-artifacts/issue-le-cert-webroot.sh node-events.mgcodes.com you@sjsu.edu
# Or preserve env before sudo:
#   export NODE_TLS_HOSTNAME=...
#   export CERTBOT_EMAIL=...
#   sudo -E bash /opt/node-app/deploy-artifacts/issue-le-cert-webroot.sh
#
# Then redeploy with the same NODE_TLS_HOSTNAME so :443 receives the TLS server block:
#   export NODE_TLS_HOSTNAME=app.yourdomain.com EC2_USE_INSTANCE_CONNECT=1 ...
#   ./deploy-artifacts/push-ec2-opt-node-app.sh

set -euo pipefail

# sudo usually strips NODE_TLS_* from the shell; args survive.
if [[ -n "${1:-}" ]]; then NODE_TLS_HOSTNAME="$1"; fi
if [[ -n "${2:-}" ]]; then CERTBOT_EMAIL="$2"; fi

DOMAIN="${NODE_TLS_HOSTNAME:?Usage: \$1 hostname (e.g. node-events.mgcodes.com) OR export NODE_TLS_HOSTNAME (use sudo -E if using sudo)}"
EMAIL="${CERTBOT_EMAIL:?Usage: \$2 email OR export CERTBOT_EMAIL}"

if [[ "${EUID:-0}" != "0" ]]; then
  exec sudo env NODE_TLS_HOSTNAME="$DOMAIN" CERTBOT_EMAIL="$EMAIL" bash "$0" "$@"
fi

command -v certbot >/dev/null 2>&1 || dnf install -y certbot

mkdir -p /var/www/certbot/.well-known/acme-challenge
chmod -R a+rx /var/www/certbot

certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --non-interactive --agree-tos \
  --email "$EMAIL"

nginx -t
systemctl reload nginx || systemctl restart nginx

echo "==> Obtained certs for ${DOMAIN}. Rerun assemble or push with NODE_TLS_HOSTNAME=${DOMAIN}"
