#!/usr/bin/env bash
set -e

print() { echo -e "\033[1;34m[bolt.diy]\033[0m $1"; }
fail() { echo -e "\033[1;31m[bolt.diy]\033[0m $1"; exit 1; }

if ! command -v docker &>/dev/null; then
  fail "Docker is not installed. Install Docker first."
fi
if ! command -v docker compose &>/dev/null && ! command -v docker-compose &>/dev/null; then
  fail "docker compose is not available. Install Docker Compose v2."
fi

PROFILE=${1:-production}
case "$PROFILE" in
  prod|production) PROFILE=production ;;
  dev|development) PROFILE=development ;;
  prebuilt) PROFILE=prebuilt ;;
  *) print "Unknown profile '$PROFILE'. Using 'production'."; PROFILE=production ;;
esac

if [ ! -f .env.local ]; then
  print "No .env.local found. Creating from .env.local.example ..."
  if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    print "Created .env.local. Please review and set your API keys."
  elif [ -f .env.example ]; then
    cp .env.example .env.local
    print "Created .env.local from .env.example. Please review and set your API keys."
  else
    print "No env example found. Continuing without it."
  fi
fi

if [ "$PROFILE" = "production" ]; then
  print "Building production image..."
  docker compose --profile production build app-prod
  print "Starting production container on http://localhost:5173 ..."
  docker compose --profile production up -d app-prod
  docker compose --profile production ps
elif [ "$PROFILE" = "development" ]; then
  print "Starting development environment with live reload on http://localhost:5173 ..."
  docker compose --profile development up --build app-dev
elif [ "$PROFILE" = "prebuilt" ]; then
  print "Starting prebuilt image..."
  docker compose --profile prebuilt up -d app-prebuild
  docker compose --profile prebuilt ps
fi

print "Done."