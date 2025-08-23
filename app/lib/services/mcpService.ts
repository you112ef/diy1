import type { Message } from '~/types/chat';
import type { DataStream } from '~/types/stream';

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  provider: string;
  status: 'available' | 'unavailable' | 'error';
  capabilities: string[];
}

export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastSeen?: string;
  capabilities: string[];
  endpoint?: string;
  config?: Record<string, any>;
}

export interface ToolInvocation {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  serverId: string;
}

class MCPService {
  private servers: Map<string, MCPServer> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private invocations: Map<string, ToolInvocation> = new Map();
  private connections: Map<string, any> = new Map();

  constructor() {
    this.loadServersFromStorage();
    this.loadToolsFromStorage();
  }

  // Server Management
  async addServer(server: Omit<MCPServer, 'id'>): Promise<string> {
    const id = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newServer: MCPServer = { ...server, id };
    
    this.servers.set(id, newServer);
    this.saveServersToStorage();
    
    return id;
  }

  async removeServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;

    // Disconnect if connected
    if (server.status === 'connected') {
      await this.disconnectServer(serverId);
    }

    this.servers.delete(serverId);
    this.saveServersToStorage();
    
    // Remove associated tools
    for (const [toolId, tool] of this.tools.entries()) {
      if (tool.provider === server.name) {
        this.tools.delete(toolId);
      }
    }
    this.saveToolsToStorage();
    
    return true;
  }

  async connectServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;

    try {
      this.servers.set(serverId, { ...server, status: 'connecting' });
      
      // Simulate connection attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if server is reachable
      if (server.endpoint) {
        const response = await fetch(`${server.endpoint}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error(`Server health check failed: ${response.status}`);
        }
      }

      this.servers.set(serverId, { 
        ...server, 
        status: 'connected',
        lastSeen: new Date().toISOString()
      });
      
      // Discover tools from server
      await this.discoverTools(serverId);
      
      this.saveServersToStorage();
      return true;
    } catch (error) {
      this.servers.set(serverId, { ...server, status: 'error' });
      this.saveServersToStorage();
      console.error(`Failed to connect to MCP server ${serverId}:`, error);
      return false;
    }
  }

  async disconnectServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;

    try {
      // Close connection if exists
      const connection = this.connections.get(serverId);
      if (connection) {
        connection.close();
        this.connections.delete(serverId);
      }

      this.servers.set(serverId, { ...server, status: 'disconnected' });
      this.saveServersToStorage();
      
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from MCP server ${serverId}:`, error);
      return false;
    }
  }

  // Tool Management
  private async discoverTools(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server || !server.endpoint) return;

    try {
      const response = await fetch(`${server.endpoint}/tools`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const toolsData = await response.json();
        for (const toolData of toolsData.tools || []) {
          const tool: MCPTool = {
            id: `tool_${serverId}_${toolData.name}`,
            name: toolData.name,
            description: toolData.description || '',
            provider: server.name,
            status: 'available',
            capabilities: toolData.capabilities || []
          };
          this.tools.set(tool.id, tool);
        }
        this.saveToolsToStorage();
      }
    } catch (error) {
      console.error(`Failed to discover tools from server ${serverId}:`, error);
    }
  }

  // Tool Invocation
  async invokeTool(
    toolName: string, 
    arguments_: Record<string, any>, 
    serverId: string
  ): Promise<string> {
    const server = this.servers.get(serverId);
    const tool = Array.from(this.tools.values()).find(t => 
      t.name === toolName && t.provider === server?.name
    );

    if (!server || server.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`);
    }

    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverId}`);
    }

    const invocationId = `invocation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invocation: ToolInvocation = {
      id: invocationId,
      toolName,
      arguments: arguments_,
      status: 'pending',
      startTime: new Date(),
      serverId
    };

    this.invocations.set(invocationId, invocation);

    // Execute tool invocation
    this.executeToolInvocation(invocationId);

    return invocationId;
  }

  private async executeToolInvocation(invocationId: string): Promise<void> {
    const invocation = this.invocations.get(invocationId);
    if (!invocation) return;

    try {
      // Update status to running
      this.invocations.set(invocationId, { ...invocation, status: 'running' });

      const server = this.servers.get(invocation.serverId);
      if (!server?.endpoint) {
        throw new Error('Server endpoint not available');
      }

      // Execute tool via MCP protocol
      const response = await fetch(`${server.endpoint}/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: invocation.toolName,
          arguments: invocation.arguments
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Tool invocation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update invocation with result
      this.invocations.set(invocationId, {
        ...invocation,
        status: 'completed',
        result: result.result || result,
        endTime: new Date()
      });

    } catch (error) {
      // Update invocation with error
      this.invocations.set(invocationId, {
        ...invocation,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        endTime: new Date()
      });
    }
  }

  // Message Processing
  async processToolInvocations(messages: Message[], dataStream: DataStream): Promise<Message[]> {
    const processedMessages = [...messages];
    
    for (const message of messages) {
      if (message.role === 'assistant' && message.content) {
        const toolCalls = this.extractToolCalls(message.content);
        
        for (const toolCall of toolCalls) {
          try {
            const invocationId = await this.invokeTool(
              toolCall.tool,
              toolCall.arguments,
              toolCall.serverId || Array.from(this.servers.keys())[0]
            );
            
            // Add tool invocation result to message
            const invocation = this.invocations.get(invocationId);
            if (invocation) {
              message.toolInvocations = message.toolInvocations || [];
              message.toolInvocations.push(invocation);
            }
          } catch (error) {
            console.error('Failed to process tool invocation:', error);
          }
        }
      }
    }
    
    return processedMessages;
  }

  private extractToolCalls(content: string): Array<{
    tool: string;
    arguments: Record<string, any>;
    serverId?: string;
  }> {
    const toolCalls: Array<{
      tool: string;
      arguments: Record<string, any>;
      serverId?: string;
    }> = [];

    try {
      // Look for tool call patterns in content
      const toolCallRegex = /<tool_call\s+tool="([^"]+)"\s+server="([^"]*)"\s*>(.*?)<\/tool_call>/gs;
      let match;
      
      while ((match = toolCallRegex.exec(content)) !== null) {
        const [, tool, serverId, argsContent] = match;
        try {
          const arguments_ = JSON.parse(argsContent);
          toolCalls.push({ tool, arguments: arguments_, serverId: serverId || undefined });
        } catch {
          // If JSON parsing fails, treat as string argument
          toolCalls.push({ tool, arguments: { input: argsContent }, serverId: serverId || undefined });
        }
      }
    } catch (error) {
      console.error('Failed to extract tool calls:', error);
    }

    return toolCalls;
  }

  // Getters
  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getInvocations(): ToolInvocation[] {
    return Array.from(this.invocations.values());
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  getTool(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }

  getInvocation(invocationId: string): ToolInvocation | undefined {
    return this.invocations.get(invocationId);
  }

  // Storage
  private saveServersToStorage(): void {
    try {
      localStorage.setItem('mcp_servers', JSON.stringify(Array.from(this.servers.entries())));
    } catch (error) {
      console.error('Failed to save MCP servers to storage:', error);
    }
  }

  private loadServersFromStorage(): void {
    try {
      const stored = localStorage.getItem('mcp_servers');
      if (stored) {
        const entries = JSON.parse(stored);
        this.servers = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load MCP servers from storage:', error);
    }
  }

  private saveToolsToStorage(): void {
    try {
      localStorage.setItem('mcp_tools', JSON.stringify(Array.from(this.tools.entries())));
    } catch (error) {
      console.error('Failed to save MCP tools to storage:', error);
    }
  }

  private loadToolsFromStorage(): void {
    try {
      const stored = localStorage.getItem('mcp_tools');
      if (stored) {
        const entries = JSON.parse(stored);
        this.tools = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load MCP tools from storage:', error);
    }
  }
}

export const mcpService = new MCPService();
export default mcpService;