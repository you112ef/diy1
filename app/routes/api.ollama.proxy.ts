import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

/**
 * Ollama Proxy API
 * يعمل كوسيط بين Cloudflare Pages و Ollama server
 */

async function forwardToOllama(request: Request) {
  try {
    const { method, url, headers, body } = request;

    // Get Ollama server URL from environment or use default
    const ollamaUrl = process.env.OLLAMA_API_BASE_URL || 'http://127.0.0.1:11434';

    // Parse the request path to forward to Ollama
    const urlObj = new URL(url);
    const ollamaPath = urlObj.pathname.replace('/api/ollama/proxy', '');
    const targetUrl = `${ollamaUrl}${ollamaPath}`;

    // Forward the request to Ollama
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',

        // Remove Cloudflare-specific headers
        ...Object.fromEntries(
          Array.from(headers.entries()).filter(
            ([key]) => !key.startsWith('cf-') && !key.startsWith('x-forwarded-') && key !== 'host',
          ),
        ),
      },
      body: method !== 'GET' ? body : undefined,
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return json(data);
  } catch (error) {
    console.error('Ollama proxy error:', error);
    return json(
      {
        error: 'Failed to connect to Ollama server',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  return forwardToOllama(request);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return forwardToOllama(request);
}
