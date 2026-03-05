import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = 'No data to display.',
  className,
  isLoading = false,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm" role="grid">
        <thead>
          <tr className="border-b border-border bg-surface-alt">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-text-primary',
                  col.headerClassName,
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={
                  sortColumn === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortColumn === col.key && (
                    <span aria-hidden="true">
                      {sortDirection === 'asc' ? '\u2191' : '\u2193'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-secondary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-alt',
                )}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(item);
                        }
                      }
                    : undefined
                }
                role={onRowClick ? 'row' : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Pagination component
export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, perPage, onPageChange }: PaginationProps) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <nav
      className="flex items-center justify-between px-4 py-3"
      aria-label="Table pagination"
    >
      <p className="text-sm text-text-secondary">
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface-alt disabled:opacity-50 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          Prev
        </button>
        {generatePageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-text-secondary">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                p === page
                  ? 'bg-primary text-white'
                  : 'border border-border hover:bg-surface-alt',
              )}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface-alt disabled:opacity-50 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
}
