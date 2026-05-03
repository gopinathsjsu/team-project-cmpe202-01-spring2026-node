#!/usr/bin/env bash
# Print this instance's public IPv4 if available (IMDS v1/v2); empty otherwise.
set -uo pipefail
IMDS="${AWS_EC2_METADATA_SERVICE_ENDPOINT:-http://169.254.169.254}"
curl -fsS --connect-timeout 1 -m 2 "${IMDS%/}/latest/meta-data/" &>/dev/null || exit 0
TOKEN=""
TOK="$(curl -fsS --connect-timeout 1 -m 2 \
  -X PUT "${IMDS%/}/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)" && TOKEN="$TOK"
HDR=()
[[ -n "$TOKEN" ]] && HDR=( -H "X-aws-ec2-metadata-token: $TOKEN" )
curl -fsS --connect-timeout 1 -m 2 "${HDR[@]}" "${IMDS%/}/latest/meta-data/public-ipv4" 2>/dev/null || true
