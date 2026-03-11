// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const isWindows = process.platform === 'win32';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: isWindows ? 'py -3 local_server.py' : 'python3 local_server.py',
    port: 8000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
