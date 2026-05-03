#!/usr/bin/env bash
# Poll actuator readiness until all gateways see upstreams (avoids nginx 502 spam).
#
#   sudo WAIT_STACK_SECS=480 bash lib/wait-for-stack-ready.sh /opt/node-app/node_backend_app/docker-compose.yaml
#
set -uo pipefail
COMPOSE_FILE="${1:?usage: wait-for-stack-ready.sh <docker-compose.yaml>}"
PROJECT="${COMPOSE_PROJECT:-node-platform}"
MAX_WAIT="${WAIT_STACK_SECS:-480}"
STEP="${WAIT_STACK_POLL_SECS:-5}"

# Order matches typical startup deps (postgres/kafka handled inside services).
checks=(
  "http://127.0.0.1:8080/actuator/health/readiness events-service"
  "http://127.0.0.1:8081/actuator/health/readiness identity-service"
  "http://127.0.0.1:8082/actuator/health/readiness booking-service"
  "http://127.0.0.1:8084/actuator/health/readiness discovery-service"
  "http://127.0.0.1:8083/actuator/health/readiness notification-service"
)

started="$(date +%s)"
attempt=1
while true; do
  all_ok=1
  failing=()
  for c in "${checks[@]}"; do
    url="${c%% *}"
    name="${c#* }"
    if curl -fsS --connect-timeout 3 --max-time 15 -o /dev/null "$url" 2>/dev/null; then
      :
    else
      all_ok=0
      failing+=("${name}")
    fi
  done
  if [[ "$all_ok" -eq 1 ]]; then
    echo "wait-for-stack-ready: all ${#checks[@]} services passed readiness (${attempt} poll rounds)"
    exit 0
  fi
  now="$(date +%s)"
  if (( now - started >= MAX_WAIT )); then
    echo "wait-for-stack-ready: TIMEOUT after ${MAX_WAIT}s — still down: ${failing[*]}" >&2
    echo "Diagnostics: sudo docker compose -p ${PROJECT} -f ${COMPOSE_FILE} ps" >&2
    echo "Logs: sudo docker compose -p ${PROJECT} -f ${COMPOSE_FILE} logs --tail=80 events-service" >&2
    exit 1
  fi
  if (( attempt == 1 || attempt % 6 == 0 )); then
    echo "wait-for-stack-ready: waiting on: ${failing[*]} (${now-started}s elapsed)…"
  fi
  sleep "$STEP"
  attempt=$((attempt + 1))
done
