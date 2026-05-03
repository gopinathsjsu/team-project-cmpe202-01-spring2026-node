#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker nginx tar
systemctl enable --now docker
usermod -aG docker ec2-user 2>/dev/null || true

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

rm -f /etc/nginx/conf.d/default.conf
python3 /opt/node-app/deploy-artifacts/strip-nginx-stock-default-server.py /etc/nginx/nginx.conf || true
bash /opt/node-app/deploy-artifacts/assemble-nginx-node-app.sh ""
nginx -t
systemctl enable --now nginx
systemctl restart nginx

export DOCKER_BUILDKIT=1
cd /opt/node-app/node_backend_app
# First boot: build and start stack (userdata already waited for nginx).
docker compose -p node-platform up -d --build

# Subsequent boots: systemd runs `compose up -d` (no rebuild). Container `restart` policies keep services up.
if [ -f /opt/node-app/deploy-artifacts/node-docker-compose.service ]; then
  cp /opt/node-app/deploy-artifacts/node-docker-compose.service /etc/systemd/system/node-docker-compose.service
else
  cat >/etc/systemd/system/node-docker-compose.service <<'UNIT'
[Unit]
Description=Node event platform (docker compose)
After=docker.service network-online.target nginx.service
Wants=network-online.target nginx.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/node-app/node_backend_app
ExecStart=/usr/bin/docker compose -p node-platform up -d
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
UNIT
fi
systemctl daemon-reload
systemctl enable --now node-docker-compose.service
