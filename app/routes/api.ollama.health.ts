import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const ollamaUrl = url.searchParams.get('url') || 'http://127.0.0.1:11434';

    console.log(`🔍 Checking Ollama health at: ${ollamaUrl}`);

    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = (await response.json()) as { models?: Array<{ name: string }> };

      return json({
        status: 'healthy',
        connected: true,
        models: data.models?.length || 0,
        url: ollamaUrl,
        timestamp: new Date().toISOString(),
      });
    } else {
      const errorText = await response.text();
      console.error(`❌ Ollama health check failed: ${response.status} - ${errorText}`);

      return json(
        {
          status: 'unhealthy',
          connected: false,
          models: 0,
          error: `HTTP ${response.status}: ${errorText}`,
          url: ollamaUrl,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Ollama health check error: ${errorMessage}`);

    return json(
      {
        status: 'error',
        connected: false,
        models: 0,
        error: errorMessage,
        url: 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
