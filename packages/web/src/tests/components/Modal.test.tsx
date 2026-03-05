import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/ui/Modal.js';

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Close Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    // Click the overlay (the first child of the dialog)
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.querySelector('[aria-hidden="true"]');
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="ARIA Test">
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'ARIA Test');
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} footer={<button>Save</button>}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
