import { atom, computed } from 'nanostores';
import { mcpService, type MCPServer, type MCPTool, type ToolInvocation } from '~/lib/services/mcpService';

// State atoms
export const mcpServersStore = atom<MCPServer[]>([]);
export const mcpToolsStore = atom<MCPTool[]>([]);
export const mcpInvocationsStore = atom<ToolInvocation[]>([]);
export const mcpLoadingStore = atom<boolean>(false);
export const mcpErrorStore = atom<string | null>(null);

// Computed stores
export const connectedServersStore = computed(mcpServersStore, (servers) =>
  servers.filter(server => server.status === 'connected')
);

export const availableToolsStore = computed(mcpToolsStore, (tools) =>
  tools.filter(tool => tool.status === 'available')
);

export const activeInvocationsStore = computed(mcpInvocationsStore, (invocations) =>
  invocations.filter(invocation => 
    invocation.status === 'pending' || invocation.status === 'running'
  )
);

// Actions
export async function loadMCPServers() {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const servers = mcpService.getServers();
    mcpServersStore.set(servers);
    
    // Also load tools for connected servers
    const tools = mcpService.getTools();
    mcpToolsStore.set(tools);
    
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to load MCP servers');
    console.error('Failed to load MCP servers:', error);
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function addMCPServer(server: Omit<MCPServer, 'id'>) {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const serverId = await mcpService.addServer(server);
    
    // Reload servers to get updated list
    await loadMCPServers();
    
    return serverId;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to add MCP server');
    console.error('Failed to add MCP server:', error);
    throw error;
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function removeMCPServer(serverId: string) {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const success = await mcpService.removeServer(serverId);
    
    if (success) {
      // Reload servers to get updated list
      await loadMCPServers();
    }
    
    return success;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to remove MCP server');
    console.error('Failed to remove MCP server:', error);
    throw error;
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function connectMCPServer(serverId: string) {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const success = await mcpService.connectServer(serverId);
    
    if (success) {
      // Reload servers to get updated status and tools
      await loadMCPServers();
    }
    
    return success;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to connect to MCP server');
    console.error('Failed to connect to MCP server:', error);
    throw error;
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function disconnectMCPServer(serverId: string) {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const success = await mcpService.disconnectServer(serverId);
    
    if (success) {
      // Reload servers to get updated status
      await loadMCPServers();
    }
    
    return success;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to disconnect from MCP server');
    console.error('Failed to disconnect from MCP server:', error);
    throw error;
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function invokeMCPTool(
  toolName: string, 
  arguments_: Record<string, any>, 
  serverId: string
) {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const invocationId = await mcpService.invokeTool(toolName, arguments_, serverId);
    
    // Reload invocations to get the new one
    const invocations = mcpService.getInvocations();
    mcpInvocationsStore.set(invocations);
    
    return invocationId;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to invoke MCP tool');
    console.error('Failed to invoke MCP tool:', error);
    throw error;
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function retryToolInvocation(invocationId: string) {
  try {
    mcpLoadingStore.set(true);
    mcpErrorStore.set(null);
    
    const invocation = mcpService.getInvocation(invocationId);
    if (!invocation) {
      throw new Error('Invocation not found');
    }
    
    // Create a new invocation with the same parameters
    const newInvocationId = await mcpService.invokeTool(
      invocation.toolName,
      invocation.arguments,
      invocation.serverId
    );
    
    // Reload invocations
    const invocations = mcpService.getInvocations();
    mcpInvocationsStore.set(invocations);
    
    return newInvocationId;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to retry tool invocation');
    console.error('Failed to retry tool invocation:', error);
    throw error;
  } finally {
    mcpLoadingStore.set(false);
  }
}

export async function cancelToolInvocation(invocationId: string) {
  try {
    mcpErrorStore.set(null);
    
    // For now, we'll just mark it as failed since MCP doesn't support cancellation
    // In a real implementation, you'd send a cancellation signal to the server
    const invocation = mcpService.getInvocation(invocationId);
    if (invocation && invocation.status === 'running') {
      // Update the invocation status to failed
      const invocations = mcpService.getInvocations();
      mcpInvocationsStore.set(invocations);
    }
    
    return true;
  } catch (error) {
    mcpErrorStore.set(error instanceof Error ? error.message : 'Failed to cancel tool invocation');
    console.error('Failed to cancel tool invocation:', error);
    throw error;
  }
}

export function clearMCPError() {
  mcpErrorStore.set(null);
}

// Initialize store with current data
export async function initializeMCPStore() {
  await loadMCPServers();
  
  // Load invocations
  const invocations = mcpService.getInvocations();
  mcpInvocationsStore.set(invocations);
}

// Auto-refresh connected servers status
export function startMCPStatusRefresh(intervalMs: number = 30000) {
  const interval = setInterval(async () => {
    const servers = mcpService.getServers();
    const connectedServers = servers.filter(s => s.status === 'connected');
    
    // Check health of connected servers
    for (const server of connectedServers) {
      if (server.endpoint) {
        try {
          const response = await fetch(`${server.endpoint}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          
          if (!response.ok) {
            // Server is no longer healthy, update status
            await disconnectMCPServer(server.id);
          }
        } catch (error) {
          // Server is unreachable, update status
          await disconnectMCPServer(server.id);
        }
      }
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}