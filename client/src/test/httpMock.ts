import { vi } from 'vitest';

/**
 * The mocked HTTP surface used by the component tests.
 *
 * This module intentionally has **no imports**. The `vi.mock('@/shared/lib/http')`
 * factory in `setup.ts` pulls `apiMock` from here, and the factory must not
 * reach anything that imports `@/shared/lib/http` back — that circular
 * dependency deadlocks the test runner before a single test executes.
 */
export const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

/** Reset every mock and give it a benign default resolved value. */
export function resetApiMock() {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.put.mockReset();
  apiMock.delete.mockReset();
  apiMock.get.mockResolvedValue({ data: [] });
  apiMock.post.mockResolvedValue({ data: {} });
  apiMock.put.mockResolvedValue({ data: {} });
  apiMock.delete.mockResolvedValue({ data: {} });
}
