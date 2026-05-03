#!/usr/bin/env bash
# Build /etc/nginx/conf.d/node-app.conf from repo templates + optional TLS blocks.
#
# Usage (on EC2):
#   bash /opt/node-app/deploy-artifacts/assemble-nginx-node-app.sh
#   bash /opt/node-app/deploy-artifacts/assemble-nginx-node-app.sh app.example.com
#
# When $1 matches /etc/letsencrypt/live/<name>/, appends :80 redirect + :443 server.
#
# If no hostname is passed and NODE_TLS_HOSTNAME is unset but exactly one LetsEncrypt
# cert exists under /etc/letsencrypt/live/<name>/, that name is used so HTTPS keeps
# working after redeploy (avoids nginx with no :443 listener → ERR_CONNECTION_REFUSED).

set -euo pipefail

if [[ "${EUID:-0}" != "0" ]]; then
  exec sudo bash "$0" "$@"
fi

pick_auto_tls_host() {
  local d bn count=0 only=""
  shopt -s nullglob
  for d in /etc/letsencrypt/live/*/; do
    bn="$(basename "$d")"
    [[ "${bn}" == README ]] && continue
    [[ -r "${d}/fullchain.pem" ]] || continue
    count=$((count + 1))
    only="${bn}"
  done
  shopt -u nullglob
  if [[ "${count}" -eq 1 ]]; then
    printf '%s' "${only}"
    return 0
  fi
  if [[ "${count}" -eq 0 ]]; then
    return 1
  fi
  echo "assemble-nginx-node-app.sh: multiple certs under /etc/letsencrypt/live/; pass hostname or set NODE_TLS_HOSTNAME." >&2
  return 1
}

HOST="${1:-${NODE_TLS_HOSTNAME:-}}"
if [[ -z "${HOST}" ]]; then
  if auto="$(pick_auto_tls_host)"; then
    HOST="${auto}"
    echo "assemble-nginx-node-app.sh: TLS hostname auto-selected: ${HOST}" >&2
  fi
fi

APP_ROOT="${APP_ROOT:-/opt/node-app}"
DA="${APP_ROOT}/deploy-artifacts"

mkdir -p /var/www/certbot/.well-known/acme-challenge
chmod -R a+rx /var/www/certbot || chmod -R 755 /var/www/certbot
mkdir -p /etc/nginx/snippets

install -m 644 "${DA}/nginx-node-app-locations-snippet.conf" \
  /etc/nginx/snippets/node-app-api-locations.conf

install -m 644 "${DA}/nginx-node-app-http-base.conf" /etc/nginx/conf.d/node-app.conf

if [[ -n "$HOST" ]] && [[ -r "/etc/letsencrypt/live/${HOST}/fullchain.pem" ]]; then
  sed "s/__NODE_TLS_HOSTNAME__/${HOST}/g" "${DA}/nginx-node-app-80-redirect.tls.fragment" \
    >>/etc/nginx/conf.d/node-app.conf
  sed "s/__NODE_TLS_HOSTNAME__/${HOST}/g" "${DA}/nginx-node-app-443.tls.fragment" \
    >>/etc/nginx/conf.d/node-app.conf
else
  if [[ -n "$HOST" ]]; then
    echo "assemble-nginx-node-app.sh: hostname '${HOST}' set but no LetsEncrypt cert at /etc/letsencrypt/live/${HOST}/" >&2
    echo "  HTTP-only config installed. After certbot, rerun this script or push with NODE_TLS_HOSTNAME." >&2
  fi
fi
