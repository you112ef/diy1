import { useState } from 'react';
import { McpServerList } from './McpServerList';

interface McpServer {
  id: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastSeen?: string;
  capabilities: string[];
}

export default function McpTab() {
  const [servers, setServers] = useState<McpServer[]>([
    {
      id: '1',
      name: 'Local MCP Server',
      description: 'Local Model Context Protocol server for development',
      status: 'disconnected',
      capabilities: ['filesystem', 'terminal', 'search'],
    },
  ]);

  const handleConnect = (serverId: string) => {
    setServers((prev) =>
      prev.map((server) => (server.id === serverId ? { ...server, status: 'connecting' as const } : server)),
    );

    // Simulate connection
    setTimeout(() => {
      setServers((prev) =>
        prev.map((server) =>
          server.id === serverId
            ? { ...server, status: 'connected' as const, lastSeen: new Date().toISOString() }
            : server,
        ),
      );
    }, 1000);
  };

  const handleDisconnect = (serverId: string) => {
    setServers((prev) =>
      prev.map((server) => (server.id === serverId ? { ...server, status: 'disconnected' as const } : server)),
    );
  };

  const handleDelete = (serverId: string) => {
    setServers((prev) => prev.filter((server) => server.id !== serverId));
  };

  const handleAddServer = () => {
    const newServer: McpServer = {
      id: Date.now().toString(),
      name: `New Server ${servers.length + 1}`,
      description: 'New MCP server configuration',
      status: 'disconnected',
      capabilities: ['basic'],
    };
    setServers((prev) => [...prev, newServer]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Model Context Protocol (MCP)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure and manage MCP servers to extend Bolt AI capabilities with external tools and services.
          </p>
        </div>

        {/* MCP Server List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <McpServerList
            servers={servers}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onDelete={handleDelete}
            onAddServer={handleAddServer}
          />
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">About Model Context Protocol</h3>
          <div className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
            <p>MCP allows Bolt AI to interact with external tools and services through a standardized protocol.</p>
            <p>Common capabilities include file system access, terminal operations, web search, and more.</p>
            <p>Configure your MCP servers below to enable these extended capabilities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
