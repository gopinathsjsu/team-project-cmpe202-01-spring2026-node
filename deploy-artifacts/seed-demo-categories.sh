#!/usr/bin/env bash
# Insert a few event categories via the public Event Service API (idempotent-ish:
# duplicates if you run twice — delete rows in Postgres if needed).
#
# From laptop (HTTPS):
#   BASE_URL=https://node-events.mgcodes.com bash deploy-artifacts/seed-demo-categories.sh
# On EC2:
#   BASE_URL=http://127.0.0.1 bash /opt/node-app/deploy-artifacts/seed-demo-categories.sh
#
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1}"
BASE_URL="${BASE_URL%/}"

post() {
  local name="$1" desc="$2"
  curl -fsS -X POST "${BASE_URL}/api/v1/events/categories" \
    -H 'Content-Type: application/json' \
    -d "{\"categoryName\":\"${name}\",\"categoryDescription\":\"${desc}\"}"
  echo "  -> OK: ${name}"
}

echo "Seeding categories at ${BASE_URL} …"
post "Music" "Concerts and live performances"
post "Technology" "Hackathons, meetups, and tech talks"
post "Sports" "Games and fitness events"
post "Arts & Culture" "Museums, theater, galleries"
post "Food & Drink" "Tastings, festivals, dinners"
echo "Done. Reload create-event page."
