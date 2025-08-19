# 🚀 Ollama via Docker + Cloudflare Quick Tunnel (Free)

## ✅ What you get
- Free public URL (trycloudflare.com) without Cloudflare account
- Local Dockerized Ollama
- Works with Cloudflare Pages via OLLAMA_API_BASE_URL

## 📦 Start server + tunnel
```bash
# Start Dockerized Ollama + Quick Tunnel
./run-ollama-quick-tunnel.sh

# The script will output a public URL like:
#   https://xxxx-xxxx.trycloudflare.com
# and store it in ollama_public_url.txt
```

## 🔧 Configure Cloudflare Pages
Set env var in Pages Project settings:
- Key: `OLLAMA_API_BASE_URL`
- Value: `https://xxxx-xxxx.trycloudflare.com`

Redeploy the site.

## 🧪 Test
```bash
curl -s $(cat ollama_public_url.txt)/api/tags | jq .
```

## 🧰 Useful
- Pull a model:
```bash
docker exec -it ollama ollama pull llama3.2:1b
```
- Logs:
```bash
docker compose -f docker-compose.quick-tunnel.yml logs -f cloudflared
```
- Stop:
```bash
docker compose -f docker-compose.quick-tunnel.yml down
```