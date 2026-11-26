interface BadgeProps {
  children: React.ReactNode;
  variant?: 'working' | 'weekly-off' | 'leave' | 'holiday' | 'comp-off' | 'default' | 'error' | 'warning';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    working: 'bg-status-working-bg text-status-working-text',
    'weekly-off': 'bg-status-weekly-off-bg text-status-weekly-off-text',
    leave: 'bg-status-leave-bg text-status-leave-text',
    holiday: 'bg-status-holiday-bg text-status-holiday-text',
    'comp-off': 'bg-status-comp-off-bg text-status-comp-off-text',
    default: 'bg-gray-100 text-gray-700',
    error: 'bg-error-bg text-error',
    warning: 'bg-warning-bg text-warning',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
