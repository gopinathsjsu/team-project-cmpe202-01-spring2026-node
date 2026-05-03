# Setup & Running Guide — Node Event Management Platform

## Prerequisites

Install the following before running anything:

| Tool | Version | Purpose |
|------|---------|---------|
| Java | 17 | Backend runtime |
| Maven | 3.9+ | Backend build tool |
| Node.js | 18+ | Frontend runtime |
| Docker + Docker Compose | Latest | Database, Kafka |
| Git | Any | Version control |

---

## Project Structure

```
node_backend_app/
├── eventServices/        Spring Boot — Event & Auth API (port 8080)
└── notificationService/  Spring Boot — Notification Service (port 8081)
node_frontend_app/        React + Vite frontend (port 5174)
```

---

## 1. Environment Variables

### Event Service (`node_backend_app/eventServices/`)
No extra env vars required for local dev — uses defaults in `application.properties`.

### Notification Service (`node_backend_app/notificationService/`)
Create a `.env` file or export these before running:

```bash
export MAIL_USERNAME=your_gmail_address@gmail.com
export MAIL_PASSWORD=your_gmail_app_password       # Use an App Password, not your account password
export FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords. Generate one for "Mail".

> **Firebase credentials:** Download the service account JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key.

---

## 2. Start Infrastructure (Docker)

The database and Kafka must be running before starting any backend service.

### PostgreSQL only (for Event Service)

```bash
docker run -d \
  --name event_db \
  -e POSTGRES_DB=event_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgis/postgis:15-3.3
```

### Notification Service database

```bash
docker run -d \
  --name notification_db \
  -e POSTGRES_DB=notification_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5433:5432 \
  postgres:15
```
> Note: runs on host port **5433** to avoid conflict. Update `notificationService/application.properties` datasource URL to `jdbc:postgresql://localhost:5433/notification_db` for local dev.

### Kafka (required for Notification Service)

```bash
docker run -d \
  --name kafka \
  -p 9092:9092 \
  -e KAFKA_CFG_NODE_ID=0 \
  -e KAFKA_CFG_PROCESS_ROLES=controller,broker \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093 \
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  bitnami/kafka:latest
```

### Create Kafka topics

```bash
docker exec kafka kafka-topics.sh --create --topic booking.events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
docker exec kafka kafka-topics.sh --create --topic event.events   --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

---

## 3. Run the Event Service

```bash
cd node_backend_app/eventServices
mvn spring-boot:run
```

- API base URL: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

**Build JAR instead:**
```bash
mvn clean package -DskipTests
java -jar target/eventServices-0.0.1-SNAPSHOT.jar
```

---

## 4. Run the Notification Service

Make sure env vars are exported first (see Section 1).

```bash
cd node_backend_app/notificationService
mvn spring-boot:run
```

- API base URL: `http://localhost:8081/api/v1`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

**Register a user's FCM token (push notifications):**
```bash
curl -X POST http://localhost:8081/api/v1/notifications/fcm-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1","userEmail":"user@example.com","fcmToken":"<fcm-token>"}'
```

---

## 5. Run the Frontend

```bash
cd node_frontend_app
npm install
npm run dev
```

- App URL: `http://localhost:5174`

**Other frontend commands:**
```bash
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

---

## 6. Run Tests

### Event Service
```bash
cd node_backend_app/eventServices
mvn test                              # All tests
mvn test -Dtest=ClassName             # Single test class
```

### Notification Service
```bash
cd node_backend_app/notificationService
mvn test
```

---

## 7. Build Docker Images

### Event Service
```bash
cd node_backend_app/eventServices
docker build -t node-event-service .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/event_db \
  node-event-service
```

### Notification Service
```bash
cd node_backend_app/notificationService
docker build -t node-notification-service .
docker run -p 8081:8081 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5433/notification_db \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092 \
  -e MAIL_USERNAME=your@gmail.com \
  -e MAIL_PASSWORD=yourapppassword \
  -e FIREBASE_CREDENTIALS_PATH=/credentials/firebase.json \
  -v /path/to/firebase.json:/credentials/firebase.json \
  node-notification-service
```

---

## 8. Recommended Startup Order

```
1. Docker (Postgres for event_db)
2. Docker (Postgres for notification_db)
3. Docker (Kafka)
4. Create Kafka topics
5. Event Service        (mvn spring-boot:run)
6. Notification Service (mvn spring-boot:run)
7. Frontend             (npm run dev)
```

---

## 9. Common Issues

| Problem | Fix |
|---------|-----|
| `Connection refused` on port 5432 | Docker Postgres container is not running |
| `Topic not found` Kafka error | Run the `kafka-topics.sh --create` commands from Section 2 |
| Firebase init fails on startup | Check `FIREBASE_CREDENTIALS_PATH` points to a valid JSON file |
| Gmail SMTP auth failure | Use an App Password, not your Google account password |
| Frontend can't reach backend | Ensure Event Service is running on port 8080 |
| Port 8080 already in use | `lsof -ti:8080 \| xargs kill` |
