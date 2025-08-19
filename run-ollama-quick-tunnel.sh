#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.quick-tunnel.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker is not installed. Please install Docker first." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Docker Compose plugin not found. Please install Docker Compose v2 (docker compose)." >&2
  exit 1
fi

echo "🚀 Starting Ollama + Cloudflare Quick Tunnel..."
docker compose -f "$COMPOSE_FILE" up -d --pull always

echo "⏳ Waiting for Cloudflared to provide a public URL (trycloudflare.com)..."
URL=""
START=$(date +%s)
TIMEOUT=120
while [ -z "$URL" ]; do
  sleep 2
  URL=$(docker compose -f "$COMPOSE_FILE" logs cloudflared 2>/dev/null | grep -Eo "https://[a-zA-Z0-9.-]*trycloudflare\.com" | tail -n 1 || true)
  NOW=$(date +%s)
  if (( NOW - START > TIMEOUT )); then
    echo "❌ Timed out waiting for Cloudflare Quick Tunnel URL." >&2
    echo "Tip: check logs: docker compose -f $COMPOSE_FILE logs -f cloudflared" >&2
    exit 1
  fi
done

echo "$URL" > ollama_public_url.txt

echo "\n✅ Public URL detected: $URL"
echo "💾 Saved to: ollama_public_url.txt"
echo "\n➡ Set this in Cloudflare Pages environment variables as OLLAMA_API_BASE_URL:"
echo "   $URL"

echo "\n📦 Pull a default model (optional):"
echo "   docker exec -it ollama ollama pull llama3.2:1b"

echo "\n🧪 Test locally:"
echo "   curl -s $URL/api/tags | jq ."