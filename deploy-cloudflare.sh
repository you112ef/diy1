#!/bin/bash

# 🚀 Bolt.diy Cloudflare Pages Deployment Script
# This script helps you prepare your repository for Cloudflare Pages deployment

set -e

echo "🚀 Bolt.diy Cloudflare Pages Deployment Setup"
echo "=============================================="

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

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "This directory is not a git repository!"
    echo "Please run this script from the root of your bolt.diy repository."
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "stable" ]; then
    print_warning "You're not on the 'stable' branch!"
    echo "It's recommended to use the 'stable' branch for deployment."
    read -p "Do you want to switch to the stable branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout stable
        print_success "Switched to stable branch"
    fi
fi

# Remove problematic files
print_status "Removing files that cause deployment issues..."

if [ -f ".tool-versions" ]; then
    rm .tool-versions
    print_success "Removed .tool-versions"
fi

if [ -f "wrangler.toml" ]; then
    rm wrangler.toml
    print_success "Removed wrangler.toml"
fi

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    print_error ".env.example file not found!"
    echo "Please make sure you have the .env.example file in your repository."
    exit 1
fi

print_success ".env.example file found"

# Create deployment checklist
echo
echo "📋 Deployment Checklist:"
echo "========================"
echo "✅ Repository forked from bolt.diy"
echo "✅ Problematic files removed (.tool-versions, wrangler.toml)"
echo "✅ .env.example file available"
echo
echo "🔧 Next Steps:"
echo "=============="
echo "1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)"
echo "2. Navigate to 'Workers & Pages' → 'Create' → 'Pages'"
echo "3. Connect your GitHub account"
echo "4. Select your forked bolt.diy repository"
echo "5. Choose 'Remix' as the framework"
echo "6. Set build command: npm install pnpm && pnpm install && pnpm run build"
echo "7. Add environment variables from .env.example"
echo "8. Deploy!"
echo
echo "📖 For detailed instructions, see: CLOUDFLARE_DEPLOYMENT_GUIDE.md"
echo
echo "🎯 Important Settings:"
echo "======================"
echo "• Compatibility Date: 2024-09-02"
echo "• Compatibility Flags: nodejs_compat"
echo "• Branch: stable"
echo
echo "🚀 Happy Deploying!"