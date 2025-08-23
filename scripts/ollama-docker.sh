#!/bin/bash

# Ollama Docker Setup Script for Bolt.diy
# This script helps set up Ollama using Docker

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

# Function to check Docker
check_docker() {
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is available and running"
}

# Function to check Docker Compose
check_docker_compose() {
    if ! command_exists docker-compose && ! docker compose version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Function to create Ollama Docker Compose file
create_ollama_compose() {
    local compose_file="docker-compose.ollama.yaml"
    
    if [ -f "$compose_file" ]; then
        print_status "Ollama Docker Compose file already exists"
    else
        print_status "Creating Ollama Docker Compose file..."
        
        cat > "$compose_file" << 'EOF'
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: bolt-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
      - /var/lib/ollama:/var/lib/ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
    networks:
      - bolt-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  ollama_data:
    driver: local

networks:
  bolt-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF
        
        print_success "Created $compose_file"
    fi
}

# Function to start Ollama with Docker
start_ollama_docker() {
    print_status "Starting Ollama with Docker..."
    
    local compose_file="docker-compose.ollama.yaml"
    
    if [ ! -f "$compose_file" ]; then
        print_error "Ollama Docker Compose file not found. Run --create first."
        exit 1
    fi
    
    # Stop existing containers
    docker-compose -f "$compose_file" down 2>/dev/null || true
    
    # Start Ollama
    docker-compose -f "$compose_file" up -d ollama
    
    print_success "Ollama started with Docker"
}

# Function to wait for Ollama to be ready
wait_for_ollama() {
    print_status "Waiting for Ollama to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            print_success "Ollama is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Waiting for Ollama..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Ollama failed to start within expected time."
    return 1
}

# Function to install popular models
install_popular_models() {
    print_status "Installing popular models..."
    
    local models=(
        "llama2:7b"
        "llama2:13b"
        "codellama:7b"
        "codellama:13b"
        "mistral:7b"
        "qwen2.5:7b"
        "qwen2.5:14b"
        "deepseek-coder:6.7b"
        "deepseek-coder:33b"
        "neural-chat:7b"
        "orca-mini:3b"
        "phi3:3.8b"
        "phi3:14b"
        "gemma2:2b"
        "gemma2:7b"
        "llama3.1:8b"
        "llama3.1:70b"
    )
    
    for model in "${models[@]}"; do
        print_status "Installing $model..."
        if docker exec bolt-ollama ollama pull "$model"; then
            print_success "$model installed successfully!"
        else
            print_warning "Failed to install $model, continuing..."
        fi
    done
}

# Function to setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    local env_file=".env.local"
    local ollama_url="http://127.0.0.1:11434"
    
    if [ -f "$env_file" ]; then
        # Check if OLLAMA_API_BASE_URL already exists
        if grep -q "OLLAMA_API_BASE_URL" "$env_file"; then
            print_status "OLLAMA_API_BASE_URL already exists in $env_file"
        else
            echo "OLLAMA_API_BASE_URL=$ollama_url" >> "$env_file"
            print_success "Added OLLAMA_API_BASE_URL to $env_file"
        fi
    else
        # Create .env.local if it doesn't exist
        echo "OLLAMA_API_BASE_URL=$ollama_url" > "$env_file"
        print_success "Created $env_file with OLLAMA_API_BASE_URL"
    fi
    
    # Also add to .env.example if not present
    if [ -f ".env.example" ] && ! grep -q "OLLAMA_API_BASE_URL" ".env.example"; then
        echo "OLLAMA_API_BASE_URL=$ollama_url" >> ".env.example"
        print_success "Added OLLAMA_API_BASE_URL to .env.example"
    fi
}

# Function to test Ollama
test_ollama() {
    print_status "Testing Ollama installation..."
    
    # Test basic API
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama API is responding"
    else
        print_error "Ollama API is not responding"
        return 1
    fi
    
    # Test model list
    local model_count=$(curl -s http://localhost:11434/api/tags | jq '.models | length' 2>/dev/null || echo "0")
    print_status "Found $model_count installed models"
    
    # Test simple inference if models are available
    if [ "$model_count" -gt 0 ]; then
        local first_model=$(curl -s http://localhost:11434/api/tags | jq -r '.models[0].name' 2>/dev/null)
        if [ "$first_model" != "null" ] && [ -n "$first_model" ]; then
            print_status "Testing inference with $first_model..."
            local response=$(curl -s -X POST http://localhost:11434/api/generate \
                -H "Content-Type: application/json" \
                -d "{\"model\": \"$first_model\", \"prompt\": \"Hello, how are you?\", \"stream\": false}")
            
            if echo "$response" | jq -e '.response' > /dev/null 2>&1; then
                print_success "Inference test successful!"
            else
                print_warning "Inference test failed, but API is working"
            fi
        fi
    fi
}

# Function to show Ollama status
show_status() {
    print_status "Ollama Status:"
    
    # Check if container is running
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "bolt-ollama"; then
        print_success "Ollama container is running"
        
        # Show container info
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep "bolt-ollama"
        
        # Show logs
        print_status "Recent logs:"
        docker logs --tail 10 bolt-ollama
    else
        print_error "Ollama container is not running"
    fi
    
    # Check API status
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama API is responding"
        
        # Show models
        local model_count=$(curl -s http://localhost:11434/api/tags | jq '.models | length' 2>/dev/null || echo "0")
        print_status "Installed models: $model_count"
        
        if [ "$model_count" -gt 0 ]; then
            print_status "Model list:"
            curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "Failed to get model list"
        fi
    else
        print_error "Ollama API is not responding"
    fi
}

# Function to stop Ollama
stop_ollama() {
    print_status "Stopping Ollama..."
    
    local compose_file="docker-compose.ollama.yaml"
    
    if [ -f "$compose_file" ]; then
        docker-compose -f "$compose_file" down
        print_success "Ollama stopped"
    else
        print_warning "Ollama Docker Compose file not found"
    fi
}

# Function to clean up Ollama
cleanup_ollama() {
    print_status "Cleaning up Ollama..."
    
    local compose_file="docker-compose.ollama.yaml"
    
    if [ -f "$compose_file" ]; then
        docker-compose -f "$compose_file" down -v
        print_success "Ollama stopped and volumes removed"
    else
        print_warning "Ollama Docker Compose file not found"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --create      Create Ollama Docker Compose file"
    echo "  -s, --start       Start Ollama with Docker"
    echo "  -m, --models      Install popular models"
    echo "  -e, --env         Setup environment variables"
    echo "  -t, --test        Test Ollama installation"
    echo "  -a, --all         Full setup (create, start, models, env, test)"
    echo "  -u, --status      Show Ollama status"
    echo "  -x, --stop        Stop Ollama"
    echo "  -r, --cleanup     Stop and cleanup Ollama"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all          # Complete setup"
    echo "  $0 --create       # Create compose file only"
    echo "  $0 --start        # Start service only"
    echo "  $0 --status       # Show status"
}

# Main function
main() {
    print_status "Bolt.diy Ollama Docker Setup Script"
    print_status "===================================="
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Check if jq is available
    if ! command_exists jq; then
        print_warning "jq is not installed. Some features may not work properly."
        print_status "Install jq: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    fi
    
    # Parse command line arguments
    local create_flag=false
    local start_flag=false
    local models_flag=false
    local env_flag=false
    local test_flag=false
    local all_flag=false
    local status_flag=false
    local stop_flag=false
    local cleanup_flag=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--create)
                create_flag=true
                shift
                ;;
            -s|--start)
                start_flag=true
                shift
                ;;
            -m|--models)
                models_flag=true
                shift
                ;;
            -e|--env)
                env_flag=true
                shift
                ;;
            -t|--test)
                test_flag=true
                shift
                ;;
            -a|--all)
                all_flag=true
                shift
                ;;
            -u|--status)
                status_flag=true
                shift
                ;;
            -x|--stop)
                stop_flag=true
                shift
                ;;
            -r|--cleanup)
                cleanup_flag=true
                shift
                ;;
            -h|--help)
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
    
    # If no flags specified, show usage
    if [ "$all_flag" = false ] && [ "$create_flag" = false ] && [ "$start_flag" = false ] && [ "$models_flag" = false ] && [ "$env_flag" = false ] && [ "$test_flag" = false ] && [ "$status_flag" = false ] && [ "$stop_flag" = false ] && [ "$cleanup_flag" = false ]; then
        show_usage
        exit 0
    fi
    
    # Execute requested actions
    if [ "$all_flag" = true ] || [ "$create_flag" = true ]; then
        create_ollama_compose
    fi
    
    if [ "$all_flag" = true ] || [ "$start_flag" = true ]; then
        start_ollama_docker
        wait_for_ollama
    fi
    
    if [ "$all_flag" = true ] || [ "$models_flag" = true ]; then
        install_popular_models
    fi
    
    if [ "$all_flag" = true ] || [ "$env_flag" = true ]; then
        setup_environment
    fi
    
    if [ "$all_flag" = true ] || [ "$test_flag" = true ]; then
        test_ollama
    fi
    
    if [ "$status_flag" = true ]; then
        show_status
    fi
    
    if [ "$stop_flag" = true ]; then
        stop_ollama
    fi
    
    if [ "$cleanup_flag" = true ]; then
        cleanup_ollama
    fi
    
    if [ "$all_flag" = true ]; then
        print_success "Setup completed successfully!"
        print_status "You can now use Ollama with Bolt.diy!"
        print_status "Visit: http://localhost:5173"
    fi
}

# Run main function with all arguments
main "$@"