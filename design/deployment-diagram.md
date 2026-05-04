# Deployment diagram (production)

Simple view: **browser → EC2 → Nginx → Docker services → Postgres** (and Kafka for async traffic).

## Diagram (image)

![Deployment overview — browser to EC2, Nginx, Docker microservices, Postgres, Kafka](deployment-diagram.png)

*PNG generated for slides / reports. Edit the Mermaid block below if the architecture changes.*

```mermaid
flowchart TB
  subgraph Client["Client"]
    B["Browser\n(React SPA)"]
  end

  subgraph EC2["AWS EC2 (single instance)"]
    subgraph Nginx["Nginx"]
      N["TLS :443 / HTTP :80\nstatic files + reverse proxy"]
    end

    subgraph Docker["Docker Compose (node-platform)"]
      I["identity-service\n:8081"]
      E["events-service\n:8080"]
      BK["booking-service\n:8082"]
      NT["notification-service\n:8083"]
      DS["discovery-service\n:8084"]
      K["Kafka + Zookeeper"]
      P[("PostgreSQL\n(PostGIS)")]
    end
  end

  B -->|"HTTPS"| N
  N -->|"HTTP /api →"| I
  N -->|"HTTP /api →"| E
  N -->|"HTTP /api →"| BK
  N -->|"HTTP /api →"| NT
  N -->|"HTTP /api →"| DS

  I --> P
  E --> P
  BK --> P
  NT --> P
  DS --> P

  E --> K
  BK --> K
  NT --> K
```

## One-line description

Users hit **Nginx** on **EC2**; Nginx serves the **built React app** and forwards **`/api/v1/...`** to the right **Spring Boot** container. All services share **Postgres**; **Kafka** connects event/booking/notification flows.

## Optional: draw in PowerPoint / draw.io

Use three stacked **3D boxes**: **Browser** → **EC2 (Nginx)** → **EC2 (Docker + jars)** → **Postgres cylinder**. Label arrows **HTTPS** and **HTTP (reverse proxy)**.
