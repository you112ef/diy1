import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { mcpService } from '~/lib/services/mcpService';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { action, serverId, serverData } = (await request.json()) as {
      action: string;
      serverId?: string;
      serverData?: any;
    };

    if (!action) {
      return json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'add_server':
        if (!serverData) {
          return json({ error: 'Server data is required' }, { status: 400 });
        }

        const { name, description, endpoint, capabilities, config } = serverData;

        if (!name || !endpoint) {
          return json({ error: 'Server name and endpoint are required' }, { status: 400 });
        }

        const newServerId = await mcpService.addServer({
          name,
          description,
          endpoint,
          capabilities: capabilities || [],
          config: config || {},
          status: 'disconnected',
        });

        return json({
          status: 'success',
          message: 'Server added successfully',
          data: { serverId: newServerId },
        });

      case 'remove_server':
        if (!serverId) {
          return json({ error: 'Server ID is required' }, { status: 400 });
        }

        const removed = await mcpService.removeServer(serverId);

        if (!removed) {
          return json({ error: 'Server not found' }, { status: 404 });
        }

        return json({
          status: 'success',
          message: 'Server removed successfully',
        });

      case 'connect_server':
        if (!serverId) {
          return json({ error: 'Server ID is required' }, { status: 400 });
        }

        const connected = await mcpService.connectServer(serverId);

        if (!connected) {
          return json({ error: 'Failed to connect to server' }, { status: 500 });
        }

        return json({
          status: 'success',
          message: 'Server connected successfully',
        });

      case 'disconnect_server':
        if (!serverId) {
          return json({ error: 'Server ID is required' }, { status: 400 });
        }

        const disconnected = await mcpService.disconnectServer(serverId);

        if (!disconnected) {
          return json({ error: 'Failed to disconnect from server' }, { status: 500 });
        }

        return json({
          status: 'success',
          message: 'Server disconnected successfully',
        });

      case 'update_server':
        if (!serverId || !serverData) {
          return json({ error: 'Server ID and data are required' }, { status: 400 });
        }

        const server = mcpService.getServer(serverId);

        if (!server) {
          return json({ error: 'Server not found' }, { status: 404 });
        }

        // Update server properties
        const updatedServer = { ...server, ...serverData };

        // Remove old server and add updated one
        await mcpService.removeServer(serverId);

        const updatedServerId = await mcpService.addServer({
          name: updatedServer.name,
          description: updatedServer.description,
          endpoint: updatedServer.endpoint,
          capabilities: updatedServer.capabilities,
          config: updatedServer.config,
          status: updatedServer.status,
        });

        return json({
          status: 'success',
          message: 'Server updated successfully',
          data: { serverId: updatedServerId },
        });

      case 'get_servers':
        const servers = mcpService.getServers();
        return json({
          status: 'success',
          data: { servers },
        });

      case 'get_tools':
        const tools = mcpService.getTools();
        return json({
          status: 'success',
          data: { tools },
        });

      case 'get_invocations':
        const invocations = mcpService.getInvocations();
        return json({
          status: 'success',
          data: { invocations },
        });

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MCP config update failed:', error);

    return json(
      {
        status: 'error',
        message: 'Failed to update MCP configuration',
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
