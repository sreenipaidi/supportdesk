import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../../components/ui/Spinner.js';

describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders sr-only loading text', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading')).toHaveClass('sr-only');
  });

  it('renders custom label', () => {
    render(<Spinner label="Saving" />);
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });

  it('uses aria-label attribute', () => {
    render(<Spinner label="Processing" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing');
  });
});
