/**
 * Cloudflare Pages Functions Worker
 * This file handles edge-side logic for Bolt.diy
 */

export default {
  // Handle requests
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Add security headers
    const response = await env.ASSETS.fetch(request);
    const newResponse = new Response(response.body, response);
    
    // Security headers
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // CORS for API routes
    if (url.pathname.startsWith('/api/')) {
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    // Cache static assets
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/build/')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    return newResponse;
  }
};