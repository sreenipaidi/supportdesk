import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
};

const dotColors = {
  default: 'bg-gray-400',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// Pre-configured status badges
export type TicketStatusVariant = 'open' | 'pending' | 'resolved' | 'closed';

const statusVariantMap: Record<TicketStatusVariant, BadgeProps['variant']> = {
  open: 'primary',
  pending: 'warning',
  resolved: 'success',
  closed: 'default',
};

const statusLabels: Record<TicketStatusVariant, string> = {
  open: 'Open',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function StatusBadge({ status }: { status: TicketStatusVariant }) {
  return (
    <Badge variant={statusVariantMap[status]} dot>
      {statusLabels[status]}
    </Badge>
  );
}

// Priority badges
export type PriorityVariant = 'low' | 'medium' | 'high' | 'urgent';

const priorityVariantMap: Record<PriorityVariant, BadgeProps['variant']> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const priorityLabels: Record<PriorityVariant, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function PriorityBadge({ priority }: { priority: PriorityVariant }) {
  return (
    <Badge variant={priorityVariantMap[priority]}>
      {priorityLabels[priority]}
    </Badge>
  );
}
