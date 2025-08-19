import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

/**
 * Ollama Health Check API
 * للتحقق من حالة Ollama server
 */

export async function loader({}: LoaderFunctionArgs) {
  try {
    const ollamaUrl = process.env.OLLAMA_API_BASE_URL || 'http://127.0.0.1:11434';

    // Check if Ollama is running
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data: unknown = await response.json();
      const modelsCount =
        data && typeof data === 'object' && Array.isArray((data as any).models) ? (data as any).models.length : 0;

      return json({
        status: 'healthy',
        ollamaUrl,
        models: modelsCount,
        timestamp: new Date().toISOString(),
      });
    } else {
      return json(
        {
          status: 'unhealthy',
          ollamaUrl,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }
  } catch (error) {
    return json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
