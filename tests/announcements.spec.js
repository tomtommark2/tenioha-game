const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/https?:\/\/(?!localhost:8000)/, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-07-17-review-ranking');
  });
});

test('お知らせは一覧で既読にせず、詳細の個別既読・再起動・一括既読を保持する', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  const saveBefore = await page.evaluate(() => {
    const key = getWordKey(vocabularyDatabase.basic[0], 'basic');
    gameState.wordStates[key] = 'learned';
    gameState.srsData[key] = { recentAnswers: [false, true], successCount: 1, failCount: 1, dueAt: 123, reviewStep: 1, scheduledIntervalDays: 1, everWrong: true };
    gameState.points = 1234;
    saveGame();
    return { key, state: gameState.wordStates[key], srs: gameState.srsData[key], points: gameState.points };
  });
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 6件');
  await expect(page.locator('details[open]')).toHaveCount(0);
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await page.screenshot({ path: `screenshots/announcements-v2-${testInfo.project.name}-list.png` });
  const first = page.locator('#announcementList details').first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  await expect(first.getByRole('heading', { name: '学習履歴への影響' })).toBeVisible();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 5件');
  await page.screenshot({ path: `screenshots/announcements-v2-${testInfo.project.name}-detail.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('#announcementModal')).toBeHidden();
  await expect(page.locator('#announcementBtn')).toBeFocused();
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 5件');
  await page.locator('#announcementMarkAllRead').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('すべて既読です');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  await expect(page.locator('#announcementMarkAllRead')).toBeDisabled();
  await page.reload();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  expect(await page.evaluate(key => ({ key, state: gameState.wordStates[key], srs: gameState.srsData[key], points: gameState.points }), saveBefore.key)).toEqual(saveBefore);
});

test('旧既読はその記事以前だけ移行し、未知ID・破損値でも動作する', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('seeded')) {
      localStorage.setItem('vocabGame_lastReadAnnouncementId', '2026-09-08-review-only-guide');
      localStorage.setItem('seeded', 'true');
    }
  });
  await page.goto('/index.html');
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 2件');
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 2件');
  await page.evaluate(() => {
    localStorage.setItem('vocabGame_readAnnouncementIds_v1', '{broken');
    localStorage.setItem('vocabGame_lastReadAnnouncementId', 'removed-article');
  });
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 6件');
});

test('大型告知の操作はその記事だけ既読にし、他のお知らせを既読にしない', async ({ page }) => {
  await page.goto('/index.html?announcementPreview=1');
  await expect(page.locator('#announcementModal')).toHaveClass(/is-featured-mode/);
  await expect(page.locator('#announcementReadTools')).toBeHidden();
  await page.locator('#announcementPrimaryAction').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_readAnnouncementIds_v1')))).toEqual(['2026-07-17-review-ranking']);
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
});
