import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: './server',
      url: 'http://localhost:5000',
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'npm run dev',
      cwd: './frontend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
