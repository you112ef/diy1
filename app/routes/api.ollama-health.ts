import type { LoaderFunction } from '@remix-run/cloudflare';

export const loader: LoaderFunction = async ({ context }) => {
  const ollamaUrl = context?.cloudflare?.env?.OLLAMA_API_BASE_URL;
  const ollamaRemoteUrl = context?.cloudflare?.env?.OLLAMA_REMOTE_URL;
  const nodeEnv = context?.cloudflare?.env?.NODE_ENV;
  
  if (!ollamaUrl) {
    return Response.json({ 
      status: 'error', 
      message: 'Ollama URL not configured',
      environment: nodeEnv || 'unknown'
    });
  }

  try {
    // Add timeout for production environments
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return Response.json({ 
        status: 'healthy', 
        models: data.models?.length || 0,
        url: ollamaUrl,
        environment: nodeEnv || 'unknown',
        timestamp: new Date().toISOString()
      });
    } else {
      return Response.json({ 
        status: 'unhealthy', 
        error: `HTTP ${response.status} ${response.statusText}`,
        url: ollamaUrl,
        environment: nodeEnv || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    return Response.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      url: ollamaUrl,
      environment: nodeEnv || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
};