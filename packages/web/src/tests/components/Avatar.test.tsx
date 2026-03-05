import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../../components/ui/Avatar.js';

describe('Avatar', () => {
  it('renders initials when no image src', () => {
    render(<Avatar name="John Smith" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('renders single initial for single-word names', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar name="John Smith" src="https://example.com/avatar.jpg" />);
    const img = screen.getByAltText('John Smith');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('has accessible role and label', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { rerender } = render(<Avatar name="Test" size="sm" />);
    expect(screen.getByRole('img')).toHaveClass('h-7', 'w-7');

    rerender(<Avatar name="Test" size="lg" />);
    expect(screen.getByRole('img')).toHaveClass('h-12', 'w-12');
  });
});
