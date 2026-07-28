import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import ErrorBoundary from '../ErrorBoundary';

function Boom(): JSX.Element {
  throw new Error('boom');
}

describe('<ErrorBoundary />', () => {
  // silence React error boundary console.error noise
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  it('renders children when no error is thrown', () => {
    renderWithProviders(<ErrorBoundary><div>ok</div></ErrorBoundary>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    renderWithBoundary();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});

function renderWithBoundary() {
  return renderWithProviders(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );
}
