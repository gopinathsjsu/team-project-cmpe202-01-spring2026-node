#!/usr/bin/env bash
set -euo pipefail

# Lightweight deployment test:
# validates shell syntax for core deploy/recovery scripts.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

scripts=(
  "$ROOT_DIR/push-ec2-opt-node-app.sh"
  "$ROOT_DIR/ensure-app-running.sh"
  "$ROOT_DIR/heal-remote.sh"
  "$ROOT_DIR/ec2-reconcile-docker-stack.sh"
  "$ROOT_DIR/smoke-test-all-services.sh"
  "$ROOT_DIR/assemble-nginx-node-app.sh"
)

for script in "${scripts[@]}"; do
  if [[ ! -f "$script" ]]; then
    echo "Missing script: $script"
    exit 1
  fi
  bash -n "$script"
done

echo "All deployment scripts passed bash syntax validation."
