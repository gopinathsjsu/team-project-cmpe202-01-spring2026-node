#!/usr/bin/env bash
# Bring the Node platform up on EC2 in one shot (nginx + SPA + Compose).
# Requires /opt/node-app from your deploy bundle or rsync.
#
#   sudo bash /opt/node-app/deploy-artifacts/ensure-app-running.sh
#
# HTTPS site name (matches LetsEncrypt/live/<host>/): pass or export:
#   NODE_TLS_HOSTNAME=node-events.mgcodes.com sudo -E bash ...
#
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec env NODE_TLS_HOSTNAME="${NODE_TLS_HOSTNAME:-${1:-}}" COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}" \
  bash "${DIR}/heal-remote.sh"
