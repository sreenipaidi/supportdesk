import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/ui/EmptyState.js';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items" description="Try creating one." />);
    expect(screen.getByText('Try creating one.')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Create Item', onClick }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Create Item' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
