import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.js';
import { Spinner } from './Spinner.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses = {
  primary:
    'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm',
  secondary:
    'bg-white text-text-primary border border-border hover:bg-surface-alt focus-visible:ring-primary shadow-sm',
  ghost:
    'text-text-secondary hover:bg-surface-alt hover:text-text-primary focus-visible:ring-primary',
  danger:
    'bg-danger text-white hover:bg-red-700 focus-visible:ring-danger shadow-sm',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-md gap-2',
  lg: 'px-6 py-3 text-base rounded-md gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" label="Loading" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
