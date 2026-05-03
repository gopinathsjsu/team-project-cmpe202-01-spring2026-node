#!/usr/bin/env bash
# Full reset of the Compose stack on EC2 (fixes port conflicts + split projects).
#
# Usage on the instance:
#   sudo bash /opt/node-app/deploy-artifacts/ec2-reconcile-docker-stack.sh
#
# Optional: rebuild images after git pull —
#   REBUILD=1 sudo -E bash /opt/node-app/deploy-artifacts/ec2-reconcile-docker-stack.sh
#
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/node-app}"
COMPOSE_FILE="${APP_ROOT}/node_backend_app/docker-compose.yaml"
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"

if [[ "${EUID:-0}" != 0 ]]; then
  exec sudo env APP_ROOT="${APP_ROOT}" COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT}" REBUILD="${REBUILD:-}" DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}" bash "$0" "$@"
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Missing compose file: ${COMPOSE_FILE}" >&2
  exit 1
fi

docker compose -p node_backend_app -f "${COMPOSE_FILE}" down 2>/dev/null || true
docker compose -p node-platform -f "${COMPOSE_FILE}" down || true

if [[ "${REBUILD:-}" == "1" ]] || [[ "${REBUILD:-}" == "true" ]]; then
  docker compose -p node-platform -f "${COMPOSE_FILE}" up -d --build
else
  docker compose -p node-platform -f "${COMPOSE_FILE}" up -d
fi

docker compose -p node-platform -f "${COMPOSE_FILE}" ps
echo ""
echo "==> Probe events (inside host network): curl -fsS http://127.0.0.1:8080/actuator/health/readiness"
