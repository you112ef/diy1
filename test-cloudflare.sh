#!/bin/bash

# 🧪 Bolt.diy Cloudflare Pages Test Script
# This script tests the deployment configuration

set -e

echo "🧪 Testing Bolt.diy Cloudflare Pages Configuration"
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

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_status "Running test: $test_name"
    
    if eval "$test_command"; then
        print_success "✅ $test_name passed"
        ((TESTS_PASSED++))
    else
        print_error "❌ $test_name failed"
        ((TESTS_FAILED++))
    fi
    echo
}

# Test 1: Check if required files exist
run_test "Required files check" '
    [ -f "package.json" ] && \
    [ -f ".env.example" ] && \
    [ -f "vite.config.ts" ] && \
    [ -f "tsconfig.json" ]
'

# Test 2: Check if problematic files are removed
run_test "Problematic files removed" '
    [ ! -f ".tool-versions" ] && \
    [ ! -f "wrangler.toml" ]
'

# Test 3: Check if Cloudflare configuration files exist
run_test "Cloudflare config files" '
    [ -f "public/_routes.json" ] && \
    [ -f "public/_headers" ] && \
    [ -f "public/_redirects" ] && \
    [ -f "_worker.js" ]
'

# Test 4: Check package.json scripts
run_test "Build script exists" '
    grep -q "build" package.json
'

# Test 5: Check dependencies
run_test "Required dependencies" '
    grep -q "@remix-run/cloudflare" package.json && \
    grep -q "@remix-run/cloudflare-pages" package.json
'

# Test 6: Check if build directory exists (if built)
if [ -d "build" ]; then
    run_test "Build output structure" '
        [ -d "build/client" ] && \
        [ -d "build/server" ]
    '
else
    print_warning "Build directory not found. Run ./build-cloudflare.sh first."
fi

# Test 7: Check environment variables in .env.example
run_test "Environment variables" '
    grep -q "OPENAI_API_KEY" .env.example && \
    grep -q "ANTHROPIC_API_KEY" .env.example
'

# Test 8: Check GitHub Actions workflow
run_test "GitHub Actions workflow" '
    [ -f ".github/workflows/cloudflare-pages-deploy.yml" ]
'

# Test 9: Check deployment scripts
run_test "Deployment scripts" '
    [ -f "deploy-cloudflare.sh" ] && \
    [ -f "build-cloudflare.sh" ] && \
    [ -x "deploy-cloudflare.sh" ] && \
    [ -x "build-cloudflare.sh" ]
'

# Test 10: Check documentation files
run_test "Documentation files" '
    [ -f "CLOUDFLARE_DEPLOYMENT_GUIDE.md" ] && \
    [ -f "CLOUDFLARE_README.md" ] && \
    [ -f "DEPLOYMENT.md" ]
'

# Summary
echo "🧪 Test Results Summary"
echo "======================="
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo "📊 Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo
    print_success "🎉 All tests passed! Your repository is ready for Cloudflare Pages deployment."
    echo
    echo "🚀 Next steps:"
    echo "1. Fork this repository to your GitHub account"
    echo "2. Run: ./deploy-cloudflare.sh"
    echo "3. Follow the Cloudflare Pages setup guide"
else
    echo
    print_warning "⚠️  Some tests failed. Please fix the issues before deploying."
    echo
    echo "🔧 Common fixes:"
    echo "- Remove .tool-versions and wrangler.toml files"
    echo "- Ensure all configuration files are in place"
    echo "- Check file permissions on scripts"
fi

echo
echo "📖 For detailed instructions, see: CLOUDFLARE_DEPLOYMENT_GUIDE.md"