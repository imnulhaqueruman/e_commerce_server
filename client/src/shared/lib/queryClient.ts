import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client.
 *
 * `staleTime` is tuned per resource in the hook definitions rather than
 * here, because a product list and the current user have very different
 * freshness needs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
