import { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { McpStatusBadge } from './McpStatusBadge';

interface McpServer {
  id: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastSeen?: string;
  capabilities: string[];
}

interface McpServerListItemProps {
  server: McpServer;
  onConnect: (serverId: string) => void;
  onDisconnect: (serverId: string) => void;
  onDelete: (serverId: string) => void;
}

export function McpServerListItem({
  server,
  onConnect,
  onDisconnect,
  onDelete,
}: McpServerListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnect(server.id);
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDisconnect(server.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(server.id);
  };

  return (
    <div className="border border-bolt-elements-borderColor rounded-lg p-4 hover:bg-bolt-elements-background-depth-2 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 text-left hover:text-bolt-elements-textPrimary transition-colors"
          >
            <span
              className={classNames(
                'i-ph:caret-right transition-transform',
                isExpanded && 'rotate-90',
              )}
            />
            <h3 className="font-medium text-bolt-elements-textPrimary">{server.name}</h3>
          </button>
          <McpStatusBadge status={server.status} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {server.status === 'connected' ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="px-3 py-1.5 text-sm bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20 transition-colors"
            >
              Connect
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {server.description && (
            <p className="text-sm text-bolt-elements-textSecondary">{server.description}</p>
          )}

          {server.lastSeen && (
            <div className="text-sm text-bolt-elements-textTertiary">
              Last seen: {new Date(server.lastSeen).toLocaleString()}
            </div>
          )}

          {server.capabilities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Capabilities:</h4>
              <div className="flex flex-wrap gap-2">
                {server.capabilities.map((capability, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded-md"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}