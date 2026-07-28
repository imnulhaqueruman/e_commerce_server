import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetApiMock, resetAuthStore } from './mocks';

// Register the axios mock at the top of setup.ts so it runs before any test imports.
vi.mock('@/lib/fetcher', async () => {
  const { apiMock } = await import('./mocks');
  const actual =
    await vi.importActual<typeof import('@/lib/fetcher')>('@/lib/fetcher');
  return {
    ...actual,
    api: apiMock,
    getStoredToken: () => null,
    setStoredToken: vi.fn(),
    setUnauthorizedHandler: vi.fn(),
  };
});

// Reset DOM, storage, axios mock and auth store before each test.
beforeEach(() => {
  resetApiMock();
  resetAuthStore();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// --- Browser APIs that jsdom doesn't implement -----------------
class FakeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error - polyfill
globalThis.IntersectionObserver = FakeObserver;
// @ts-expect-error - polyfill
globalThis.ResizeObserver = FakeObserver;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (q: string) => ({
    matches: false,
    media: q,
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