import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from '../../components/ui/Select.js';

describe('Select', () => {
  const options = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  it('renders with label', () => {
    render(<Select label="Priority" options={options} />);
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select label="Priority" options={options} />);
    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument();
  });

  it('renders placeholder when provided', () => {
    render(<Select label="Priority" options={options} placeholder="Select priority" />);
    expect(screen.getByRole('option', { name: 'Select priority' })).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select label="Priority" options={options} error="Priority is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Priority is required');
  });

  it('sets aria-invalid on error', () => {
    render(<Select label="Priority" options={options} error="Required" />);
    expect(screen.getByLabelText('Priority')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text', () => {
    render(<Select label="Priority" options={options} helperText="Choose a priority level" />);
    expect(screen.getByText('Choose a priority level')).toBeInTheDocument();
  });
});
