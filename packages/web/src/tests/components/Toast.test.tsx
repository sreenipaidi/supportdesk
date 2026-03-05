import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastContainer } from '../../components/ui/Toast.js';
import { useUIStore } from '../../stores/ui.store.js';

describe('ToastContainer', () => {
  beforeEach(() => {
    // Reset the store between tests
    act(() => {
      const state = useUIStore.getState();
      state.toasts.forEach((t) => state.removeToast(t.id));
    });
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a success toast', () => {
    act(() => {
      useUIStore.getState().addToast({ type: 'success', message: 'Operation successful' });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders an error toast with alert role', () => {
    act(() => {
      useUIStore.getState().addToast({ type: 'error', message: 'Something went wrong' });
    });
    render(<ToastContainer />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveTextContent('Something went wrong');
  });

  it('renders multiple toasts', () => {
    act(() => {
      useUIStore.getState().addToast({ type: 'success', message: 'First toast' });
      useUIStore.getState().addToast({ type: 'info', message: 'Second toast' });
    });
    render(<ToastContainer />);
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });

  it('removes toast when dismiss button is clicked', () => {
    act(() => {
      useUIStore.getState().addToast({ type: 'info', message: 'Dismissable toast' });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Dismissable toast')).toBeInTheDocument();

    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);
    expect(screen.queryByText('Dismissable toast')).not.toBeInTheDocument();
  });

  it('auto-dismisses non-error toasts after timeout', () => {
    vi.useFakeTimers();
    act(() => {
      useUIStore.getState().addToast({ type: 'success', message: 'Auto dismiss' });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
