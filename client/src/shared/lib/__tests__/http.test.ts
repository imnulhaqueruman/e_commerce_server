import { describe, expect, it, vi } from 'vitest';
import {
  http,
  ApiError,
  toApiError,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
} from '@/shared/lib/http';

/**
 * This file exercises the **real** HTTP module — the interceptors, the
 * token helpers and the error normalisation. The global mock in
 * `src/test/setup.ts` replaces that module for the component tests, so it
 * has to be lifted for this file.
 *
 * `vi.unmock` is hoisted above the imports by Vitest, so the module below
 * is the real one — not the mock.
 */
vi.unmock('@/shared/lib/http');

/**
 * The HTTP client is the seam between the UI and the API. These tests
 * cover the two behaviours every screen depends on: the Bearer token is
 * attached, and a 401 triggers a single global logout.
 */
describe('http client', () => {
  it('attaches the stored token as a Bearer header', () => {
    setStoredToken('test-token');
    expect(localStorage.getItem('ecom_token')).toBe('test-token');

    // The interceptor reads the token at request time.
    const config = { headers: {} as Record<string, string> };
    const interceptor = (
      http.interceptors.request as unknown as {
        handlers: { fulfilled: (c: typeof config) => typeof config }[];
      }
    ).handlers[0].fulfilled;

    const result = interceptor(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('omits the Authorization header when there is no token', () => {
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();

    const config = { headers: {} as Record<string, string> };
    const interceptor = (
      http.interceptors.request as unknown as {
        handlers: { fulfilled: (c: typeof config) => typeof config }[];
      }
    ).handlers[0].fulfilled;

    const result = interceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('calls the unauthorized handler on a 401', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    const interceptor = (
      http.interceptors.response as unknown as {
        handlers: { rejected: (e: unknown) => Promise<never> }[];
      }
    ).handlers[0].rejected;

    const error = {
      response: { status: 401, data: { err: 'Invalid or expired token' } },
      isAxiosError: true,
    };

    await expect(interceptor(error)).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('normalises an error body into an ApiError with a readable message', async () => {
    setUnauthorizedHandler(null);

    const interceptor = (
      http.interceptors.response as unknown as {
        handlers: { rejected: (e: unknown) => Promise<never> }[];
      }
    ).handlers[0].rejected;

    await expect(
      interceptor({
        response: { status: 400, data: { err: 'Invalid coupon' } },
        isAxiosError: true,
      }),
    ).rejects.toMatchObject({
      message: 'Invalid coupon',
      status: 400,
    });

    await expect(
      interceptor({
        response: { status: 500, data: 'boom' },
        isAxiosError: true,
      }),
    ).rejects.toMatchObject({ message: 'boom', status: 500 });
  });

  it('exposes isUnauthorized and isForbidden helpers', () => {
    expect(new ApiError('x', 401).isUnauthorized).toBe(true);
    expect(new ApiError('x', 403).isForbidden).toBe(true);
    expect(new ApiError('x', 500).isUnauthorized).toBe(false);
  });

  it('converts an unknown rejection into an ApiError', () => {
    const converted = toApiError(new Error('network down'));
    expect(converted).toBeInstanceOf(ApiError);
    expect(converted.message).toBe('network down');
    expect(converted.status).toBe(0);

    const fallback = toApiError('something odd');
    expect(fallback.message).toBe('Unexpected error');
  });
});
