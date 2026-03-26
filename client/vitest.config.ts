import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/shared/utils/**',
        'src/shared/hooks/**',
        'src/features/**/hooks/**',
        'src/features/**/store/**',
      ],
      exclude: ['src/test/**', '**/*.test.*', '**/*.d.ts', '**/*.config.*'],
      thresholds: {
        // Objetivo Fase 4: incrementar a 70
        lines: 40,
        functions: 40,
      },
    },
  },
});
