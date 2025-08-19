// Cloudflare Pages Functions entry point
// This handles the crypto module issue

import { createRequestHandler } from '@remix-run/cloudflare';

// Import build dynamically to avoid crypto issues
let build;
let requestHandler;

// Initialize handler lazily
async function getRequestHandler() {
  if (!requestHandler) {
    if (!build) {
      build = await import('../build/server/index.js');
    }
    requestHandler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV,
      getLoadContext: (context) => context.env,
    });
  }
  return requestHandler;
}

export default {
  async fetch(request, env, ctx) {
    const handler = await getRequestHandler();
    return handler(request, env, ctx);
  },
};