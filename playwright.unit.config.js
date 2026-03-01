// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /unit\.spec\.js/,
  timeout: 30 * 1000,
  reporter: 'list',
  use: {
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer needed for VM-based unit tests
});
