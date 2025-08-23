#!/bin/bash

# bolt.diy Ollama Deployment Script
# This script helps deploy bolt.diy with Ollama support to Cloudflare Pages

set -e

echo "🚀 bolt.diy Ollama Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install it first: npm install -g pnpm"
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler is not installed. Please install it first: npm install -g wrangler"
        exit 1
    fi
    
    log_info "All requirements met ✓"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    if [ ! -f .env.local ]; then
        log_info "Creating .env.local from .env.example"
        cp .env.example .env.local
        log_warn "Please edit .env.local with your Ollama configuration"
    fi
    
    log_info "Installing dependencies..."
    pnpm install
}

# Deploy Ollama proxy worker
deploy_worker() {
    log_info "Deploying Ollama proxy worker..."
    
    if [ ! -f workers/ollama-proxy.js ]; then
        log_error "Worker file not found. Please ensure workers/ollama-proxy.js exists"
        exit 1
    fi
    
    cd workers
    
    # Check if user is logged in to Wrangler
    if ! wrangler whoami &> /dev/null; then
        log_info "Please login to Wrangler..."
        wrangler login
    fi
    
    # Prompt user to update OLLAMA_BASE_URL
    log_warn "Please ensure you have updated OLLAMA_BASE_URL in workers/ollama-proxy.js"
    read -p "Have you updated the OLLAMA_BASE_URL? (y/N): " confirm
    if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
        log_error "Please update OLLAMA_BASE_URL in workers/ollama-proxy.js first"
        exit 1
    fi
    
    # Deploy worker
    log_info "Deploying worker..."
    wrangler deploy
    
    cd ..
    
    log_info "Worker deployed successfully ✓"
    log_info "Your worker URL should be: https://ollama-proxy.<your-subdomain>.workers.dev"
}

# Build the application
build_app() {
    log_info "Building bolt.diy application..."
    
    pnpm run build
    
    if [ $? -eq 0 ]; then
        log_info "Build completed successfully ✓"
    else
        log_error "Build failed"
        exit 1
    fi
}

# Deploy to Cloudflare Pages
deploy_pages() {
    log_info "Deploying to Cloudflare Pages..."
    
    # Check if project name is provided
    PROJECT_NAME=${1:-"bolt-diy-ollama"}
    
    log_info "Deploying with project name: $PROJECT_NAME"
    
    # Deploy using wrangler
    wrangler pages deploy build/client --project-name="$PROJECT_NAME"
    
    if [ $? -eq 0 ]; then
        log_info "Pages deployment completed successfully ✓"
        log_info "Don't forget to set environment variables in Cloudflare Dashboard:"
        log_info "  - OLLAMA_API_BASE_URL=https://ollama-proxy.<your-subdomain>.workers.dev"
        log_info "  - DEFAULT_NUM_CTX=32768"
        log_info "  - VITE_LOG_LEVEL=info"
    else
        log_error "Pages deployment failed"
        exit 1
    fi
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    read -p "Enter your worker URL (e.g., https://ollama-proxy.your-subdomain.workers.dev): " WORKER_URL
    
    if [ -z "$WORKER_URL" ]; then
        log_warn "No worker URL provided, skipping tests"
        return
    fi
    
    log_info "Testing worker health..."
    if curl -f "$WORKER_URL/health" &> /dev/null; then
        log_info "Worker health check passed ✓"
    else
        log_error "Worker health check failed"
    fi
    
    log_info "Testing Ollama API..."
    if curl -f "$WORKER_URL/api/tags" &> /dev/null; then
        log_info "Ollama API test passed ✓"
    else
        log_warn "Ollama API test failed - check your Ollama server connection"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment option:"
    echo "1) Full deployment (Worker + Pages)"
    echo "2) Deploy Worker only"
    echo "3) Deploy Pages only"
    echo "4) Build only"
    echo "5) Test deployment"
    echo "6) Exit"
    echo ""
}

# Main execution
main() {
    check_requirements
    
    while true; do
        show_menu
        read -p "Enter your choice [1-6]: " choice
        
        case $choice in
            1)
                setup_environment
                deploy_worker
                build_app
                deploy_pages
                test_deployment
                log_info "Full deployment completed! 🎉"
                break
                ;;
            2)
                setup_environment
                deploy_worker
                break
                ;;
            3)
                setup_environment
                build_app
                deploy_pages
                break
                ;;
            4)
                setup_environment
                build_app
                break
                ;;
            5)
                test_deployment
                break
                ;;
            6)
                log_info "Goodbye! 👋"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please try again."
                ;;
        esac
    done
}

# Run main function
main "$@"