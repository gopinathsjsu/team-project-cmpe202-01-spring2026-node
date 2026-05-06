[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xRTHk3Dv)

## Team

**Team name:** Node — CMPE 202 *

**Members and contribution areas**

| Team member | Summary of contribution areas |
|-------------|--------------------------------|
| **Megha Gangal** | **Identity service** (authentication, JWT, RBAC, admin APIs, Flyway, health/docs) and **AWS deployment** (EC2, Docker Compose, Nginx, deploy/heal scripts). |
| **Mansi Gupta** | **EventServices, bookingServices, calender and map API** (End-to-end development of event management and booking management services including frontend and backend, calender and location(openstreetmap) api's integration) |
| **Kavan** | **DiscoveryServices** (services to search events based on different filters) |
| **Nikhil** | **NotificationServices** |

**Project journal (GitHub):** [Team repository](https://github.com/gopinathsjsu/team-project-cmpe202-01-spring2026-node)

**Product backlog and sprint backlogs (Google Sheet):** [CMPE_202: Node Tracking List](https://docs.google.com/spreadsheets/d/1sS17w_S_EZQKe112ugmivBW-0eAAfOS5-_SmnGEWTso/edit?gid=1830485995#gid=1830485995) — Product Backlog and per-sprint tabs (Sprint-1, Sprint-2, etc.).
**Project Doc's(including API specs, Wireframes and HLD)** https://docs.google.com/document/d/1MJzSrAHIUh0MCJmyZ7jPejq5NG0oiYXtWKJ2vkWn-B8/edit?tab=t.0



---

Team is following Scrum Practices to develop Node app.

Node is an event-management app that is used by:

1. Event Organizers: To create/ update events
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
11. Notification Services: Email for booking confirmation/RSVP Email

Non Functional Requirement:

1. Availability
2. Scalability

Tech Stack:

Java 17 (Spring Boot microservices), React (Vite), PostgreSQL (PostGIS), Kafka, Docker Compose, Nginx, AWS EC2  
Git  
Excel sheet (sprints / story points)  
Google Meet for ceremonies  

Architecture Diagram:
/designs/architecture.pdf  

Deployment (production overview): [`design/deployment-diagram.md`](design/deployment-diagram.md) (Mermaid + PNG)

Database Design:

/designs/db_design.pdf

Wireframes:
/designs/wireframe/...

API Specifis to start with:
https://docs.google.com/document/d/1MJzSrAHIUh0MCJmyZ7jPejq5NG0oiYXtWKJ2vkWn-B8/edit?tab=t.0#heading=h.nl1hj2kzuxa

UML Class Diagram
https://lucid.app/lucidchart/ff52ae41-9c3e-4d10-8172-815fb9c23433/edit?invitationId=inv_b31c4bd3-8640-4062-b97c-2a1b34c242b7&page=0_0#

---

## Team contributions

### Megha Gangal

**Primary ownership:** Identity Service, API/Frontend integration for identity flows, and AWS production deployment.

---

### 1) Identity Service (`node_backend_app/identity-service`)

| Area | What was delivered |
|------|-------------------|
| Authentication | Implemented register, login, logout, refresh-token flow, and bootstrap first admin setup |
| Authorization | JWT + role-based access for Attendee, Organizer, and Admin |
| Profile APIs | `GET/PATCH /api/v1/me` and `GET/PUT /api/v1/organizers/me` |
| Admin APIs | User management (paged list, create/remove admin, activate/deactivate/delete) and event approve/reject |
| Data & security | BCrypt password hashing, Flyway migrations, request validation, and structured error handling |
| Health & docs | `GET /api/v1/health`, Actuator, OpenAPI/Swagger, and Postman collection verification |

---

### 2) API Design & Integration

| Area | What was delivered |
|------|-------------------|
| API design | Versioned REST APIs under `/api/v1` with clear request/response contracts |
| Validation & errors | Request validation and consistent JSON error responses |
| Service integration | Identity moderation calls integrated with Event Service via WebClient |
| API docs | Endpoints documented in Swagger and `design/api-index.md` |

---

### 3) Frontend Integration

| Area | What was delivered |
|------|-------------------|
| Auth flow | Frontend login/register/logout integrated with Identity APIs |
| Session handling | Access/refresh token handling with axios interceptors and AuthContext |
| Profile page | Profile update UI for bio, interests, location, and timezone (`/profile`) |
| Admin UI | Bootstrap-admin flow and Admin panel integrated with Identity admin APIs |

---

### 4) AWS Deployment (Production)

| Area | What was delivered |
|------|-------------------|
| Runtime | Deployed the full platform to **AWS EC2** for production/demo use (not localhost-only) |
| Services deployed | Deployed the **entire team’s stack together**: Identity, Events, Booking, Notification, Discovery, PostgreSQL (PostGIS), Kafka + Zookeeper — and handled cross-service dependencies to deliver a stable, repeatable hosted demo on EC2 |
| Load balancing & autoscaling | Provisioned an **Application Load Balancer (ALB)** with target group + health checks and configured **Auto Scaling** so instances can be added/rotated without breaking the hosted demo environment |
| Container orchestration | Managed the **Docker Compose** stack and service startup dependencies so the environment is reproducible and stable |
| Edge routing | Configured **Nginx** to serve the React frontend and route **`/api/v1`** to the correct backend services |
| Deployment automation | Automated build/sync/restart using `deploy-artifacts/push-ec2-opt-node-app.sh` |
| Recovery & validation | Used `ensure-app-running.sh`, `heal-remote.sh`, and smoke/reconcile scripts to restore the stack quickly |
| Operational runbooks | Documented EC2 connection/security-group troubleshooting and deployment handoff guidance for the team |

---

### 5) Supporting Work (Cross-cutting)

| Area | What was delivered |
|------|-------------------|
| Production bug fix | Resolved the get current location issue on production (Profile geolocation flow) |
| Repository stability | Fixed merge/compose issues so deployment config stays valid |
| Documentation | Added deployment diagram and maintained API index for team integration |

---

## Mansi Gupta  
**Primary ownership:** Event Services, Booking Services, Calendar & Map Integration (end-to-end frontend + backend)

---

### 1) Event Services (node_backend_app/events-service)

| Area | What was delivered |
|------|-------------------|
| Event CRUD | Create, update, delete, and fetch events with fields like title, description, date, time, location, category, price, and capacity |
| Event details | Detailed event view with organizer info, schedule, and availability |
| Validation & errors | Input validation for event creation (date, capacity, required fields) and structured error responses |
| Integration | APIs integrated with Booking Service (for availability) and Discovery Service (for search/filter) |

---

### 2) Booking Services (node_backend_app/booking-service)

| Area | What was delivered |
|------|-------------------|
| Ticketing | Booking system for free/mock-paid events |
| Capacity management | Prevent overbooking by validating available slots before confirmation |
| Booking APIs | Create booking, fetch user bookings, and event-based booking data |
| RSVP tracking | Track attendees per event for organizers |
| Integration | Consumes Event Service APIs to validate event existence and availability |

---

### 3) Calendar Integration

| Area | What was delivered |
|------|-------------------|
| Calendar export | Generate `.ics` files for events |
| External calendars | Support for Google Calendar, Outlook, Yahoo |
| User experience | One-click “Add to Calendar” from event detail page |

---

### 4) Map Integration

| Area | What was delivered |
|------|-------------------|
| Location display | Integrated OpenStreetMap for event locations |
| Map UI | Embedded interactive map in event detail page |
| Usability | Allows users to view and navigate to event location easily |

---

### 5) Frontend (Event & Booking flows)

| Area | What was delivered |
|------|-------------------|
| Event UI | Pages for event listing, filtering, and event details |
| Booking UI | User flow for booking tickets and viewing confirmation |
| Integration | Connected frontend with backend APIs for real-time data |
| UX | Responsive UI supporting smooth event discovery and booking |

---

### 6) Supporting work (cross-cutting)

| Area | What was delivered |
|------|-------------------|
| API testing | Verified endpoints using Postman |
| Collaboration | Worked closely with Discovery (search) and Notification services |
| Documentation | Contributed to API specs and project documentation |

---
## Kavan  
**Primary ownership:** Discovery Service (event search, filtering, and browsing)

---

### 1) Discovery Service (node_backend_app/discovery-service)

| Area | What was delivered |
|------|-------------------|
| Event search | Search events using keywords (title, description, category) |
| Filtering | Filter events by date, category, price, and availability |
| Browsing | Support category-based browsing for quick event discovery |
| Aggregation | Fetch and combine event data from Event Service for optimized responses |
| Pagination | Implement paginated results for scalable event listing |
| Sorting | Enable sorting by date, popularity, or price |

---

### 2) API Design & Integration

| Area | What was delivered |
|------|-------------------|
| REST APIs | Designed and implemented discovery APIs with JSON responses |
| Validation & errors | Input validation for filters/search queries and structured error handling |
| Integration | Connects directly to the Event table table. |
| Performance | Optimized queries for faster search and filtering responses |

---

### 3) Frontend Integration

| Area | What was delivered |
|------|-------------------|
| Search UI | Integrated search bar with backend APIs |
| Filter UI | Connected filters (date, category, price) with real-time results |
| User experience | Smooth browsing experience with dynamic updates |

---

### 4) Supporting work (cross-cutting)

| Area | What was delivered |
|------|-------------------|
| API testing | Tested endpoints using Postman |
| Collaboration | Worked closely with Event Services and Booking Services for consistent data flow |
| Documentation | Contributed to API documentation and project specs |

---
## Nikhil  
**Primary ownership:** Notification Service (email, event-driven notifications, reminders)

---

### 1) Notification Service (node_backend_app/notification-service)

| Area | What was delivered |
|------|-------------------|
| Event-driven notifications | Consumes Kafka events from Booking and Event Services |
| Email notifications | Sends booking confirmations and event-related updates via email |
| Reminders | Supports scheduled reminders for upcoming events |
| Templates | Designed reusable email templates for different notification types |

---

### 2) Messaging & Integration

| Area | What was delivered |
|------|-------------------|
| Kafka integration | Subscribes to topics for booking and event updates |
| Producers/consumers | Handles reliable message consumption for notifications |
| Integration | Works with Booking Service (booking confirmation) and Event Service (event updates) |

---

### 3) API & Configuration

| Area | What was delivered |
|------|-------------------|
| Config management | Environment-based configs for SMTP (email service) |
| Error handling | Retry handling and logging for failed notifications |
| Validation | Ensures valid payloads before sending notifications |

---

### 4) Supporting work (cross-cutting)

| Area | What was delivered |
|------|-------------------|
| Testing | Verified notification flows using Postman and Kafka events |
| Collaboration | Coordinated with Booking and Event teams for event triggers |
| Documentation | Contributed to notification flow and API documentation |
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

