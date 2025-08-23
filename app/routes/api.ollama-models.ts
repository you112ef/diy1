import type { LoaderFunction } from '@remix-run/cloudflare';

export const loader: LoaderFunction = async ({ context }) => {
  const ollamaUrl = context?.cloudflare?.env?.OLLAMA_API_BASE_URL;
  const ollamaRemoteUrl = context?.cloudflare?.env?.OLLAMA_REMOTE_URL;
  const nodeEnv = context?.cloudflare?.env?.NODE_ENV;
  
  // Determine which URL to use
  let baseUrl = '';
  if (nodeEnv === 'production' || nodeEnv === 'preview') {
    baseUrl = ollamaRemoteUrl || ollamaUrl || '';
  } else {
    baseUrl = ollamaUrl || 'http://127.0.0.1:11434';
  }
  
  if (!baseUrl) {
    return Response.json({ 
      status: 'error', 
      message: 'Ollama URL not configured',
      environment: nodeEnv || 'unknown',
      models: []
    });
  }

  try {
    // Add timeout for production environments
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return Response.json({ 
        status: 'success', 
        models: data.models || [],
        url: baseUrl,
        environment: nodeEnv || 'unknown',
        timestamp: new Date().toISOString(),
        totalModels: data.models?.length || 0
      });
    } else {
      return Response.json({ 
        status: 'error', 
        error: `HTTP ${response.status} ${response.statusText}`,
        url: baseUrl,
        environment: nodeEnv || 'unknown',
        timestamp: new Date().toISOString(),
        models: []
      });
    }
  } catch (error) {
    return Response.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      url: baseUrl,
      environment: nodeEnv || 'unknown',
      timestamp: new Date().toISOString(),
      models: []
    });
  }
};