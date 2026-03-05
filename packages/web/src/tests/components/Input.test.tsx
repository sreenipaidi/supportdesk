import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Textarea } from '../../components/ui/Input.js';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders placeholder text', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<Input label="Email" error="Email is required" />);
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Email is required');
  });

  it('sets aria-invalid when there is an error', () => {
    render(<Input label="Email" error="Invalid" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="Enter your work email" />);
    expect(screen.getByText('Enter your work email')).toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    render(<Input label="Email" helperText="Enter your work email" error="Required" />);
    expect(screen.queryByText('Enter your work email')).not.toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders password toggle button for password type', () => {
    render(<Input label="Password" type="password" />);
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('toggles password visibility on click', () => {
    render(<Input label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByLabelText('Show password'));
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByLabelText('Hide password'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('applies disabled styles', () => {
    render(<Input label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });
});

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Textarea label="Description" error="Required field" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('sets aria-invalid on error', () => {
    render(<Textarea label="Description" error="Invalid" />);
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
  });
});
