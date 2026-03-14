# Identity & Admin Microservice

Production-ready Identity and Admin service for an Eventbrite-like event platform. Handles user authentication, authorization, profile management, and admin event moderation.

## Tech Stack

- Java 17
- Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Flyway (database migrations)
- WebClient (Event Service integration)
- Swagger/OpenAPI (springdoc)
- Maven

## Features

- User registration and login (BCrypt password hashing)
- JWT access tokens (15 min) + refresh token rotation (14 days)
- Role-based access control: ATTENDEE, ORGANIZER, ADMIN
- User profile management
- Organizer profile management
- Admin event moderation (approve/reject via Event Service)
- Audit logging for all critical actions
- Global structured error handling

## Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL 14+

## Quick Start

### 1. Create the database

```sql
CREATE DATABASE identity_db;
```

### 2. Configure environment variables (or use defaults)

| Variable             | Default                     | Description               |
|----------------------|-----------------------------|---------------------------|
| `SERVER_PORT`        | `8081`                      | Server port               |
| `DB_HOST`            | `localhost`                 | PostgreSQL host           |
| `DB_PORT`            | `5432`                      | PostgreSQL port           |
| `DB_NAME`            | `identity_db`               | Database name             |
| `DB_USERNAME`        | `meghagangal`               | Database username (PostgreSQL user)                               |
| `DB_PASSWORD`        | `postgres`                  | Database password (empty if using default local auth)            |
| `JWT_SECRET`         | (built-in default)          | Base64-encoded JWT secret |
| `EVENT_SERVICE_URL`  | `http://localhost:8082`     | Event Service base URL    |

### 3. Run the application

**Option A – With PostgreSQL** (requires PostgreSQL running on localhost:5432):

```bash
cd identity-service
mvn clean install -DskipTests
mvn spring-boot:run
```

**Option B – Without PostgreSQL** (uses in-memory H2 for quick testing):

```bash
cd identity-service
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

### 4. Test the API

**Swagger UI:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)

**Postman:** Import `Event-Platform-Identity.postman_collection.json` from this directory. Run **Login** or **Register** first—tokens are saved automatically. Protected requests use the stored access token.

## API Endpoints

### Authentication (Public)

| Method | Path                     | Description             |
|--------|--------------------------|-------------------------|
| POST   | `/api/v1/auth/register`  | Register a new user     |
| POST   | `/api/v1/auth/login`     | Login                   |
| POST   | `/api/v1/auth/refresh`   | Refresh access token    |
| POST   | `/api/v1/auth/logout`    | Logout (revoke tokens)  |

### Profile (Authenticated)

| Method | Path           | Description           |
|--------|----------------|-----------------------|
| GET    | `/api/v1/me`   | Get current profile   |
| PATCH  | `/api/v1/me`   | Update current profile|

### Organizer (ORGANIZER role)

| Method | Path                     | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/api/v1/organizers/me`  | Get organizer profile          |
| PUT    | `/api/v1/organizers/me`  | Create/update organizer profile|

### Admin Moderation (ADMIN role)

| Method | Path                                    | Description     |
|--------|-----------------------------------------|-----------------|
| POST   | `/api/v1/admin/events/{eventId}/approve`| Approve event   |
| POST   | `/api/v1/admin/events/{eventId}/reject` | Reject event    |

### Health

| Method | Path               | Description   |
|--------|--------------------|---------------|
| GET    | `/api/v1/health`   | Health check  |

## JWT Authentication (for Frontend & Other Services)

All protected APIs require a valid JWT access token. Use the Identity Service as the single source of truth for auth.

### 1. Login / Register

```bash
# Login
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your-password"}'

# Response
{
  "user": { "id": "...", "email": "user@example.com", "role": "ATTENDEE" },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-encoded-refresh-token"
}
```

### 2. Calling Protected APIs

Send the access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Example:
```bash
curl -X GET http://localhost:8081/api/v1/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### 3. Token Refresh

Access tokens expire in **15 minutes**. When you receive `401 Unauthorized`, call the refresh endpoint:

```bash
curl -X POST http://localhost:8081/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your-refresh-token>"}'
```

Returns a new `accessToken` and `refreshToken`. **Always store and use the new refresh token** (rotation is enforced).

### 4. Frontend Integration

- Store `accessToken` and `refreshToken` (e.g. in localStorage or httpOnly cookies).
- Attach `Authorization: Bearer <accessToken>` to every API request.
- On 401, call `/auth/refresh` with the refresh token, then retry the failed request with the new access token.
- If refresh fails, redirect to login.

### 5. JWT Payload (for other backend services)

If another service needs to validate tokens, use the same `JWT_SECRET` (Base64-encoded). Claims:

| Claim   | Type | Description        |
|---------|------|--------------------|
| `sub`   | UUID | User ID            |
| `email` | str  | User email         |
| `role`  | str  | ATTENDEE/ORGANIZER/ADMIN |
| `exp`   | int  | Expiration (Unix)  |
| `iat`   | int  | Issued at (Unix)   |

### 6. Swagger

Use the "Authorize" button in Swagger UI, paste your access token (without "Bearer "), and all requests will include it.

## Docker

```bash
docker build -t identity-service .
docker run -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=your-base64-secret \
  identity-service
```

## Project Structure

```
src/main/java/com/eventplatform/identity/
├── config/          # Security, Swagger, WebClient config
├── security/        # JWT provider, filter, UserDetails
├── entity/          # JPA entities
├── repository/      # Spring Data JPA repositories
├── dto/
│   ├── request/     # Request DTOs with validation
│   └── response/    # Response DTOs
├── service/         # Business logic
├── controller/      # REST controllers
├── client/          # External service clients (Event Service)
└── exception/       # Custom exceptions + global handler
```
