const { test, expect } = require('@playwright/test');

test('復習だけの使い方は通常のお知らせに表示し、学習設定は変更しない', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    if (!localStorage.getItem('vocabGame_lastReadAnnouncementId')) {
      localStorage.setItem('vocabGame_lastReadAnnouncementId', '2026-07-17-review-ranking');
    }
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-07-17-review-ranking');
  });
  await page.goto('/index.html');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementModal')).toBeHidden();
  const before = await page.evaluate(() => gameState.reviewMode);
  await page.locator('#announcementBtn').click();
  const first = page.locator('#announcementList .announcement-card').first();
  await expect(first).toContainText('今日は復習だけにする方法');
  await expect(first).toContainText('「その他」→「出題・復習設定」');
  await expect(first).toContainText('次回も引き継がれます');
  await expect(first).toContainText('「新規＋復習」に戻せます');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  expect(await page.evaluate(() => {
    const item = APP_ANNOUNCEMENTS[0];
    return Boolean(item.featured || item.autoOpenOnce);
  })).toBe(false);
  expect(await page.evaluate(() => gameState.reviewMode)).toBe(before);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'screenshots/review-guide-' + testInfo.project.name + '.png' });
  await page.reload();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});
