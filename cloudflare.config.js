/**
 * Cloudflare Pages Configuration for Bolt.diy
 * This file contains specific settings for deploying to Cloudflare Pages
 */

export default {
  // Build configuration
  build: {
    command: 'npm install pnpm && pnpm install && pnpm run build',
    output: 'build/client',
    environment: {
      NODE_ENV: 'production',
      NODE_VERSION: '18'
    }
  },

  // Runtime configuration
  runtime: {
    compatibility_date: '2024-09-02',
    compatibility_flags: ['nodejs_compat']
  },

  // Environment variables (these should be set in Cloudflare dashboard)
  env: {
    production: {
      // AI Service API Keys
      OPENAI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      GOOGLE_API_KEY: '',
      COHERE_API_KEY: '',
      DEEPSEEK_API_KEY: '',
      MISTRAL_API_KEY: '',
      AMAZON_BEDROCK_ACCESS_KEY_ID: '',
      AMAZON_BEDROCK_SECRET_ACCESS_KEY: '',
      AMAZON_BEDROCK_REGION: 'us-east-1',
      OPENROUTER_API_KEY: '',
      
      // Integration APIs
      OLLAMA_API_BASE_URL: '',
      GITHUB_TOKEN: '',
      HUGGINGFACE_API_KEY: '',
      
      // Database (optional)
      DATABASE_URL: ''
    }
  },

  // Routes configuration
  routes: [
    {
      pattern: '/api/*',
      destination: '/api/*'
    },
    {
      pattern: '/*',
      destination: '/index.html'
    }
  ],

  // Headers for security and performance
  headers: {
    '/*': {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    },
    '/api/*': {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    '/assets/*': {
      'Cache-Control': 'public, max-age=31536000, immutable'
    },
    '/build/*': {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },

  // Functions configuration (if using Cloudflare Functions)
  functions: {
    directory: 'functions',
    main: 'index.js'
  },

  // Site configuration
  site: {
    bucket: './build/client',
    entry_point: './build/server/index.js'
  }
};