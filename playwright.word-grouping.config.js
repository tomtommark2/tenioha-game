const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
  ...base,
  testMatch: /word-grouping\.spec\.js/,
  projects: [
    { name: 'narrow-chromium', use: { browserName: 'chromium', viewport: { width: 320, height: 780 }, hasTouch: true, isMobile: true } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
});
