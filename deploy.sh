#!/bin/bash

# 🚀 Bolt DIY AI - Cloudflare Pages Deployment Script

echo "🚀 Starting deployment to Cloudflare Pages..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare first:"
    echo "   wrangler login"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."

# Check if staging flag is provided
if [ "$1" = "--staging" ]; then
    echo "📋 Deploying to STAGING environment..."
    wrangler pages deploy build/client --project-name=bolt-diy-ai-staging
else
    echo "🚀 Deploying to PRODUCTION environment..."
    wrangler pages deploy build/client --project-name=bolt-diy-ai
fi

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "🔗 Your app is now live on Cloudflare Pages!"
    echo "   Production: https://bolt-diy-ai.pages.dev"
    echo "   Staging: https://bolt-diy-ai-staging.pages.dev"
    echo ""
    echo "📝 Don't forget to:"
    echo "   1. Set environment variables in Cloudflare Dashboard"
    echo "   2. Configure your AI providers (OpenAI, Anthropic, etc.)"
    echo "   3. Test the deployed application"
else
    echo "❌ Deployment failed!"
    exit 1
fi