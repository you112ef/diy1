import { useState } from 'react';
import { classNames } from '~/utils/classNames';

interface MCPTool {
  id: string;
  name: string;
  description: string;
  provider: string;
  status: 'available' | 'unavailable' | 'error';
}

interface MCPToolsProps {
  tools: MCPTool[];
  onToolSelect: (tool: MCPTool) => void;
}

export function McpTools({ tools, onToolSelect }: MCPToolsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const providers = Array.from(new Set(tools.map((tool) => tool.provider)));

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || tool.provider === selectedProvider;

    return matchesSearch && matchesProvider;
  });

  const getStatusColor = (status: MCPTool['status']) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'unavailable':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: MCPTool['status']) => {
    switch (status) {
      case 'available':
        return 'i-ph:check-circle-fill';
      case 'unavailable':
        return 'i-ph:x-circle-fill';
      case 'error':
        return 'i-ph:exclamation-triangle-fill';
      default:
        return 'i-ph:question-circle-fill';
    }
  };

  if (tools.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="i-ph:tools w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p>No MCP tools available</p>
        <p className="text-sm">Configure MCP servers in settings to enable tools</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">MCP Tools</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTools.length} of {tools.length} tools
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Providers</option>
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </div>

      {/* Tools List */}
      <div className="space-y-2">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className={classNames(
              'p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all',
              'hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm',
              'bg-white dark:bg-gray-800',
            )}
            onClick={() => onToolSelect(tool)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{tool.name}</h4>
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                      getStatusColor(tool.status),
                    )}
                  >
                    <span className={getStatusIcon(tool.status)} />
                    {tool.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{tool.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Provider: {tool.provider}</span>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <span className="i-ph:arrow-right w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>No tools match your search criteria</p>
        </div>
      )}
    </div>
  );
}
