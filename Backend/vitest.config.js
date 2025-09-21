// vitest.config.js
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'node',
    // Only run server tests; ignore any old root-level tests/
    include: ['server/tests/**/*.test.js'],
    restoreMocks: true,
    mockReset: true,
    clearMocks: true,
    // silence deprecation warning in Vitest 3 by using new path
    server: {
      deps: { inline: [/pino/, /pino-http/] },
    },
  },
  resolve: {
    alias: {
      '@server': resolve(__dirname, 'server'),
    },
  },
});
