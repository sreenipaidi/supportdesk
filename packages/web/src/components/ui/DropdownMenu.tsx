import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={cn('relative inline-block', className)}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1 z-50 min-w-[180px]',
            'bg-surface rounded-md border border-border shadow-md',
            'py-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                'hover:bg-surface-alt transition-colors',
                'disabled:opacity-50 disabled:pointer-events-none',
                item.danger && 'text-danger hover:bg-danger-light',
                !item.danger && 'text-text-primary',
              )}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
