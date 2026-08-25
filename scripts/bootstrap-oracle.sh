#!/bin/sh
set -eu

DEPLOY_USER=${SUDO_USER:-$(id -un)}
DEPLOY_DIR=${ROAMLY_DEPLOY_DIR:-/opt/roamly}

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl docker.io docker-compose-v2
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"
mkdir -p "$DEPLOY_DIR/backups" "$DEPLOY_DIR/bootstrap"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

echo "Oracle host bootstrap complete. Sign out and back in so Docker group membership takes effect."
echo "Also allow inbound TCP 80/443 and UDP 443 in the Oracle VCN security rules."
