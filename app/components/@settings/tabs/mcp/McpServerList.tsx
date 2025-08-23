import { useState } from 'react';
import { McpServerListItem } from './McpServerListItem';

interface McpServer {
  id: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastSeen?: string;
  capabilities: string[];
}

interface McpServerListProps {
  servers: McpServer[];
  onConnect: (serverId: string) => void;
  onDisconnect: (serverId: string) => void;
  onDelete: (serverId: string) => void;
  onAddServer: () => void;
}

export function McpServerList({
  servers,
  onConnect,
  onDisconnect,
  onDelete,
  onAddServer,
}: McpServerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'error' | 'connecting'>('all');

  const filteredServers = servers.filter((server) => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (server.description && server.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || server.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const connectedCount = servers.filter(s => s.status === 'connected').length;
  const totalCount = servers.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">MCP Servers</h2>
          <p className="text-sm text-bolt-elements-textSecondary">
            {connectedCount} of {totalCount} servers connected
          </p>
        </div>
        <button
          onClick={onAddServer}
          className="px-4 py-2 bg-bolt-elements-focus text-bolt-elements-textPrimary rounded-lg hover:bg-bolt-elements-focus/80 transition-colors"
        >
          Add Server
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
        >
          <option value="all">All Status</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="error">Error</option>
          <option value="connecting">Connecting</option>
        </select>
      </div>

      {/* Server List */}
      {filteredServers.length === 0 ? (
        <div className="text-center py-8 text-bolt-elements-textTertiary">
          {searchQuery || statusFilter !== 'all' ? 'No servers match your filters.' : 'No MCP servers configured yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServers.map((server) => (
            <McpServerListItem
              key={server.id}
              server={server}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}