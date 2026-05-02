#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker nginx tar
systemctl enable --now docker

# Add swap so t2/t3 micro can run multiple containers.
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

mkdir -p /opt/node-app
curl -L "__BUNDLE_URL__" -o /tmp/app-bundle.tar.gz
tar -xzf /tmp/app-bundle.tar.gz -C /opt/node-app

cat > /etc/nginx/conf.d/node-app.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /opt/node-app/node_frontend_app/dist;
    index index.html;

    location /api/v1/auth/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Exact match: frontend calls GET/PATCH /api/v1/me (no trailing slash). A prefix-only
    # /api/v1/me/ block causes nginx to 301-append-slash; redirects break PATCH saves in browsers.
    location = /api/v1/me {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/me/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location ^~ /api/v1/users {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Match /admin, /admin/, and /admin/users — prefix-only `/admin/` can miss odd paths on some setups.
    location ^~ /api/v1/admin {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/organizers/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /api/v1/events {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/events/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /api/v1/bookings {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/bookings/ {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /api/v1/ticket-types {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/ticket-types/ {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/notifications/ {
        proxy_pass http://127.0.0.1:8083;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/discover {
        proxy_pass http://127.0.0.1:8084;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

rm -f /etc/nginx/conf.d/default.conf
nginx -t
systemctl enable --now nginx
systemctl restart nginx

cd /opt/node-app/node_backend_app
# First boot: build and start stack (userdata already waited for nginx).
docker compose up -d --build

# Subsequent boots: systemd runs `compose up -d` (no rebuild). Container `restart` policies keep services up.
if [ -f /opt/node-app/deploy-artifacts/node-docker-compose.service ]; then
  cp /opt/node-app/deploy-artifacts/node-docker-compose.service /etc/systemd/system/node-docker-compose.service
else
  cat >/etc/systemd/system/node-docker-compose.service <<'UNIT'
[Unit]
Description=Node event platform (docker compose)
After=docker.service network-online.target
Wants=network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/node-app/node_backend_app
ExecStart=/usr/bin/docker compose up -d
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
UNIT
fi
systemctl daemon-reload
systemctl enable --now node-docker-compose.service
