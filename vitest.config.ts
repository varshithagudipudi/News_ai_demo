import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Modules under test import the `server-only` marker, which throws when
      // resolved outside a React Server Component graph. Point it at a no-op.
      'server-only': fileURLToPath(
        new URL('./tests/stubs/serverOnly.ts', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
