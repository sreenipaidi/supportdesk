import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-lg border border-border shadow-sm',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 border-b border-border', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 border-t border-border', className)} {...props}>
      {children}
    </div>
  );
}
