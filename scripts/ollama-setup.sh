#!/bin/bash

# Ollama Setup Script for Bolt.diy
# This script helps set up Ollama for local development

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

# Function to check OS
get_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*)   echo "windows";;
        MINGW*)    echo "windows";;
        *)         echo "unknown";;
    esac
}

# Function to check architecture
get_arch() {
    case "$(uname -m)" in
        x86_64)    echo "amd64";;
        aarch64)   echo "arm64";;
        armv7l)    echo "armv7";;
        *)         echo "unknown";;
    esac
}

# Function to install Ollama
install_ollama() {
    local os=$(get_os)
    local arch=$(get_arch)
    
    print_status "Installing Ollama for $os-$arch..."
    
    case $os in
        "linux")
            if command_exists curl; then
                curl -fsSL https://ollama.ai/install.sh | sh
            else
                print_error "curl is required but not installed. Please install curl first."
                exit 1
            fi
            ;;
        "macos")
            if command_exists brew; then
                brew install ollama
            else
                print_error "Homebrew is required but not installed. Please install Homebrew first."
                exit 1
            fi
            ;;
        "windows")
            print_warning "Windows installation requires manual setup."
            print_status "Please visit: https://ollama.ai/download/windows"
            print_status "Or use WSL2 with Linux installation."
            return 1
            ;;
        *)
            print_error "Unsupported operating system: $os"
            exit 1
            ;;
    esac
    
    print_success "Ollama installed successfully!"
}

# Function to start Ollama service
start_ollama() {
    print_status "Starting Ollama service..."
    
    if command_exists systemctl; then
        # Linux with systemd
        sudo systemctl start ollama
        sudo systemctl enable ollama
        print_success "Ollama service started and enabled!"
    elif command_exists brew; then
        # macOS with Homebrew
        brew services start ollama
        print_success "Ollama service started!"
    else
        # Manual start
        print_warning "Starting Ollama manually..."
        nohup ollama serve > /dev/null 2>&1 &
        print_success "Ollama started in background!"
    fi
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
        if ollama pull "$model"; then
            print_success "$model installed successfully!"
        else
            print_warning "Failed to install $model, continuing..."
        fi
    done
}

# Function to check system requirements
check_system_requirements() {
    print_status "Checking system requirements..."
    
    # Check available memory
    local total_mem=$(free -m 2>/dev/null | awk 'NR==2{printf "%.0f", $2/1024}' || echo "0")
    if [ "$total_mem" -lt 8 ]; then
        print_warning "Low memory detected: ${total_mem}GB. Ollama requires at least 8GB RAM for optimal performance."
    else
        print_success "Memory: ${total_mem}GB (sufficient)"
    fi
    
    # Check available disk space
    local available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$available_space" -lt 20 ]; then
        print_warning "Low disk space: ${available_space}GB. Ollama models require significant disk space."
    else
        print_success "Disk space: ${available_space}GB (sufficient)"
    fi
    
    # Check if Docker is available
    if command_exists docker; then
        print_success "Docker is available"
    else
        print_warning "Docker not found. Consider installing Docker for containerized setup."
    fi
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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i, --install     Install Ollama"
    echo "  -s, --start       Start Ollama service"
    echo "  -m, --models      Install popular models"
    echo "  -e, --env         Setup environment variables"
    echo "  -t, --test        Test Ollama installation"
    echo "  -a, --all         Full setup (install, start, models, env, test)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all          # Complete setup"
    echo "  $0 --install      # Install only"
    echo "  $0 --start        # Start service only"
}

# Main function
main() {
    print_status "Bolt.diy Ollama Setup Script"
    print_status "============================="
    
    # Check if jq is available
    if ! command_exists jq; then
        print_warning "jq is not installed. Some features may not work properly."
        print_status "Install jq: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    fi
    
    # Parse command line arguments
    local install_flag=false
    local start_flag=false
    local models_flag=false
    local env_flag=false
    local test_flag=false
    local all_flag=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--install)
                install_flag=true
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
    if [ "$all_flag" = false ] && [ "$install_flag" = false ] && [ "$start_flag" = false ] && [ "$models_flag" = false ] && [ "$env_flag" = false ] && [ "$test_flag" = false ]; then
        show_usage
        exit 0
    fi
    
    # Check system requirements
    check_system_requirements
    
    # Execute requested actions
    if [ "$all_flag" = true ] || [ "$install_flag" = true ]; then
        install_ollama
    fi
    
    if [ "$all_flag" = true ] || [ "$start_flag" = true ]; then
        start_ollama
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
    
    print_success "Setup completed successfully!"
    print_status "You can now use Ollama with Bolt.diy!"
    print_status "Visit: http://localhost:5173"
}

# Run main function with all arguments
main "$@"