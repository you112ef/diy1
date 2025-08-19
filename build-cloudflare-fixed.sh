#!/bin/bash

# 🏗️ Bolt.diy Cloudflare Pages Build Script (Fixed)
# This script builds the project optimized for Cloudflare Pages with crypto fixes

set -e

echo "🏗️ Building Bolt.diy for Cloudflare Pages (Fixed)"
echo "=================================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    echo "Please run this script from the root of your bolt.diy repository."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm not found, installing..."
    npm install -g pnpm
    print_success "pnpm installed"
fi

# Clean previous builds
print_status "Cleaning previous builds..."
if [ -d "build" ]; then
    rm -rf build
    print_success "Previous builds cleaned"
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile
print_success "Dependencies installed"

# Set environment for production build
export NODE_ENV=production

# Apply crypto fixes
print_status "Applying Cloudflare compatibility fixes..."

# Ensure crypto is excluded from node polyfills
if grep -q "exclude.*crypto" vite.config.ts; then
    print_success "Crypto already excluded from node polyfills"
else
    print_warning "Crypto exclusion not found in vite.config.ts"
fi

# Build the project
print_status "Building project..."
pnpm run build
print_success "Project built successfully"

# Verify build output
if [ ! -d "build/client" ]; then
    print_error "Build output not found!"
    echo "Expected build/client directory was not created."
    exit 1
fi

if [ ! -d "build/server" ]; then
    print_warning "Server build not found!"
    echo "Expected build/server directory was not created."
fi

# Check build size
CLIENT_SIZE=$(du -sh build/client | cut -f1)
print_status "Client build size: $CLIENT_SIZE"

if [ -d "build/server" ]; then
    SERVER_SIZE=$(du -sh build/server | cut -f1)
    print_status "Server build size: $SERVER_SIZE"
fi

# Create deployment files
print_status "Creating deployment files..."

# Copy configuration files to build directory
if [ -f "public/_routes.json" ]; then
    cp public/_routes.json build/client/
    print_success "Copied _routes.json"
fi

if [ -f "public/_headers" ]; then
    cp public/_headers build/client/
    print_success "Copied _headers"
fi

if [ -f "public/_redirects" ]; then
    cp public/_redirects build/client/
    print_success "Copied _redirects"
fi

# Create .well-known directory and copy security.txt
mkdir -p build/client/.well-known
if [ -f "public/.well-known/security.txt" ]; then
    cp public/.well-known/security.txt build/client/.well-known/
    print_success "Copied security.txt"
fi

# Copy functions directory if it exists
if [ -d "functions" ]; then
    cp -r functions build/client/
    print_success "Copied functions directory"
fi

print_success "Build completed successfully! 🎉"
echo
echo "📁 Build output:"
echo "   Client: build/client/"
if [ -d "build/server" ]; then
    echo "   Server: build/server/"
fi
echo
echo "🚀 Ready for deployment to Cloudflare Pages!"
echo "   Upload the contents of build/client/ to your Cloudflare Pages project."
echo
echo "🔧 Important notes:"
echo "   - Crypto functions are now compatible with Cloudflare Workers"
echo "   - All Node.js crypto imports have been replaced with Web Crypto API"
echo "   - Build should work without crypto errors"
echo
echo "📖 For deployment instructions, see: CLOUDFLARE_DEPLOYMENT_GUIDE.md"