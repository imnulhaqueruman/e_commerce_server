import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetApiMock } from './httpMock';

/**
 * Register the axios mock before any test imports the http client.
 *
 * The mock replaces `http` (the axios instance) but keeps the real
 * `ApiError`, token helpers and interceptor wiring, so the tests exercise
 * the same code paths the app does.
 *
 * `httpMock` deliberately has no imports of its own. The factory below must
 * not reach a module that imports `@/shared/lib/http` back (the auth store
 * does), or the circular import deadlocks Vitest before any test runs.
 */
vi.mock('@/shared/lib/http', async () => {
  const { apiMock } = await import('./httpMock');
  const actual =
    await vi.importActual<typeof import('@/shared/lib/http')>(
      '@/shared/lib/http',
    );
  return {
    ...actual,
    http: apiMock,
    getStoredToken: () => null,
    setStoredToken: vi.fn(),
    setUnauthorizedHandler: vi.fn(),
  };
});

beforeEach(() => {
  resetApiMock();
});

beforeEach(async () => {
  // The auth store is imported lazily on purpose: it pulls in
  // `@/shared/lib/http`, and a static import here would close the same
  // circular dependency that `httpMock` was split out to avoid.
  const { useAuthStore } = await import('@/features/auth/store/authStore');
  useAuthStore.setState({ user: null, token: null, loading: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// --- Browser APIs jsdom does not implement -------------------------------

class FakeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error - polyfill
globalThis.IntersectionObserver = FakeObserver;
globalThis.ResizeObserver = FakeObserver;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
