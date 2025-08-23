#!/bin/bash

# Simple Ollama Installer for Bolt.diy
# This script provides a quick way to install Ollama

set -e

echo "🚀 Installing Ollama for Bolt.diy..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Linux detected, installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Start service
    sudo systemctl start ollama
    sudo systemctl enable ollama
    echo "✅ Ollama installed and started on Linux"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected, installing Ollama..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install ollama
    brew services start ollama
    echo "✅ Ollama installed and started on macOS"
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please visit: https://ollama.ai/download"
    exit 1
fi

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

# Install a test model
echo "📥 Installing test model (llama2:7b)..."
ollama pull llama2:7b

# Test the installation
echo "🧪 Testing Ollama..."
if ollama run llama2:7b "Hello, test" > /dev/null 2>&1; then
    echo "✅ Ollama test successful!"
else
    echo "⚠️  Ollama test failed, but installation may still be working"
fi

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f ".env.local" ]; then
    echo "OLLAMA_API_BASE_URL=http://127.0.0.1:11434" > .env.local
    echo "✅ Created .env.local"
else
    if ! grep -q "OLLAMA_API_BASE_URL" .env.local; then
        echo "OLLAMA_API_BASE_URL=http://127.0.0.1:11434" >> .env.local
        echo "✅ Added OLLAMA_API_BASE_URL to .env.local"
    else
        echo "ℹ️  OLLAMA_API_BASE_URL already exists in .env.local"
    fi
fi

echo ""
echo "🎉 Ollama installation completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Start Bolt.diy: pnpm run dev"
echo "   2. Go to Settings > Local Providers > Ollama"
echo "   3. Verify Ollama is detected and models are available"
echo ""
echo "🔗 Useful commands:"
echo "   ollama list                    # List installed models"
echo "   ollama pull codellama:7b      # Install code model"
echo "   ollama run llama2:7b          # Test model"
echo ""
echo "📚 For more information, see: OLLAMA_SETUP.md"