// Shared mock helpers. The actual vi.mock('@/lib/fetcher') registration is
// owned by setup.ts so the hoisted declaration is found at the test source root.
import { vi } from 'vitest';
import { useAuthStore } from '@/store/authStore';

export const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

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

export function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    loading: false,
  });
}