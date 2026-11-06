const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
    ...base,
    testMatch: /example-(reading-preview|reading-app|reading-cache|area-layout|panel-variants)\.spec\.js/,
    projects: [
        { name: 'reading-desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'reading-mobile', use: { ...devices['Pixel 7'] } },
        { name: 'reading-webkit', use: { ...devices['iPhone 13'] } }
    ]
});
