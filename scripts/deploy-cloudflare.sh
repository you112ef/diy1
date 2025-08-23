#!/bin/bash

# Cloudflare Pages Deployment Script for Bolt.diy with Ollama
# This script ensures proper deployment without build errors

set -e

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists pnpm; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    if ! command_exists wrangler; then
        print_error "wrangler is not installed. Please install wrangler first."
        print_status "Install with: npm install -g wrangler"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found, creating with default values..."
        cp .env.example .env.local
    fi
    
    # Check Ollama configuration
    if grep -q "your-ollama-server.com" .env.local; then
        print_warning "Please update OLLAMA_API_BASE_URL in .env.local with your actual Ollama server URL"
        print_status "Current configuration may cause deployment issues"
    fi
    
    print_success "Environment validation completed"
}

# Function to clean build artifacts
clean_build() {
    print_status "Cleaning build artifacts..."
    
    # Remove previous build
    rm -rf build/
    rm -rf .wrangler/
    
    # Clean node modules if needed
    if [ "$1" = "--clean-deps" ]; then
        print_status "Cleaning dependencies..."
        rm -rf node_modules/
        rm -f pnpm-lock.yaml
        pnpm install
    fi
    
    print_success "Build cleanup completed"
}

# Function to run type checking
run_typecheck() {
    print_status "Running TypeScript type checking..."
    
    if pnpm run typecheck; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed. Please fix type errors before deployment."
        exit 1
    fi
}

# Function to run linting
run_linting() {
    print_status "Running ESLint..."
    
    if pnpm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found. Consider fixing them before deployment."
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled by user"
            exit 0
        fi
    fi
}

# Function to build project
build_project() {
    print_status "Building project..."
    
    # Set production environment
    export NODE_ENV=production
    
    if pnpm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed. Please check the error messages above."
        exit 1
    fi
}

# Function to deploy to Cloudflare
deploy_to_cloudflare() {
    print_status "Deploying to Cloudflare Pages..."
    
    # Check if build directory exists
    if [ ! -d "build/client" ]; then
        print_error "Build directory not found. Please run build first."
        exit 1
    fi
    
    # Deploy using wrangler
    if wrangler pages deploy build/client --project-name bolt-ollama; then
        print_success "Deployment completed successfully!"
        print_status "Your app is now live on Cloudflare Pages!"
    else
        print_error "Deployment failed. Please check the error messages above."
        exit 1
    fi
}

# Function to test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Get deployment URL (you may need to adjust this based on your setup)
    print_status "Please test your deployment manually at your Cloudflare Pages URL"
    print_status "Check the Ollama health endpoint: /api/ollama-health"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean-deps    Clean dependencies before building"
    echo "  --skip-lint     Skip linting step"
    echo "  --skip-typecheck Skip type checking step"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Full deployment process"
    echo "  $0 --clean-deps # Clean dependencies and deploy"
    echo "  $0 --skip-lint  # Skip linting, deploy directly"
}

# Main function
main() {
    print_status "Bolt.diy Cloudflare Pages Deployment Script"
    print_status "=========================================="
    
    # Parse command line arguments
    local clean_deps=false
    local skip_lint=false
    local skip_typecheck=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean-deps)
                clean_deps=true
                shift
                ;;
            --skip-lint)
                skip_lint=true
                shift
                ;;
            --skip-typecheck)
                skip_typecheck=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    validate_environment
    clean_build $([ "$clean_deps" = true ] && echo "--clean-deps")
    
    if [ "$skip_typecheck" = false ]; then
        run_typecheck
    fi
    
    if [ "$skip_lint" = false ]; then
        run_linting
    fi
    
    build_project
    deploy_to_cloudflare
    test_deployment
    
    print_success "Deployment process completed successfully!"
    print_status "Your Bolt.diy app with Ollama is now live on Cloudflare Pages!"
}

# Run main function with all arguments
main "$@"