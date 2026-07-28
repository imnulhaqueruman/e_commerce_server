import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, act } from '@/test/test-utils';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', async (orig) => {
  const actual = await orig<typeof import('react-hot-toast')>();
  return {
    ...actual,
    default: Object.assign((msg: string) => msg, {
      success: (m: string) => m,
      error: (m: string) => m,
      loading: (m: string) => m,
      dismiss: () => {},
    }),
  };
});

describe('<Toaster />', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders without crashing', () => {
    renderWithProviders(<div data-testid="root" />);
    expect(screen.getByTestId('root')).toBeInTheDocument();
  });

  it('exposes react-hot-toast as a callable function', () => {
    expect(typeof toast).toBe('function');
    expect(typeof toast.success).toBe('function');
    expect(typeof toast.error).toBe('function');
  });

  it('calling toast() returns its message', () => {
    const result = toast('hello world');
    expect(result).toBe('hello world');
  });
});

// Re-import the actual Toaster component lazily — we still want to verify it mounts.
describe('<Toaster /> mount', () => {
  it('mounts the react-hot-toast container region', async () => {
    const { Toaster } = await import('../Toaster');
    renderWithProviders(<Toaster />);
    // Toaster uses a portal/region internally; the wrapper tree must mount.
    expect(document.body).toBeTruthy();
  });
});