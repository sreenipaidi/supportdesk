import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge, PriorityBadge } from '../../components/ui/Badge.js';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('applies success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('bg-success-light');
  });

  it('renders with a dot indicator', () => {
    const { container } = render(<Badge dot variant="success">Active</Badge>);
    // The dot should be a span with rounded-full class
    const dot = container.querySelector('.rounded-full.bg-success');
    expect(dot).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders Open status', () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders Pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders Resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders Closed status', () => {
    render(<StatusBadge status="closed" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it('renders priority levels correctly', () => {
    const { rerender } = render(<PriorityBadge priority="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();

    rerender(<PriorityBadge priority="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<PriorityBadge priority="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();

    rerender(<PriorityBadge priority="urgent" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
