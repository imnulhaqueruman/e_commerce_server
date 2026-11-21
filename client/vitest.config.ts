/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    // A hung test must fail fast instead of blocking the whole run.
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
  },
});