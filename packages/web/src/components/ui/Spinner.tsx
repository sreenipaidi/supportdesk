import { cn } from '../../lib/cn.js';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={cn('inline-flex items-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
