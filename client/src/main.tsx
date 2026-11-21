import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { queryClient } from '@/shared/lib/queryClient';
import { Toaster } from '@/app/Toaster';
import ErrorBoundary from '@/app/ErrorBoundary';
import { useAuthStore } from '@/features/auth/store/authStore';
import '@/index.css';

/**
 * Validate any stored token before the first render so route guards have
 * an accurate `loading` / `user` state.
 */
async function bootstrap() {
  await useAuthStore.getState().bootstrap();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
              <Toaster />
            </BrowserRouter>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
