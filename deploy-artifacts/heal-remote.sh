#!/usr/bin/env bash
# Run on the EC2 host (paths assume /opt/node-app). Repairs nginx TLS + snippet + compose
# without rebuilding Docker images — good recovery after OOM/nginx crash or TLS mismatch.
#
#   sudo bash /opt/node-app/deploy-artifacts/heal-remote.sh
#   NODE_TLS_HOSTNAME=app.example.com sudo -E bash /opt/node-app/deploy-artifacts/heal-remote.sh
#
# One-liner alias: ensure-app-running.sh (same behaviour).
#
set -euo pipefail

SELF="${BASH_SOURCE[0]}"
APP_ROOT="${APP_ROOT:-/opt/node-app}"
COMPOSE_FILE="${APP_ROOT}/node_backend_app/docker-compose.yaml"
NODE_TLS_HOSTNAME="${NODE_TLS_HOSTNAME:-}"

if [[ "${EUID:-0}" != "0" ]]; then
  exec sudo env NODE_TLS_HOSTNAME="${NODE_TLS_HOSTNAME}" COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-}" DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}" bash "${SELF}" "$@"
fi

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"

cd "${APP_ROOT}"
if [[ ! -f "${APP_ROOT}/node_frontend_app/dist/index.html" ]]; then
  echo "heal-remote: missing ${APP_ROOT}/node_frontend_app/dist/index.html (run npm run build in node_frontend_app and deploy dist/, or use push-ec2-opt-node-app.sh from a Node machine)." >&2
  exit 1
fi
if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce 2>/dev/null || echo Disabled)" == "Enforcing" ]] && command -v chcon >/dev/null 2>&1; then
  chcon -Rt httpd_sys_content_t "${APP_ROOT}/node_frontend_app/dist" 2>/dev/null || true
fi
chmod -R a+rX "${APP_ROOT}/node_frontend_app/dist" 2>/dev/null || true
bash "${APP_ROOT}/deploy-artifacts/assemble-nginx-node-app.sh" "${NODE_TLS_HOSTNAME}"

systemctl enable nginx docker 2>/dev/null || true
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"
docker compose -p node_backend_app -f "${COMPOSE_FILE}" down 2>/dev/null || true
docker compose -p node-platform -f "${COMPOSE_FILE}" up -d

WAIT_SCRIPT="${APP_ROOT}/deploy-artifacts/lib/wait-for-stack-ready.sh"
if [[ -x "${WAIT_SCRIPT}" ]] || [[ -r "${WAIT_SCRIPT}" ]]; then
  chmod +x "${WAIT_SCRIPT}" 2>/dev/null || true
  echo "heal-remote: waiting for backends to listen (nginx will reload afterward)…"
  if ! bash "${WAIT_SCRIPT}" "${COMPOSE_FILE}"; then
    echo "heal-remote: WARN backends not all healthy yet — nginx will reload anyway; retry in ~2–5 min or check OOM/logs." >&2
  fi
else
  echo "heal-remote: WARN missing ${WAIT_SCRIPT}; sleeping 45s instead" >&2
  sleep 45
fi

nginx -t
systemctl restart nginx

if ! curl -fsS --connect-timeout 5 -o /dev/null http://127.0.0.1/; then
  echo "heal-remote: retry nginx after SPA/static issue" >&2
  systemctl restart nginx
  sleep 1
  curl -fsS --connect-timeout 8 -o /dev/null http://127.0.0.1/
fi

if [[ -f "${APP_ROOT}/deploy-artifacts/node-docker-compose.service" ]]; then
  install -m 644 "${APP_ROOT}/deploy-artifacts/node-docker-compose.service" /etc/systemd/system/node-docker-compose.service
  systemctl daemon-reload
  systemctl enable node-docker-compose.service 2>/dev/null || true
fi

echo "heal-remote: OK (nginx http://127.0.0.1/)"

echo ""
echo "==> Compose (project node-platform)"
docker compose -p node-platform -f "${COMPOSE_FILE}" ps

echo ""
echo "==> Health probes (inside instance)"
curl -fsS --connect-timeout 5 -o /dev/null http://127.0.0.1/ && echo "  nginx SPA :80 OK" || echo "  nginx SPA :80 FAILED"
curl -fsS --connect-timeout 10 -o /dev/null http://127.0.0.1:8080/actuator/health/readiness \
  && echo "  events :8080 OK" || echo "  events :8080 not ready yet (JVM warming—wait ~2 min, rerun curl)"

PUBLIC_IP=""
if [[ -r "${APP_ROOT}/deploy-artifacts/lib/ec2-public-ipv4.sh" ]]; then
  PUBLIC_IP="$(bash "${APP_ROOT}/deploy-artifacts/lib/ec2-public-ipv4.sh" 2>/dev/null || true)"
fi
echo ""
echo "Open from laptop (needs EC2 Security Group inbound TCP 80 → 0.0.0.0/0):"
[[ -n "${PUBLIC_IP}" ]] && echo "  http://${PUBLIC_IP}/"
if [[ -n "${NODE_TLS_HOSTNAME:-}" ]]; then
  if [[ -r "/etc/letsencrypt/live/${NODE_TLS_HOSTNAME}/fullchain.pem" ]]; then
    echo "  https://${NODE_TLS_HOSTNAME}/"
  else
    echo "  https://${NODE_TLS_HOSTNAME}/ (after certs: /etc/letsencrypt/live/${NODE_TLS_HOSTNAME}/)"
  fi
fi

echo ""
echo "From laptop with Node/npm: deploy + build SPA and sync everything:"
echo "  ./deploy-artifacts/push-ec2-opt-node-app.sh"
