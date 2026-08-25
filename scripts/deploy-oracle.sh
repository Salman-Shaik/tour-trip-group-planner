#!/bin/sh
set -eu

IMAGE=${1:?Usage: deploy-oracle.sh <container-image>}
DEPLOY_DIR=${ROAMLY_DEPLOY_DIR:-/opt/roamly}
cd "$DEPLOY_DIR"
mkdir -p backups bootstrap
export ROAMLY_IMAGE="$IMAGE"

if container_id=$(docker compose -f compose.oracle.yaml ps -q roamly 2>/dev/null) && [ -n "$container_id" ]; then
  timestamp=$(date -u +%Y%m%dT%H%M%SZ)
  docker cp "$container_id:/app/data/db.json" "backups/db-$timestamp.json" 2>/dev/null || true
  old_image=$(docker inspect --format '{{.Config.Image}}' "$container_id")
else
  old_image=""
fi

docker compose -f compose.oracle.yaml pull
if docker compose -f compose.oracle.yaml up -d --remove-orphans --wait --wait-timeout 180; then
  docker image prune -f
  find backups -type f -name 'db-*.json' -mtime +30 -delete
  echo "Deployed $IMAGE successfully."
else
  echo "Deployment health check failed."
  if [ -n "$old_image" ]; then
    echo "Rolling back to $old_image."
    export ROAMLY_IMAGE="$old_image"
    docker compose -f compose.oracle.yaml up -d --remove-orphans --wait --wait-timeout 180
  fi
  exit 1
fi
