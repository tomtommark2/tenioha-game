// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const baseConfig = require('./playwright.config');

module.exports = defineConfig({
  ...baseConfig,
  grep: /プロフィールモーダルを開閉できる|非ブロック画面は共通操作で閉じ、制限画面は閉じない|判定回数と正解数を即時保存|出題モードは小さい画面|復習タイミングは即時保存|ひとこと欄は背景と戻るで閉じる|ひとこと欄の返信履歴/,
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
