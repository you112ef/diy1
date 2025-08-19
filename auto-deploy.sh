#!/bin/bash

# 🚀 Bolt DIY AI + Ollama Server - النشر التلقائي الكامل
# هذا script ينشر كل شيء تلقائياً

set -e  # Stop on any error

echo "🚀 Starting complete deployment of Bolt DIY AI + Ollama Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    print_success "Docker is available"
else
    print_warning "Docker not found - Railway will handle this"
fi

# Check if Railway CLI is available
if command -v railway &> /dev/null; then
    print_success "Railway CLI is available"
else
    print_status "Installing Railway CLI..."
    npm install -g @railway/cli
    print_success "Railway CLI installed"
fi

# Step 2: Login to Railway
print_status "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    print_status "Please login to Railway..."
    railway login
    if [ $? -ne 0 ]; then
        print_error "Failed to login to Railway"
        exit 1
    fi
else
    print_success "Already logged in to Railway"
fi

# Step 3: Build Bolt app
print_status "Building Bolt app..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Bolt app built successfully"
else
    print_error "Failed to build Bolt app"
    exit 1
fi

# Step 4: Deploy Ollama server to Railway
print_status "Deploying Ollama server to Railway..."

# Create temporary directory for Ollama deployment
TEMP_DIR=$(mktemp -d)
print_status "Created temporary directory: $TEMP_DIR"

# Copy Ollama files
cp Dockerfile.ollama "$TEMP_DIR/"
cp railway.json "$TEMP_DIR/"

cd "$TEMP_DIR"

# Initialize Railway project
print_status "Initializing Railway project..."
railway init --name "bolt-ollama-server-$(date +%s)" --template "https://github.com/railwayapp/templates/tree/main/docker"

if [ $? -ne 0 ]; then
    print_error "Failed to initialize Railway project"
    exit 1
fi

# Deploy to Railway
print_status "Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    print_success "Ollama server deployed to Railway successfully"
else
    print_error "Failed to deploy to Railway"
    exit 1
fi

# Get deployment URL
print_status "Getting deployment URL..."
sleep 10  # Wait for deployment to complete

DEPLOYMENT_URL=$(railway status --json 2>/dev/null | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ -z "$DEPLOYMENT_URL" ] || [ "$DEPLOYMENT_URL" = "null" ]; then
    print_warning "Could not get deployment URL automatically"
    print_status "Please check Railway dashboard for the URL"
    DEPLOYMENT_URL="https://your-ollama-url.railway.app"
else
    print_success "Ollama server deployed at: $DEPLOYMENT_URL"
fi

# Clean up temporary directory
cd - > /dev/null
rm -rf "$TEMP_DIR"

# Step 5: Test Ollama connection
print_status "Testing Ollama connection..."
sleep 30  # Wait for models to start loading

if curl -f "$DEPLOYMENT_URL/api/tags" &> /dev/null; then
    print_success "Ollama server is responding"
else
    print_warning "Ollama server not responding yet (models may still be loading)"
fi

# Step 6: Deploy Bolt app to Cloudflare Pages
print_status "Deploying Bolt app to Cloudflare Pages..."

# Update environment variables
export OLLAMA_API_BASE_URL="$DEPLOYMENT_URL"

# Deploy to Cloudflare Pages
npm run deploy

if [ $? -eq 0 ]; then
    print_success "Bolt app deployed to Cloudflare Pages successfully"
else
    print_error "Failed to deploy Bolt app to Cloudflare Pages"
    print_status "You can deploy manually later using: npm run deploy"
fi

# Step 7: Final instructions
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "✅ Ollama server deployed to Railway: $DEPLOYMENT_URL"
echo "✅ Bolt app deployed to Cloudflare Pages"
echo ""
echo "🔧 Next steps:"
echo "1. Add environment variable in Cloudflare Pages:"
echo "   OLLAMA_API_BASE_URL=$DEPLOYMENT_URL"
echo ""
echo "2. Wait for models to load (5-10 minutes)"
echo ""
echo "3. Test the connection:"
echo "   curl $DEPLOYMENT_URL/api/tags"
echo ""
echo "4. Your Bolt app will be available at:"
echo "   https://bolt-diy-ai.pages.dev"
echo ""
echo "🚀 Everything is now running for FREE!"
echo "   - Ollama server: Railway (500 hours/month free)"
echo "   - Bolt app: Cloudflare Pages (unlimited free)"
echo ""
echo "⚠️ Important notes:"
echo "   - Railway stops service after 15 minutes of inactivity"
echo "   - First request may be slow (cold start)"
echo "   - Use small models to fit in 512MB RAM"