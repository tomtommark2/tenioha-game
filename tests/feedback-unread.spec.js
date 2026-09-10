const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
});

test('ひとこと新着の赤点は投稿・返信を検知し、閲覧の既読を再読込後も保つ', async ({ page }, testInfo) => {
  const post = { id: 'a', text: '表示確認用', nickname: '利用者', createdAt: 10, status: 'received', thread: [] };
  await page.route('**/*cloudfunctions.net/feedback', route => route.fulfill({ json: { items: [post] } }));
  await page.goto('/index.html');
  await expect(page.locator('#feedbackMenuDot')).toBeVisible();
  const menuDot = await page.locator('#feedbackMenuDot').boundingBox();
  const menuButton = await page.locator('#topActionMenuBtn').boundingBox();
  expect(menuDot.x).toBeGreaterThan(menuButton.x);
  expect(menuDot.x + menuDot.width).toBeLessThan(menuButton.x + menuButton.width);
  expect(menuDot.y).toBeGreaterThan(menuButton.y);
  expect(menuDot.y + menuDot.height).toBeLessThan(menuButton.y + menuButton.height);
  await page.locator('#topActionMenuBtn').click();
  await expect(page.locator('#feedbackUnreadDot')).toBeVisible();
  const dot = await page.locator('#feedbackUnreadDot').boundingBox();
  const button = await page.locator('#feedbackOpenBtn').boundingBox();
  expect(dot.x).toBeGreaterThan(button.x + button.width / 2);
  expect(dot.y).toBeLessThan(button.y + button.height / 2);
  await page.screenshot({ path: testInfo.outputPath('feedback-unread.png') });
  await page.locator('#feedbackOpenBtn').click();
  await expect(page.locator('#feedbackList')).toContainText('表示確認用');
  await expect(page.locator('#feedbackMenuDot')).toBeHidden();
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_feedbackSeen_v1')).a)).toBeTruthy();
  await expect(page.locator('#feedbackMenuDot')).toBeHidden();
  post.thread.push({ id: 'reply', role: 'operator', text: '返信の表示例', createdAt: 20 });
  await page.reload();
  await expect(page.locator('#feedbackMenuDot')).toBeVisible();
  await page.evaluate(() => openFeedback());
  await expect(page.locator('#feedbackList')).toContainText('返信の表示例');
  await expect(page.locator('#feedbackMenuDot')).toBeHidden();
  const saved = await page.evaluate(() => localStorage.getItem('vocabGame_feedbackSeen_v1'));
  expect(saved).not.toContain('返信の表示例');
  expect(saved).not.toContain('利用者');
});

test('ひとこと新着は失敗時や読込前に閉じた時に既読にしない', async ({ page }) => {
  let fail = false;
  let pending;
  await page.route('**/*cloudfunctions.net/feedback', route => {
    if (pending) return new Promise(resolve => { pending.resolve = () => { route.fulfill({ json: { items: [{ id: 'a', createdAt: 1, text: '表示例', thread: [] }] } }).then(resolve); }; });
    return route.fulfill(fail ? { status: 503, json: { error: '接続失敗' } } : { json: { items: [{ id: 'a', createdAt: 1, text: '表示例', thread: [] }] } });
  });
  await page.goto('/index.html');
  await expect(page.locator('#feedbackMenuDot')).toBeVisible();
  fail = true;
  await page.evaluate(() => openFeedback());
  await expect(page.locator('#feedbackMessage')).toHaveText('接続失敗');
  await expect(page.locator('#feedbackMenuDot')).toBeVisible();
  fail = false;
  pending = {};
  await page.locator('#feedbackRefresh').click();
  await expect.poll(() => !!pending.resolve).toBe(true);
  await page.locator('#feedbackClose').click();
  pending.resolve();
  await expect(page.locator('#feedbackList')).toContainText('表示例');
  expect(await page.evaluate(() => localStorage.getItem('vocabGame_feedbackSeen_v1'))).toBeNull();
  await expect(page.locator('#feedbackMenuDot')).toBeVisible();
});
