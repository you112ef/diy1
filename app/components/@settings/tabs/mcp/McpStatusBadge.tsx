import { classNames } from '~/utils/classNames';

interface McpStatusBadgeProps {
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  size?: 'sm' | 'md' | 'lg';
}

export function McpStatusBadge({ status, size = 'md' }: McpStatusBadgeProps) {
  const statusConfig = {
    connected: {
      label: 'Connected',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
      icon: 'i-ph:check-circle-fill',
    },
    disconnected: {
      label: 'Disconnected',
      className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      icon: 'i-ph:x-circle-fill',
    },
    error: {
      label: 'Error',
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
      icon: 'i-ph:exclamation-triangle-fill',
    },
    connecting: {
      label: 'Connecting',
      className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      icon: 'i-ph:arrow-clockwise',
    },
  };

  const config = statusConfig[status];
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        sizeClasses[size],
        config.className,
      )}
    >
      <span className={classNames(config.icon, 'w-4 h-4')} />
      {config.label}
    </div>
  );
}