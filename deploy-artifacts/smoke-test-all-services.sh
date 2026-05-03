#!/usr/bin/env bash
# Smoke-test all backend services (via nginx :80 + optional JVM :ports).
# Usage: HOST=http://YOUR_IP bash deploy-artifacts/smoke-test-all-services.sh
set -eu

HOST="${HOST:-http://localhost}"
HOST="${HOST%/}"
TIMEOUT=(--max-time 12)

PASS=0
FAIL=0
SKIP=0

_pass() {
  printf 'PASS %s\n' "$1"
  PASS=$((PASS + 1))
}

_fail() {
  printf 'FAIL %s — %s\n' "$1" "$2"
  FAIL=$((FAIL + 1))
}

_skip() {
  printf 'SKIP %s — %s\n' "$1" "$2"
  SKIP=$((SKIP + 1))
}

code() {
  curl -sS "${TIMEOUT[@]}" -o /dev/null -w '%{http_code}' "$@"
}

curl_json() {
  curl -sS "${TIMEOUT[@]}" "$@"
}

extract_json_token() {
  python3 -c 'import sys,json; print(json.load(sys.stdin).get("accessToken",""))' 2>/dev/null || true
}

echo "=== Smoke test target: ${HOST} ==="
echo

# ---------- Nginx / SPA ----------
c=$(code "${HOST}/")
if [[ "$c" == "200" ]]; then _pass "SPA root GET /"; else _fail "SPA root GET /" "HTTP $c"; fi

# ---------- No-slash API paths must NOT 301 ----------
for path in "/api/v1/me" "/api/v1/events" "/api/v1/bookings" "/api/v1/ticket-types"; do
  first=$(curl -sSI "${TIMEOUT[@]}" "${HOST}${path}" | head -n1 | tr -d '\r')
  if [[ "$first" =~ 301 ]]; then _fail "no redirect ${path}" "got ${first}";
  elif [[ "$first" =~ HTTP/ ]]; then _pass "no 301 redirect ${path} (${first})";
  else _fail "headers ${path}" "$first"; fi
done

# ---------- Identity ----------
c=$(code -X POST "${HOST}/api/v1/auth/login" -H "Content-Type: application/json" -d '{}')
if [[ "$c" == "401" || "$c" == "400" ]]; then _pass "identity POST /auth/login (invalid body)"; else _fail "identity login invalid" "HTTP $c"; fi

c=$(code "${HOST}/api/v1/me")
if [[ "$c" == "401" ]]; then _pass "identity GET /api/v1/me (unauthenticated)"; else _fail "identity GET /me unauth" "HTTP $c (expected 401)"; fi

# ---------- Event Service (via nginx) ----------
c=$(code "${HOST}/api/v1/events/activeEvents")
if [[ "$c" == "200" ]]; then _pass "events GET /events/activeEvents"; else _fail "events activeEvents" "HTTP $c"; fi

c=$(code "${HOST}/api/v1/events/categories")
if [[ "$c" == "200" ]]; then _pass "events GET /events/categories"; else _fail "events categories" "HTTP $c"; fi

c=$(code "${HOST}/api/v1/events")
if [[ "$c" == "200" ]]; then _pass "events GET /events"; else _fail "events list" "HTTP $c"; fi

# ---------- Discovery ----------
c=$(code "${HOST}/api/v1/discover/events?page=0&size=5")
if [[ "$c" == "200" ]]; then _pass "discovery GET /discover/events"; else _fail "discovery" "HTTP $c"; fi

# ---------- Booking (unauthenticated: expect rejection, not nginx HTML) ----------
c=$(code -X POST "${HOST}/api/v1/bookings" -H "Content-Type: application/json" -d '{}')
if [[ "$c" == "401" || "$c" == "400" || "$c" == "403" ]]; then _pass "booking POST /bookings rejects unauthenticated ($c)";
else _fail "booking POST unauth" "HTTP $c (expected 401/400/403)"; fi

# ---------- Direct actuator (optional — fails if SG closed) ----------
HOST_IP="${HOST#http://}"
HOST_IP="${HOST_IP#https://}"
HOST_IP="${HOST_IP%%/*}"
for port in 8080 8081 8082 8083 8084; do
  c=$(curl -sS "${TIMEOUT[@]}" -o /dev/null -w '%{http_code}' "http://${HOST_IP}:${port}/actuator/health" 2>/dev/null || echo "000")
  if [[ "$c" == "200" ]]; then _pass "direct :${port} actuator/health"; else _skip "direct :${port} actuator/health" "HTTP $c (SG may block)"; fi
done

echo
echo "=== Authenticated identity flow (register + login + GET /me + PATCH /me) ==="
EMAIL="smoke-$(date +%s)@example.com"
PASSW='Smoke123!test'

reg_json=$(mktemp)
reg_code=$(curl -sS "${TIMEOUT[@]}" -o "$reg_json" -w '%{http_code}' -X POST "${HOST}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSW}\",\"role\":\"ATTENDEE\",\"username\":\"smokeusr$(date +%s)\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}")
case "$reg_code" in
 200|201)
  _pass "identity POST /auth/register smoke user";;
 *)
  _fail "identity register" "HTTP $reg_code $(head -c 180 "$reg_json" | tr '\n' ' ')";;
esac

token=$(cat "$reg_json" | extract_json_token)
rm -f "$reg_json"
if [[ -n "$token" ]]; then _pass "register response contains accessToken"; else _fail "register token"; "missing"; fi

c=$(curl_json -o /tmp/me_chk.json -w '%{http_code}' "${HOST}/api/v1/me" -H "Authorization: Bearer ${token}")
if [[ "$c" == "200" ]]; then _pass "identity GET /me with Bearer"; else _fail "GET /me Bearer" "HTTP $c"; fi

patch=$(curl_json -o /tmp/me_patch.json -w '%{http_code}' -X PATCH "${HOST}/api/v1/me" \
  -H "Authorization: Bearer ${token}" \
  -H "Content-Type: application/json" \
  -d '{"timezone":"UTC"}')
if [[ "$patch" == "200" ]]; then _pass "identity PATCH /me (timezone UTC)"; else _fail "PATCH /me" "HTTP $patch"; fi

login_body=$(curl_json -X POST "${HOST}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSW}\"}")

loginTok=$(echo "$login_body" | extract_json_token)
if [[ -n "$loginTok" ]]; then _pass "identity POST /auth/login smoke user"; else _fail "login smoke user"; "missing token"; fi

echo
echo "=== Summary ==="
echo "PASS: $PASS  FAIL: $FAIL  SKIP: $SKIP"
echo "Smoke user email (delete manually if desired): ${EMAIL}"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
exit 0
