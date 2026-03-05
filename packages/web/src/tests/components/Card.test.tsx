import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card.js';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies border and background classes', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('border');
    expect(card.className).toContain('rounded-lg');
  });

  it('applies padding based on prop', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-6');
  });

  it('applies no padding when padding is none', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('p-4');
    expect(card.className).not.toContain('p-6');
  });
});

describe('CardHeader', () => {
  it('renders children with border-bottom', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className).toContain('border-b');
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children with border-top', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className).toContain('border-t');
  });
});
