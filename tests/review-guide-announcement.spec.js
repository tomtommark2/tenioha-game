const { test, expect } = require('@playwright/test');

test('復習だけの使い方は通常のお知らせに表示し、学習設定は変更しない', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    if (!localStorage.getItem('vocabGame_lastReadAnnouncementId')) {
      localStorage.setItem('vocabGame_lastReadAnnouncementId', '2026-07-17-review-ranking');
    }
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
  });
  await page.goto('/index.html');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementModal')).toBeHidden();
  const before = await page.evaluate(() => gameState.reviewMode);
  await page.locator('#announcementBtn').click();
  const first = page.locator('#announcementList .announcement-card').filter({ hasText: '今日は復習だけにする方法' });
  await expect(first).toContainText('今日は復習だけにする方法');
  await expect(first.locator('.announcement-detail')).toBeHidden();
  await first.locator('summary').click();
  await expect(first.locator('.announcement-detail')).toBeVisible();
  await expect(first).toContainText('「その他」→「出題・復習設定」');
  await expect(first).toContainText('次回も引き継がれます');
  await expect(first).toContainText('「新規＋復習」に戻せます');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
  await page.locator('#announcementMarkAllRead').click();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  expect(await page.evaluate(() => {
    const item = APP_ANNOUNCEMENTS.find(item => item.id === '2026-09-08-review-only-guide');
    return Boolean(item.featured || item.autoOpenOnce);
  })).toBe(false);
  expect(await page.evaluate(() => gameState.reviewMode)).toBe(before);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'screenshots/review-guide-' + testInfo.project.name + '.png' });
  await page.reload();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});

test('カード更新のお知らせは概要と履歴への影響を表示し、既読を保持する', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    if (!localStorage.getItem('vocabGame_lastReadAnnouncementId')) {
      localStorage.setItem('vocabGame_lastReadAnnouncementId', '2026-09-08-review-only-guide');
    }
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
  });
  await page.goto('/index.html');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementModal')).toBeHidden();
  await page.locator('#announcementBtn').click();
  const card = page.locator('details[data-announcement-id="2026-09-09-word-card-update"]');
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
  await expect(card.locator('.announcement-detail')).toBeHidden();
  await card.locator('summary').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 2件');
  await expect(card).toContainText('単語カードの統合と例文の見直しを行いました');
  await expect(card).toContainText('用法を切り替えられます');
  await expect(card).toContainText('16語をA2・B1へ移しました');
  const feedback = page.locator('#announcementList .announcement-card').filter({ hasText: '「ひとこと送る」の投稿に気づきやすくしました' });
  await feedback.locator('summary').click();
  await expect(feedback).toContainText('利用者への返信通知はありません');
  await expect(card).toContainText('意味・フレーズ・例文');
  await expect(card).toContainText('学習状態が一度だけ未学習に戻ります');
  await expect(card).toContainText('獲得済みの復習ポイントは変わりません');
  expect(await page.evaluate(() => Boolean(APP_ANNOUNCEMENTS.find(item => item.id === '2026-09-09-word-card-update').featured))).toBe(false);
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 1件');
  await page.locator('#announcementMarkAllRead').click();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  await page.reload();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});
