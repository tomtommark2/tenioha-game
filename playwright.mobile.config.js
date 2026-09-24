// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const baseConfig = require('./playwright.config');

module.exports = defineConfig({
  ...baseConfig,
  grep: /カード学習状況：|読み上げ設定：|管理メニュー|絵・意味・前の絵|ひとこと新着|イラスト画面は小さい画面|プロフィールモーダルを開閉できる|非ブロック画面は共通操作で閉じ、制限画面は閉じない|判定回数と正解数を即時保存|出題モードは小さい画面|復習タイミングは即時保存|ひとこと欄は背景と戻るで閉じる|ひとこと欄の返信履歴|省スペース設定入口|お知らせは一覧|旧既読は|大型告知の操作/,
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
