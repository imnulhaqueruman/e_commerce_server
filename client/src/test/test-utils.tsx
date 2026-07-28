import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  route?: string;
  queryClient?: QueryClient;
}

function Providers({ children, route = '/', queryClient }: ProvidersProps) {
  const qc = queryClient ?? makeQueryClient();
  return (
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { route?: string; queryClient?: QueryClient } = {},
) {
  const { route, queryClient, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers route={route} queryClient={queryClient}>
        {children}
      </Providers>
    ),
    ...rest,
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';