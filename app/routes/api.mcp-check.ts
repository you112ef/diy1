import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { mcpService } from '~/lib/services/mcpService';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { serverId, endpoint } = (await request.json()) as { serverId?: string; endpoint: string };

    if (!endpoint) {
      return json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Check server health
    const healthResponse = await fetch(`${endpoint}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!healthResponse.ok) {
      return json({
        status: 'error',
        message: `Server health check failed: ${healthResponse.status} ${healthResponse.statusText}`,
        details: {
          status: healthResponse.status,
          statusText: healthResponse.statusText,
        },
      });
    }

    // Check if server supports MCP
    let mcpSupported = false;
    let tools: any[] = [];
    let capabilities: string[] = [];

    try {
      const toolsResponse = await fetch(`${endpoint}/tools`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        mcpSupported = true;
        tools = (toolsData as any).tools || [];
        capabilities = (toolsData as any).capabilities || [];
      }
    } catch (error) {
      // Tools endpoint not available, but server is reachable
      console.log('Tools endpoint not available:', error);
    }

    // Check server info
    let serverInfo: any = {};

    try {
      const infoResponse = await fetch(`${endpoint}/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (infoResponse.ok) {
        serverInfo = await infoResponse.json();
      }
    } catch (error) {
      // Info endpoint not available
      console.log('Info endpoint not available:', error);
    }

    return json({
      status: 'success',
      message: 'Server is reachable and healthy',
      data: {
        endpoint,
        mcpSupported,
        tools: tools.length,
        capabilities,
        serverInfo,
        health: {
          status: healthResponse.status,
          statusText: healthResponse.statusText,
        },
      },
    });
  } catch (error) {
    console.error('MCP check failed:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return json(
        {
          status: 'error',
          message: 'Server check timed out',
          details: {
            error: 'Request timeout',
            timeout: '10 seconds',
          },
        },
        { status: 408 },
      );
    }

    return json(
      {
        status: 'error',
        message: 'Failed to check server',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    );
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
