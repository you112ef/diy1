import { useState } from 'react';
import { classNames } from '~/utils/classNames';

interface ToolInvocation {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

interface ToolInvocationsProps {
  invocations: ToolInvocation[];
  onRetry?: (invocationId: string) => void;
  onCancel?: (invocationId: string) => void;
}

export function ToolInvocations({ invocations, onRetry, onCancel }: ToolInvocationsProps) {
  const [expandedInvocations, setExpandedInvocations] = useState<Set<string>>(new Set());

  const toggleExpanded = (invocationId: string) => {
    const newExpanded = new Set(expandedInvocations);

    if (newExpanded.has(invocationId)) {
      newExpanded.delete(invocationId);
    } else {
      newExpanded.add(invocationId);
    }

    setExpandedInvocations(newExpanded);
  };

  const getStatusColor = (status: ToolInvocation['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: ToolInvocation['status']) => {
    switch (status) {
      case 'pending':
        return 'i-ph:clock-fill';
      case 'running':
        return 'i-ph:arrow-clockwise';
      case 'completed':
        return 'i-ph:check-circle-fill';
      case 'failed':
        return 'i-ph:x-circle-fill';
      default:
        return 'i-ph:question-circle-fill';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }

    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatArguments = (args: Record<string, any>): string => {
    try {
      return JSON.stringify(args, null, 2);
    } catch {
      return String(args);
    }
  };

  if (invocations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tool Invocations ({invocations.length})</h3>

      {invocations.map((invocation) => (
        <div key={invocation.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Header */}
          <div
            className={classNames(
              'px-4 py-3 cursor-pointer transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'flex items-center justify-between',
            )}
            onClick={() => toggleExpanded(invocation.id)}
          >
            <div className="flex items-center gap-3">
              <span
                className={classNames(
                  'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                  getStatusColor(invocation.status),
                )}
              >
                <span className={getStatusIcon(invocation.status)} />
                {invocation.status}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{invocation.toolName}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDuration(invocation.startTime, invocation.endTime)}
              </span>
              <span
                className={classNames(
                  'i-ph:caret-down transition-transform',
                  expandedInvocations.has(invocation.id) ? 'rotate-180' : '',
                )}
              />
            </div>
          </div>

          {/* Expanded Content */}
          {expandedInvocations.has(invocation.id) && (
            <div className="px-4 pb-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="pt-3 space-y-3">
                {/* Arguments */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Arguments</h4>
                  <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
                    {formatArguments(invocation.arguments)}
                  </pre>
                </div>

                {/* Result or Error */}
                {invocation.status === 'completed' && invocation.result && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Result</h4>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
                      {JSON.stringify(invocation.result, null, 2)}
                    </pre>
                  </div>
                )}

                {invocation.status === 'failed' && invocation.error && (
                  <div>
                    <h4 className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Error</h4>
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded border">
                      {invocation.error}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {invocation.status === 'failed' && onRetry && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry(invocation.id);
                      }}
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  )}

                  {invocation.status === 'running' && onCancel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel(invocation.id);
                      }}
                      className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
