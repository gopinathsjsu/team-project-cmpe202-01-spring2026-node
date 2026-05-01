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
curl -L "https://node-deploy-046797549085-1777672550.s3.us-west-2.amazonaws.com/app-bundle.tar.gz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQVZKZ5YOWSCWU76J%2F20260501%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260501T220643Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=0ba083d9343356f24052228f5041f595075ecd25c232a0f7655675e7cf94c351" -o /tmp/app-bundle.tar.gz
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

    location /api/v1/me/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/admin/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/organizers/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/events/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/bookings/ {
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
docker compose up -d --build postgres zookeeper kafka events-service booking-service identity-service notification-service
