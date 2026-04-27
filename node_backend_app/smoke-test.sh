#!/usr/bin/env bash
#
# Post-deploy smoke test for the Node event-management backend.
#
# Runs healthchecks against all 5 Spring Boot services + a small set of public
# endpoint probes + a quick auth round-trip. Logs to stdout and a timestamped
# file under ./logs/. Exits non-zero if any probe fails.
#
# Usage:
#   ./smoke-test.sh                                  # localhost defaults
#   EVENTS_URL=http://host:8080 ./smoke-test.sh      # override any service URL
#   SKIP_AUTH_FLOW=1 ./smoke-test.sh                 # skip register/login probe
#
set -u
set -o pipefail

# ---- Service URLs (override via env) -----------------------------------------
EVENTS_URL="${EVENTS_URL:-http://localhost:8080}"
IDENTITY_URL="${IDENTITY_URL:-http://localhost:8081}"
BOOKING_URL="${BOOKING_URL:-http://localhost:8082}"
NOTIFICATION_URL="${NOTIFICATION_URL:-http://localhost:8083}"
DISCOVERY_URL="${DISCOVERY_URL:-http://localhost:8084}"

CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-3}"
MAX_TIME="${MAX_TIME:-10}"

# ---- Logging setup -----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
mkdir -p "${LOG_DIR}"
TS="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOG_DIR}/smoke-${TS}.log"

if [[ -t 1 ]]; then
    GREEN=$'\e[32m'; RED=$'\e[31m'; YELLOW=$'\e[33m'; BLUE=$'\e[34m'; BOLD=$'\e[1m'; RESET=$'\e[0m'
else
    GREEN=""; RED=""; YELLOW=""; BLUE=""; BOLD=""; RESET=""
fi

# Mirror everything to a log file (strip color from the file via tee + sed).
exec > >(tee >(sed -r 's/\x1B\[[0-9;]*[mK]//g' > "${LOG_FILE}")) 2>&1

PASS=0
FAIL=0
FAIL_LINES=()

log()    { printf '%s\n' "$*"; }
section(){ printf '\n%s== %s ==%s\n' "${BOLD}${BLUE}" "$*" "${RESET}"; }
ok()     { printf '  %s[PASS]%s %s\n' "${GREEN}" "${RESET}" "$*"; PASS=$((PASS+1)); }
bad()    { printf '  %s[FAIL]%s %s\n' "${RED}" "${RESET}" "$*"; FAIL=$((FAIL+1)); FAIL_LINES+=("$*"); }
warn()   { printf '  %s[WARN]%s %s\n' "${YELLOW}" "${RESET}" "$*"; }

# ---- HTTP helper -------------------------------------------------------------
# Args: <name> <method> <url> <expected-status-regex> [data] [auth-header]
# Captures: HTTP status, time, first 200 chars of body. Logs PASS/FAIL.
probe() {
    local name="$1" method="$2" url="$3" expect="$4" data="${5:-}" auth="${6:-}"
    local args=( -sS -o /tmp/smoke-body.$$ -w '%{http_code} %{time_total}'
                 --connect-timeout "${CONNECT_TIMEOUT}" --max-time "${MAX_TIME}"
                 -X "${method}" )
    [[ -n "${data}" ]] && args+=( -H 'Content-Type: application/json' --data "${data}" )
    [[ -n "${auth}" ]] && args+=( -H "Authorization: Bearer ${auth}" )
    args+=( "${url}" )

    local out status time_s body
    if ! out="$(curl "${args[@]}" 2>&1)"; then
        bad "${name} — ${method} ${url} (curl failed: ${out})"
        rm -f /tmp/smoke-body.$$
        return 1
    fi
    status="${out% *}"
    time_s="${out##* }"
    body="$(head -c 200 /tmp/smoke-body.$$ 2>/dev/null || true)"
    rm -f /tmp/smoke-body.$$

    if [[ "${status}" =~ ^${expect}$ ]]; then
        ok "${name} — ${method} ${url} -> ${status} (${time_s}s)"
        printf '%s\n' "${body}"  # full body to log (already truncated to 200 chars)
        return 0
    else
        bad "${name} — ${method} ${url} -> ${status} (expected ${expect}); body: ${body}"
        return 1
    fi
}

# ---- Banner ------------------------------------------------------------------
log "${BOLD}Node backend smoke test${RESET}  —  $(date)"
log "Log file: ${LOG_FILE}"
log "Services:"
log "  events       ${EVENTS_URL}"
log "  identity     ${IDENTITY_URL}"
log "  booking      ${BOOKING_URL}"
log "  notification ${NOTIFICATION_URL}"
log "  discovery    ${DISCOVERY_URL}"

# ---- Phase 1: Actuator healthchecks -----------------------------------------
section "Phase 1: /actuator/health"
probe "events       health" GET "${EVENTS_URL}/actuator/health"        '200' || true
probe "identity     health" GET "${IDENTITY_URL}/actuator/health"      '200' || true
probe "booking      health" GET "${BOOKING_URL}/actuator/health"       '200' || true
probe "notification health" GET "${NOTIFICATION_URL}/actuator/health"  '200' || true
probe "discovery    health" GET "${DISCOVERY_URL}/actuator/health"     '200' || true

# ---- Phase 2: Public endpoint smoke tests -----------------------------------
section "Phase 2: public endpoint probes"

# events-service: anonymous GETs that should always 200 (even with empty data)
probe "events       list events"      GET "${EVENTS_URL}/api/v1/events"               '200' || true
probe "events       active events"    GET "${EVENTS_URL}/api/v1/events/activeEvents"  '200' || true
probe "events       categories"       GET "${EVENTS_URL}/api/v1/events/categories"    '200' || true

# identity-service
probe "identity     health endpoint"  GET "${IDENTITY_URL}/api/v1/health"             '200' || true
# /api/v1/me requires auth — exercised in phase 3
probe "identity     /me unauthorized" GET "${IDENTITY_URL}/api/v1/me"                 '401|403' || true

# booking-service
probe "booking      all bookings"     GET "${BOOKING_URL}/api/v1/bookings/allBookings" '200' || true

# notification-service: no public GET; healthcheck already covered. Verify
# that the FCM endpoint exists by sending a malformed request and expecting 4xx.
probe "notification fcm-token shape"  POST "${NOTIFICATION_URL}/api/v1/notifications/fcm-token" \
      '4[0-9][0-9]' '{}' || true

# discovery-service
probe "discovery    browseEvents"     GET "${DISCOVERY_URL}/browseEvents?page=0&size=5" '200' || true

# ---- Phase 3: Auth round-trip (register → login → /me) ----------------------
if [[ -z "${SKIP_AUTH_FLOW:-}" ]]; then
    section "Phase 3: auth round-trip"

    EMAIL="smoke+${TS}@example.com"
    PASSWORD='SmokeTest!1234'
    REG_BODY="$(printf '{"email":"%s","password":"%s","role":"ATTENDEE","firstName":"Smoke","lastName":"Test"}' "${EMAIL}" "${PASSWORD}")"

    if probe "identity     register"  POST "${IDENTITY_URL}/api/v1/auth/register" '200|201' "${REG_BODY}"; then
        LOGIN_BODY="$(printf '{"email":"%s","password":"%s"}' "${EMAIL}" "${PASSWORD}")"
        LOGIN_RESP="$(curl -sS --connect-timeout "${CONNECT_TIMEOUT}" --max-time "${MAX_TIME}" \
            -H 'Content-Type: application/json' --data "${LOGIN_BODY}" \
            "${IDENTITY_URL}/api/v1/auth/login" 2>/dev/null || true)"

        # Best-effort token extraction without jq dependency.
        TOKEN="$(printf '%s' "${LOGIN_RESP}" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')"
        [[ -z "${TOKEN}" ]] && TOKEN="$(printf '%s' "${LOGIN_RESP}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"

        if [[ -n "${TOKEN}" ]]; then
            ok "identity     login -> token captured (${#TOKEN} chars)"
            probe "identity     /me authorized" GET "${IDENTITY_URL}/api/v1/me" '200' '' "${TOKEN}" || true
        else
            bad "identity     login — could not extract access token from response: $(printf '%s' "${LOGIN_RESP}" | head -c 200)"
        fi
    else
        warn "Skipping login/me probes because register failed"
    fi
else
    section "Phase 3: auth round-trip — SKIPPED (SKIP_AUTH_FLOW set)"
fi

# ---- Summary ----------------------------------------------------------------
section "Summary"
TOTAL=$((PASS + FAIL))
log "Total probes: ${TOTAL}   ${GREEN}Pass: ${PASS}${RESET}   ${RED}Fail: ${FAIL}${RESET}"
log "Log file:     ${LOG_FILE}"

if (( FAIL > 0 )); then
    log "${RED}${BOLD}Failed probes:${RESET}"
    for line in "${FAIL_LINES[@]}"; do
        log "  - ${line}"
    done
    exit 1
fi

log "${GREEN}${BOLD}All probes passed.${RESET}"
exit 0
