const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/https?:\/\/(?!localhost:8000)/, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    if (!localStorage.getItem('vocabGame_lastAutoShownAnnouncementId')) {
      localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
    }
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
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 7件');
  await expect(page.locator('details[open]')).toHaveCount(0);
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await page.screenshot({ path: `screenshots/announcements-v2-${testInfo.project.name}-list.png` });
  const first = page.locator('#announcementList details').first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  await expect(first.getByRole('heading', { name: '学習履歴への影響' })).toBeVisible();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 6件');
  await page.screenshot({ path: `screenshots/announcements-v2-${testInfo.project.name}-detail.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('#announcementModal')).toBeHidden();
  await expect(page.locator('#announcementBtn')).toBeFocused();
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 6件');
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
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
  await page.evaluate(() => {
    localStorage.setItem('vocabGame_readAnnouncementIds_v1', '{broken');
    localStorage.setItem('vocabGame_lastReadAnnouncementId', 'removed-article');
  });
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 7件');
});

test('大型告知の操作はその記事だけ既読にし、他のお知らせを既読にしない', async ({ page }) => {
  await page.goto('/index.html?announcementPreview=1');
  await expect(page.locator('#announcementModal')).toHaveClass(/is-featured-mode/);
  await expect(page.locator('#announcementReadTools')).toBeHidden();
  await page.locator('#announcementPrimaryAction').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_readAnnouncementIds_v1')))).toEqual(['2026-09-11-illustrated-wordbook']);
  await expect(page.locator('#illustratedWordbookModal')).toBeVisible();
  await expect(page.locator('#leaderboardModal')).toBeHidden();
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
});

test('旧ランキング告知を確認済みでも新告知は一度表示し、あとでは未読を残す', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    if (!localStorage.getItem('announcementUpgradeSeeded')) {
      localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-07-17-review-ranking');
      localStorage.setItem('announcementUpgradeSeeded', 'true');
    }
  });
  await page.goto('/index.html');
  // Local previews suppress auto-open; exercise the production eligibility gate.
  expect(await page.evaluate(() => {
    isDeveloperPreviewMode = () => false;
    const featured = getFeaturedAnnouncement();
    const eligible = shouldAutoOpenFeaturedAnnouncement(featured);
    if (eligible) openFeaturedAnnouncement(featured);
    return eligible;
  })).toBe(true);
  await expect(page.locator('#announcementModal')).toBeVisible();
  await expect(page.locator('#announcementList')).toContainText('イラスト単語帳ができました！');
  await expect(page.locator('.announcement-illustration-preview img')).toHaveCount(3);
  await expect.poll(() => page.locator('.announcement-illustration-preview img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('illustrated-announcement.png') });
  await page.getByRole('button', { name: 'あとで', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('vocabGame_lastAutoShownAnnouncementId'))).toBe('2026-09-11-illustrated-wordbook');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await page.reload();
  expect(await page.evaluate(() => {
    isDeveloperPreviewMode = () => false;
    return shouldAutoOpenFeaturedAnnouncement(getFeaturedAnnouncement());
  })).toBe(false);
  await expect(page.locator('#announcementModal')).toBeHidden();
  await page.locator('#announcementBtn').click();
  const first = page.locator('#announcementList details').first();
  await first.locator('summary').click();
  await expect(first).toContainText('「単語帳から選ぶ」→「イラスト単語帳」');
  await expect(first).toContainText('回答前に見たいとき');
  await expect(first).toContainText('リセットされません');
});
