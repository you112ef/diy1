/**
 * Cloudflare Worker to proxy requests to local Ollama server
 * This worker handles CORS and forwards requests to your local Ollama instance
 */

// Configuration - Update this with your Ollama server details
const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
};

// Handle preflight requests
function handleOptions() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Forward request to Ollama server
async function forwardToOllama(request) {
  try {
    const url = new URL(request.url);
    const ollamaUrl = `${OLLAMA_BASE_URL}${url.pathname}${url.search}`;
    
    console.log(`Forwarding ${request.method} request to: ${ollamaUrl}`);
    
    // Clone the request headers and remove host header
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('cf-connecting-ip');
    
    // Create the proxied request
    const proxiedRequest = new Request(ollamaUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });
    
    // Forward the request to Ollama
    const response = await fetch(proxiedRequest);
    
    // Clone the response to modify headers
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders,
      },
    });
    
    return modifiedResponse;
    
  } catch (error) {
    console.error('Error forwarding request to Ollama:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to connect to Ollama server',
        message: error.message,
        details: 'Make sure your Ollama server is running and accessible',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// Health check endpoint
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Ollama proxy worker is running',
      timestamp: new Date().toISOString(),
      ollama_target: OLLAMA_BASE_URL,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

// Main handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return handleHealthCheck();
    }
    
    // Forward all other requests to Ollama
    if (url.pathname.startsWith('/api/')) {
      return forwardToOllama(request);
    }
    
    // Return 404 for unknown paths
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'This proxy only handles /api/* requests',
        available_endpoints: ['/health', '/api/*'],
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  },
};