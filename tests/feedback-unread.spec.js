const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
  });
});

test('ひとこと新着の赤点は投稿・返信を検知し、閲覧の既読を再読込後も保つ', async ({ page }, testInfo) => {
  const post = { id: 'a', text: '表示確認用', nickname: '利用者', createdAt: 10, status: 'received', thread: [] };
  await page.route('**/*cloudfunctions.net/feedback', route => route.fulfill({ json: { items: [post] } }));
  await page.goto('/index.html');
  await page.evaluate(() => markAllAnnouncementsRead());
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementBtn')).toHaveAttribute('aria-label', 'ひとことに新着があります');
  const bellDot = await page.locator('#announcementUnreadDot').boundingBox();
  const bellButton = await page.locator('#announcementBtn').boundingBox();
  expect(bellDot.x).toBeGreaterThan(bellButton.x);
  expect(bellDot.x + bellDot.width).toBeLessThan(bellButton.x + bellButton.width);
  expect(bellDot.y).toBeGreaterThan(bellButton.y);
  expect(bellDot.y + bellDot.height).toBeLessThan(bellButton.y + bellButton.height);
  await page.locator('#topActionMenuBtn').click();
  await expect(page.locator('#topActionMenuBtn')).toHaveAttribute('aria-label', '管理メニュー');
  await expect(page.locator('#feedbackMenuDot, #feedbackOpenBtn, #feedbackUnreadDot')).toHaveCount(0);
  await expect(page.locator('#helpModal').getByRole('button', { name: /ひとこと送る/ })).toHaveCount(0);
  await page.getByRole('button', { name: '管理メニューを閉じる', exact: true }).click();
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('すべて既読です');
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  const dot = await page.locator('#announcementFeedbackDot').boundingBox();
  const button = await page.locator('#announcementFeedbackBtn').boundingBox();
  expect(dot.x).toBeGreaterThan(button.x);
  expect(dot.x + dot.width).toBeLessThan(button.x + button.width);
  expect(dot.y).toBeGreaterThan(button.y);
  expect(dot.y + dot.height).toBeLessThan(button.y + button.height);
  await page.screenshot({ path: testInfo.outputPath('feedback-unread.png') });
  await page.locator('#announcementFeedbackBtn').click();
  await expect(page.locator('#feedbackList')).toContainText('表示確認用');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  await page.locator('#feedbackClose').click();
  await expect(page.locator('#announcementFeedbackBtn')).toBeFocused();
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_feedbackSeen_v1')).a)).toBeTruthy();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  post.thread.push({ id: 'reply', role: 'operator', text: '返信の表示例', createdAt: 20 });
  await page.reload();
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await page.locator('#announcementBtn').click();
  await page.locator('#announcementFeedbackBtn').click();
  await expect(page.locator('#feedbackList')).toContainText('返信の表示例');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  const saved = await page.evaluate(() => localStorage.getItem('vocabGame_feedbackSeen_v1'));
  expect(saved).not.toContain('返信の表示例');
  expect(saved).not.toContain('利用者');
  post.status = 'done';
  await page.reload();
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
});

test('ひとこと新着は失敗時や読込前に閉じた時に既読にしない', async ({ page }) => {
  let fail = false;
  let pending;
  await page.route('**/*cloudfunctions.net/feedback', route => {
    if (pending) return new Promise(resolve => { pending.resolve = () => { route.fulfill({ json: { items: [{ id: 'a', createdAt: 1, text: '表示例', thread: [] }] } }).then(resolve); }; });
    return route.fulfill(fail ? { status: 503, json: { error: '接続失敗' } } : { json: { items: [{ id: 'a', createdAt: 1, text: '表示例', thread: [] }] } });
  });
  await page.goto('/index.html');
  await page.evaluate(() => markAllAnnouncementsRead());
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  fail = true;
  await page.locator('#announcementBtn').click();
  await page.locator('#announcementFeedbackBtn').click();
  await expect(page.locator('#feedbackMessage')).toHaveText('接続失敗');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  fail = false;
  pending = {};
  await page.locator('#feedbackRefresh').click();
  await expect.poll(() => !!pending.resolve).toBe(true);
  await page.locator('#feedbackClose').click();
  pending.resolve();
  await expect(page.locator('#feedbackList')).toContainText('表示例');
  expect(await page.evaluate(() => localStorage.getItem('vocabGame_feedbackSeen_v1'))).toBeNull();
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
});

test('ひとこと新着：ベルは両方の未読を合算し、片方の既読で他方を消さない', async ({ page }) => {
  const post = { id: 'combined', text: '通知確認用', nickname: '確認用', createdAt: 10, thread: [] };
  await page.route('**/*cloudfunctions.net/feedback', route => route.fulfill({ json: { items: [post] } }));
  await page.goto('/index.html');
  await expect(page.locator('#announcementFeedbackDot')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#announcementBtn')).toHaveAttribute('aria-label', '未読のお知らせとひとことの新着があります');
  const before = await page.evaluate(() => JSON.stringify([gameState.wordStates, gameState.srsData, gameState.myWordbooks, gameState.reviewMode]));
  await page.locator('#announcementBtn').click();
  await page.locator('#announcementMarkAllRead').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('すべて既読です');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementBtn')).toHaveAttribute('aria-label', 'ひとことに新着があります');
  await page.locator('#announcementFeedbackBtn').click();
  await expect(page.locator('#feedbackList')).toContainText('通知確認用');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  await expect(page.locator('#announcementBtn')).toHaveAttribute('aria-label', 'お知らせ');
  await page.locator('#feedbackClose').click();
  // A second tab changes only the announcement read preference; feedback stays read.
  const other = await page.context().newPage();
  const origin = new URL(page.url()).origin;
  await other.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await other.goto('/index.html');
  await other.evaluate(() => localStorage.setItem('vocabGame_readAnnouncementIds_v1', '[]'));
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementBtn')).toHaveAttribute('aria-label', '未読のお知らせがあります');
  await expect(page.locator('#announcementFeedbackDot')).toBeHidden();
  await page.locator('#announcementFeedbackBtn').click();
  await expect(page.locator('#feedbackList')).toContainText('通知確認用');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await expect(page.locator('#announcementBtn')).toHaveAttribute('aria-label', '未読のお知らせがあります');
  expect(await page.evaluate(() => JSON.stringify([gameState.wordStates, gameState.srsData, gameState.myWordbooks, gameState.reviewMode]))).toBe(before);
  await other.close();
});

test('ひとこと新着：閲覧後に遅い背景取得が戻ってもベルの既読を戻さない', async ({ page }) => {
  let finishBackground;
  let calls = 0;
  const oldPost = { id: 'late', text: '遅延確認用', nickname: '確認用', createdAt: 10, thread: [] };
  const currentPost = { ...oldPost, thread: [{ id: 'reply', role: 'operator', text: '新しい返信', createdAt: 20 }] };
  await page.route('**/*cloudfunctions.net/feedback', async route => {
    calls++;
    if (calls === 1) {
      await new Promise(resolve => { finishBackground = resolve; });
      await route.fulfill({ json: { items: [oldPost] } });
    } else await route.fulfill({ json: { items: [currentPost] } });
  });
  await page.goto('/index.html');
  await page.evaluate(() => markAllAnnouncementsRead());
  await expect.poll(() => !!finishBackground).toBe(true);
  await page.locator('#announcementBtn').click();
  await page.locator('#announcementFeedbackBtn').click();
  await expect(page.locator('#feedbackList')).toContainText('新しい返信');
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
  const backgroundDone = page.waitForResponse(response => response.url().endsWith('/feedback'));
  finishBackground();
  await backgroundDone;
  await page.locator('#feedbackClose').click();
  await expect(page.locator('#announcementFeedbackDot')).toBeHidden();
  await expect(page.locator('#announcementUnreadDot')).toBeHidden();
});
