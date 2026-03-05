import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.js';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, id, className, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-primary mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm',
            'bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'disabled:bg-surface-alt disabled:opacity-50',
            'transition-colors appearance-none',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748B%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E")]',
            'bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem_1.25rem] pr-8',
            error
              ? 'border-danger focus:ring-danger'
              : 'border-border',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
