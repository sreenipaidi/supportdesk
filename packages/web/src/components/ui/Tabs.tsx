import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div
      className={cn('flex border-b border-border', className)}
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'hover:text-text-primary',
              isActive
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-text-secondary',
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs',
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (id !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
}
