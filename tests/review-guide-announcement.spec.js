const { test, expect } = require('@playwright/test');

const retiredIds = [
  '2026-09-11-illustrated-wordbook',
  '2026-09-09-word-card-update',
  '2026-09-09-feedback-notifications',
  '2026-09-08-review-only-guide',
];
const olderIds = ['2026-07-17-review-ranking', '2026-06-22-word-list', '2026-05-04-ipa'];
const alwaysVisibleId = '2026-10-04-illustration-always-visible';

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
  });
});

test('お知らせは古い重複4件を外し、常時表示の設定方法を案内して学習設定は変えない', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/index.html');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementModal')).toBeHidden();
  const before = await page.evaluate(() => JSON.stringify([
    gameState.reviewMode, gameState.wordStates, gameState.srsData,
    localStorage.getItem('vocabGame_illustrationAlwaysVisible'),
    document.getElementById('illustrationAlwaysVisible').checked,
  ]));
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementList details')).toHaveCount(6);
  for (const id of retiredIds) {
    await expect(page.locator(`details[data-announcement-id="${id}"]`)).toHaveCount(0);
  }
  const card = page.locator(`details[data-announcement-id="${alwaysVisibleId}"]`);
  await expect(card.locator('.announcement-detail')).toBeHidden();
  await card.locator('summary').click();
  await expect(card.locator('.announcement-detail')).toBeVisible();
  await expect(card).toContainText('初期設定はオフ');
  await expect(card).toContainText('「その他」→「出題・復習設定」→「表示」');
  await expect(card).toContainText('「イラストを常時表示」をオン');
  await expect(card).toContainText('「常時表示中」');
  await expect(card).toContainText('押すと表示設定を開けます');
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 5件');
  expect(await page.evaluate(id => {
    const item = APP_ANNOUNCEMENTS.find(item => item.id === id);
    return Boolean(item.featured || item.autoOpenOnce);
  }, alwaysVisibleId)).toBe(false);
  expect(await page.evaluate(() => JSON.stringify([
    gameState.reviewMode, gameState.wordStates, gameState.srsData,
    localStorage.getItem('vocabGame_illustrationAlwaysVisible'),
    document.getElementById('illustrationAlwaysVisible').checked,
  ]))).toBe(before);
  await page.screenshot({ path: testInfo.outputPath('always-visible-announcement.png') });
  await page.locator('#announcementMarkAllRead').click();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  await page.reload();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});

test('お知らせは削除記事の個別既読だけを除き、新しい常時表示だけ未読にする', async ({ page }) => {
  await page.addInitScript(ids => {
    if (!localStorage.getItem('announcementReadSeeded')) {
      localStorage.setItem('vocabGame_readAnnouncementIds_v1', JSON.stringify(ids));
      localStorage.setItem('announcementReadSeeded', 'true');
    }
  }, ['2026-10-04-my-wordbooks', '2026-10-04-noun-illustrations-complete', ...retiredIds, ...olderIds]);
  await page.goto('/index.html');
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 1件');
  await expect(page.locator('#announcementList .announcement-card.is-unread')).toHaveCount(1);
  await expect(page.locator('#announcementList .announcement-card.is-unread')).toHaveAttribute('data-announcement-id', alwaysVisibleId);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_readAnnouncementIds_v1')))).toEqual([
    '2026-10-04-my-wordbooks', '2026-10-04-noun-illustrations-complete', ...olderIds,
  ]);
  await page.locator(`details[data-announcement-id="${alwaysVisibleId}"] summary`).click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('すべて既読です');
  await page.reload();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});

for (const legacyId of retiredIds) {
  test(`旧既読は削除した記事 ${legacyId} からも古い記事だけを引き継ぐ`, async ({ page }) => {
    await page.addInitScript(id => {
      if (!localStorage.getItem('announcementLegacySeeded')) {
        localStorage.setItem('vocabGame_lastReadAnnouncementId', id);
        localStorage.setItem('announcementLegacySeeded', 'true');
      }
    }, legacyId);
    await page.goto('/index.html');
    await page.locator('#announcementBtn').click();
    await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_readAnnouncementIds_v1')))).toEqual(olderIds);
    await page.reload();
    await page.locator('#announcementBtn').click();
    await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
  });
}
