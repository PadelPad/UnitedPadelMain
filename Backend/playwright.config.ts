import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default defineConfig({
  // Only look in tests/e2e — do not scan anywhere else.
  testDir: path.resolve(__dirname, 'tests/e2e'),

  // Only pick *.spec.(ts|js) files in that folder.
  testMatch: /.*\.spec\.(ts|js)$/,

  // Ignore any classic unit-test locations/files if they ever get copied here.
  testIgnore: [
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.js',
  ],

  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: BACKEND_URL,
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
