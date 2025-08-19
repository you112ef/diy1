import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';

export async function action({ request, params: _params, context: _context }: ActionFunctionArgs) {
  try {
    const url = new URL(request.url);
    const ollamaUrl = url.searchParams.get('url') || 'http://127.0.0.1:11434';
    const path = url.searchParams.get('path') || '/api/generate';

    console.log(`🔄 Proxying request to: ${ollamaUrl}${path}`);

    // Get the request body
    const body = await request.text();

    // Forward the request to Ollama
    const response = await fetch(`${ollamaUrl}${path}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: body || undefined,
    });

    if (response.ok) {
      const data = await response.json();
      return json(data);
    } else {
      const errorText = await response.text();
      console.error(`❌ Ollama proxy error: ${response.status} - ${errorText}`);

      return json(
        {
          error: `HTTP ${response.status}: ${errorText}`,
          status: 'error',
        },
        { status: response.status },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Ollama proxy error: ${errorMessage}`);

    return json(
      {
        error: errorMessage,
        status: 'error',
      },
      { status: 500 },
    );
  }
}

// Handle GET requests for health checks
export async function loader({ request, params: _params, context: _context }: ActionFunctionArgs) {
  return action({ request, params: _params, context: _context });
}
