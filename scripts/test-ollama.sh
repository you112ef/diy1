#!/bin/bash

# Enhanced Ollama Test Script
# Tests Ollama installation, models, and API endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is open
check_port() {
    local host=$1
    local port=$2
    if command_exists nc; then
        nc -z "$host" "$port" 2>/dev/null
    elif command_exists telnet; then
        timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null
    else
        # Fallback: try to connect with curl
        curl -s --connect-timeout 5 "$host:$port" >/dev/null 2>&1
    fi
}

# Function to test Ollama service
test_ollama_service() {
    print_header "Testing Ollama Service"
    
    local base_url=${1:-"http://127.0.0.1:11434"}
    
    print_status "Testing Ollama service at: $base_url"
    
    # Test basic connectivity
    if check_port "127.0.0.1" "11434"; then
        print_success "Port 11434 is open"
    else
        print_error "Port 11434 is closed. Ollama may not be running."
        return 1
    fi
    
    # Test API health
    print_status "Testing API health..."
    if curl -s --connect-timeout 10 "$base_url/api/tags" >/dev/null 2>&1; then
        print_success "API endpoint is accessible"
    else
        print_error "API endpoint is not accessible"
        return 1
    fi
    
    # Test models endpoint
    print_status "Testing models endpoint..."
    local models_response=$(curl -s --connect-timeout 10 "$base_url/api/tags" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$models_response" ]; then
        local model_count=$(echo "$models_response" | jq '.models | length' 2>/dev/null || echo "0")
        print_success "Models endpoint working. Found $model_count models."
        
        # Show model names
        if command_exists jq; then
            echo "$models_response" | jq -r '.models[].name' 2>/dev/null | head -10
            if [ "$model_count" -gt 10 ]; then
                print_status "... and $((model_count - 10)) more models"
            fi
        fi
    else
        print_error "Failed to fetch models"
        return 1
    fi
    
    return 0
}

# Function to test Ollama CLI
test_ollama_cli() {
    print_header "Testing Ollama CLI"
    
    if ! command_exists ollama; then
        print_error "Ollama CLI not found. Please install Ollama first."
        return 1
    fi
    
    print_success "Ollama CLI found: $(ollama --version)"
    
    # Test basic commands
    print_status "Testing 'ollama list' command..."
    if ollama list >/dev/null 2>&1; then
        print_success "ollama list command working"
        local installed_models=$(ollama list 2>/dev/null | wc -l)
        print_status "Installed models: $((installed_models - 1))" # Subtract header line
    else
        print_error "ollama list command failed"
        return 1
    fi
    
    # Test model info
    print_status "Testing model info..."
    local first_model=$(ollama list 2>/dev/null | tail -n +2 | head -1 | awk '{print $1}')
    if [ -n "$first_model" ]; then
        print_status "Testing info for model: $first_model"
        if ollama show "$first_model" >/dev/null 2>&1; then
            print_success "Model info command working"
        else
            print_warning "Model info command failed for $first_model"
        fi
    fi
    
    return 0
}

# Function to test model generation
test_model_generation() {
    print_header "Testing Model Generation"
    
    local base_url=${1:-"http://127.0.0.1:11434"}
    
    # Find a suitable model for testing
    local test_model=""
    local models_response=$(curl -s --connect-timeout 10 "$base_url/api/tags" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$models_response" ]; then
        # Try to find a small model first
        test_model=$(echo "$models_response" | jq -r '.models[] | select(.name | contains("7b") or contains("3b")) | .name' 2>/dev/null | head -1)
        
        if [ -z "$test_model" ]; then
            # Fallback to any available model
            test_model=$(echo "$models_response" | jq -r '.models[0].name' 2>/dev/null)
        fi
    fi
    
    if [ -z "$test_model" ]; then
        print_warning "No models available for testing generation"
        return 0
    fi
    
    print_status "Testing generation with model: $test_model"
    
    # Test simple generation
    local test_prompt="Hello, how are you?"
    local generation_response=$(curl -s --connect-timeout 30 \
        -X POST "$base_url/api/generate" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$test_model\",
            \"prompt\": \"$test_prompt\",
            \"stream\": false,
            \"options\": {
                \"num_predict\": 10
            }
        }" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$generation_response" ]; then
        local response_text=$(echo "$generation_response" | jq -r '.response' 2>/dev/null)
        if [ -n "$response_text" ] && [ "$response_text" != "null" ]; then
            print_success "Model generation working"
            print_status "Response preview: ${response_text:0:100}..."
        else
            print_warning "Model generation returned empty response"
        fi
    else
        print_warning "Model generation test failed or timed out"
    fi
    
    return 0
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    print_header "Running Comprehensive Ollama Tests"
    
    local base_url=${1:-"http://127.0.0.1:11434"}
    local all_tests_passed=true
    
    # Test 1: Service connectivity
    print_status "Test 1: Service Connectivity"
    if test_ollama_service "$base_url"; then
        print_success "✓ Service connectivity test passed"
    else
        print_error "✗ Service connectivity test failed"
        all_tests_passed=false
    fi
    
    echo
    
    # Test 2: CLI functionality
    print_status "Test 2: CLI Functionality"
    if test_ollama_cli; then
        print_success "✓ CLI functionality test passed"
    else
        print_error "✗ CLI functionality test failed"
        all_tests_passed=false
    fi
    
    echo
    
    # Test 3: Model generation
    print_status "Test 3: Model Generation"
    if test_model_generation "$base_url"; then
        print_success "✓ Model generation test passed"
    else
        print_warning "⚠ Model generation test had issues"
    fi
    
    echo
    
    # Summary
    if [ "$all_tests_passed" = true ]; then
        print_success "🎉 All critical tests passed! Ollama is working correctly."
    else
        print_error "❌ Some tests failed. Please check the issues above."
        return 1
    fi
    
    return 0
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [BASE_URL]"
    echo ""
    echo "Options:"
    echo "  --service-only    Test only service connectivity"
    echo "  --cli-only        Test only CLI functionality"
    echo "  --generation-only Test only model generation"
    echo "  --help            Show this help message"
    echo ""
    echo "Arguments:"
    echo "  BASE_URL          Ollama base URL (default: http://127.0.0.1:11434)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests on localhost"
    echo "  $0 http://192.168.1.100:11434        # Run all tests on remote server"
    echo "  $0 --service-only                     # Test only service connectivity"
    echo "  $0 --cli-only                        # Test only CLI functionality"
}

# Main function
main() {
    local base_url="http://127.0.0.1:11434"
    local test_mode="comprehensive"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service-only)
                test_mode="service"
                shift
                ;;
            --cli-only)
                test_mode="cli"
                shift
                ;;
            --generation-only)
                test_mode="generation"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            http://*)
                base_url="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header "Ollama Test Suite"
    print_status "Testing Ollama at: $base_url"
    print_status "Test mode: $test_mode"
    echo
    
    case $test_mode in
        "service")
            test_ollama_service "$base_url"
            ;;
        "cli")
            test_ollama_cli
            ;;
        "generation")
            test_model_generation "$base_url"
            ;;
        "comprehensive")
            run_comprehensive_tests "$base_url"
            ;;
    esac
}

# Run main function with all arguments
main "$@"