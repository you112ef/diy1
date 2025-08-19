#!/bin/bash

# 🚀 Ollama Server Deployment on Railway
# هذا script ينشر Ollama server على Railway مجاناً

echo "🚀 Starting Ollama Server deployment on Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI is ready!"

# Create new Railway project for Ollama
echo "🏗️ Creating new Railway project for Ollama..."
railway init --name "bolt-ollama-server" --template "https://github.com/railwayapp/templates/tree/main/docker"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create Railway project"
    exit 1
fi

echo "✅ Railway project created successfully!"

# Deploy Ollama server
echo "🚀 Deploying Ollama server to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "🎉 Ollama server deployed successfully!"
    
    # Get the deployment URL
    echo "🔗 Getting deployment URL..."
    DEPLOYMENT_URL=$(railway status --json | jq -r '.deployments[0].url')
    
    if [ "$DEPLOYMENT_URL" != "null" ] && [ "$DEPLOYMENT_URL" != "" ]; then
        echo "✅ Ollama server is live at: $DEPLOYMENT_URL"
        echo ""
        echo "📝 Next steps:"
        echo "1. Update your Cloudflare Pages environment variables:"
        echo "   OLLAMA_API_BASE_URL=$DEPLOYMENT_URL"
        echo ""
        echo "2. Test the connection:"
        echo "   curl $DEPLOYMENT_URL/api/tags"
        echo ""
        echo "3. Deploy your Bolt app to Cloudflare Pages:"
        echo "   npm run deploy"
    else
        echo "⚠️ Could not get deployment URL. Check Railway dashboard."
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi