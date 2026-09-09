const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
  ...base,
  testMatch: /(compact-example-selector|possessive-determiner-repairs|placeholder-repairs|overview-repairs)\.spec\.js/,
  projects: [{ name: 'mobile-webkit', use: { ...devices['iPhone 13'] } }],
});
