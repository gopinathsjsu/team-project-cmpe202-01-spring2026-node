[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xRTHk3Dv)

Team is following Scrum Practices to develop Node app:

Link to tracking sheet: https://docs.google.com/spreadsheets/d/1sS17w_S_EZQKe112ugmivBW-0eAAfOS5-_SmnGEWTso/edit?gid=1830485995#gid=1830485995 


Node is an event-management app that is used by:

1. Event Orgnizers: To create/ update events
2. Users: To search, view and book free/paid events.
3. Admins: To approve/disapprove events and view analytics about the platform.

Functional Requirement:

1. User Authentication - Role-based access (Attendee, Organizer, Admin)
2. Event Home Page - Search, filter, and browse events by category, price, date
3. Event Management by admin/organizer - Create, edit, publish, and manage events
4. Booking System - Complete ticketing with capacity management
5. Google Maps Integration - Location display and directions
6. Calendar Integration - Add to Google Calendar, Outlook, Yahoo, or download .ics
7. RSVP Tracking - Attendee management for organizers
8. Admin Management - Platform oversight and event approval
10. Analytics Dashboard for admin/organizer.
11. To be continued...

Non Functional Requirement:

1. Availability
2. Scalability

Tech Stack:

Python, React, Postgres
Git
Excel sheet
Google meet for conference

Architecture Diagram:
/designs/architecture.pdf

Database Design:

/designs/db_design.pdf

Wireframes:
/designs/wireframe/...

API Specifis to start with:
https://docs.google.com/document/d/1MJzSrAHIUh0MCJmyZ7jPejq5NG0oiYXtWKJ2vkWn-B8/edit?tab=t.0#heading=h.nl1hj2kzuxa

---

## Running the backend

The backend is 5 Spring Boot microservices plus PostgreSQL (with PostGIS) and Kafka, all orchestrated via Docker Compose. The compose file lives at `node_backend_app/docker-compose.yaml` and is the source of truth for ports, env vars, and service ordering.

### Prerequisites

- Docker and Docker Compose (`docker --version`, `docker compose version`)
- Free host ports: `5433` (Postgres), `9092` (Kafka), `2181` (Zookeeper), `8080`–`8084` (services), `5174` (frontend dev)

### Build and start everything

```bash
cd node_backend_app
docker compose up --build -d
```

First build downloads Maven dependencies for all 5 services and takes ~5–10 min. Subsequent runs start in seconds. Compose handles ordering automatically — Postgres and Kafka must be healthy before the services start, and `events-service` must be healthy before `booking-service` / `identity-service` / `discovery-service` start.

### Service map (host ports)

| Service              | Port  | Health endpoint              |
|----------------------|-------|------------------------------|
| events-service       | 8080  | `/actuator/health`           |
| identity-service     | 8081  | `/actuator/health`           |
| booking-service      | 8082  | `/actuator/health`           |
| notification-service | 8083  | `/actuator/health`           |
| discovery-service    | 8084  | `/actuator/health`           |
| Postgres (PostGIS)   | 5433  | (DB; user `postgres` / password `password`) |
| Kafka                | 9092  | —                            |

Logical databases: `event_db`, `booking_db`, `identity_db`, `notification_db`.

### Verify the stack is healthy

```bash
docker compose ps                   # every service should show "healthy"
./smoke-test.sh                     # 16-probe healthcheck + endpoint + auth round-trip
```

`smoke-test.sh` writes a timestamped log to `node_backend_app/logs/smoke-<timestamp>.log` and exits non-zero if any probe fails.

### Watching logs

All services emit JSON logs to stdout (Logback + logstash encoder). Compose aggregates them.

```bash
docker compose logs -f --tail=100                                # all services, follow
docker compose logs -f events-service                            # one service
docker logs -f events-service | jq -r '"\(.["@timestamp"]) [\(.level)] \(.logger_name) - \(.message)"'   # pretty-print one service
```

### Common variants

```bash
docker compose up --build                                        # foreground (Ctrl-C stops)
docker compose up -d                                             # no rebuild
docker compose up --build -d events-service                      # rebuild a single service
docker compose up --build --force-recreate -d                    # recreate even if config unchanged
```

### Stop / kill all services

```bash
cd node_backend_app
docker compose down                # stop + remove containers, KEEP Postgres data volume
docker compose down -v             # stop + remove containers AND wipe Postgres data
docker compose stop                # stop containers but keep them around (faster restart)
docker compose start               # restart previously-stopped containers
```

After `docker compose down`, restart with `docker compose up -d` (no `--build` needed unless source changed). Use `down -v` only when you want a clean slate — it deletes registered users, events, bookings, etc.

### Optional environment overrides

Create `node_backend_app/.env` if you want to override defaults — none are required:

```bash
JWT_SECRET=<base64-secret>                  # rotated across all services
MAIL_USERNAME=<gmail-address>               # SMTP for notification-service emails
MAIL_PASSWORD=<gmail-app-password>
FIREBASE_CREDENTIALS_PATH=<host-path>       # for FCM push notifications
```

### Frontend (separate process — not in compose)

```bash
cd node_frontend_app
npm install        # first time only
npm run dev        # http://localhost:5174 — proxies /api/v1/* to the right service
```

### Troubleshooting

| Symptom | Fix |
|---|---|
| `port already allocated` | `lsof -ti:8080 \| xargs kill` (and the other ports) |
| Service stuck in `unhealthy` | `docker compose logs <service>` — usually DB/Kafka not ready, increase healthcheck `start_period` |
| Postgres init didn't run | `docker compose down -v` to wipe the volume; init script only runs on first boot |
| Booking returns "Event not found" | events-service hadn't fully started before booking. `docker compose restart booking-service` recovers. |
| Notification consumer logs nothing | Producer send failed (check events-service / booking-service logs) or topic creation failed (`docker compose logs kafka-init`) |

