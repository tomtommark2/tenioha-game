const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    if (!localStorage.getItem('vocabGame_lastAutoShownAnnouncementId')) {
      localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
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
  // Wait for the modal's initial focus before moving it to the article.
  await expect(page.locator('#announcementModal .announcement-close-btn')).toBeFocused();
  const count = await page.evaluate(() => APP_ANNOUNCEMENTS.length);
  await expect(page.locator('#announcementReadStatus')).toHaveText(`未読 ${count}件`);
  await expect(page.locator('details[open]')).toHaveCount(0);
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await page.screenshot({ path: `screenshots/announcements-v2-${testInfo.project.name}-list.png` });
  const first = page.locator('#announcementList details').first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  await expect(first.getByRole('heading', { name: '学習履歴への影響' })).toBeVisible();
  await expect(page.locator('#announcementReadStatus')).toHaveText(`未読 ${count - 1}件`);
  await page.screenshot({ path: `screenshots/announcements-v2-${testInfo.project.name}-detail.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('#announcementModal')).toBeHidden();
  await expect(page.locator('#announcementBtn')).toBeFocused();
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  await expect(page.locator('#announcementReadStatus')).toHaveText(`未読 ${count - 1}件`);
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
  await expect(page.locator('#announcementReadStatus')).toHaveText(`未読 ${await page.evaluate(() => APP_ANNOUNCEMENTS.length)}件`);
});

test('大型告知の操作はその記事だけ既読にし、他のお知らせを既読にしない', async ({ page }) => {
  await page.goto('/index.html?announcementPreview=1');
  await expect(page.locator('#announcementModal')).toHaveClass(/is-featured-mode/);
  await expect(page.locator('#announcementReadTools')).toBeHidden();
  await page.locator('#announcementPrimaryAction').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_readAnnouncementIds_v1')))).toEqual(['2026-10-04-noun-illustrations-complete']);
  await expect(page.locator('#illustratedWordbookModal')).toBeVisible();
  await expect(page.locator('#leaderboardModal')).toBeHidden();
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
});

test('旧イラスト告知を確認済みでも完成リマインドは一度表示し、あとでは未読を残す', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    if (!localStorage.getItem('announcementUpgradeSeeded')) {
      localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-09-11-illustrated-wordbook');
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
  await expect(page.locator('#announcementList')).toContainText('すべての収録名詞にイラストがつきました！');
  await expect(page.locator('.announcement-illustration-preview')).toBeHidden();
  await page.locator('#announcementList summary').click();
  await expect(page.locator('#announcementList')).toContainText('固定100語');
  await expect(page.locator('.announcement-illustration-preview img')).toHaveCount(3);
  await expect.poll(() => page.locator('.announcement-illustration-preview img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('illustrated-announcement.png') });
  await page.getByRole('button', { name: 'あとで', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('vocabGame_lastAutoShownAnnouncementId'))).toBe('2026-10-04-noun-illustrations-complete');
  await expect(page.locator('#announcementUnreadDot')).toBeVisible();
  await page.reload();
  expect(await page.evaluate(() => {
    isDeveloperPreviewMode = () => false;
    return shouldAutoOpenFeaturedAnnouncement(getFeaturedAnnouncement());
  })).toBe(false);
  await expect(page.locator('#announcementModal')).toBeHidden();
  await page.locator('#announcementBtn').click();
  const reminder = page.locator('details[data-announcement-id="2026-10-04-noun-illustrations-complete"]');
  await reminder.locator('summary').click();
  await expect(reminder).toContainText('「単語帳から選ぶ」→「イラスト単語帳」');
  await expect(reminder).toContainText('回答前に見たいとき');
  await expect(reminder).toContainText('リセットされません');
  await expect(reminder).toContainText('4,155語');
  const alwaysVisible = page.locator('details[data-announcement-id="2026-10-04-illustration-always-visible"]');
  await alwaysVisible.locator('summary').click();
  await expect(alwaysVisible).toContainText('「イラストを常時表示」');
});

test('お知らせは日付と見出しだけのコンパクトな一覧から詳細を開ける', async ({ page }, testInfo) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/index.html');
    await page.locator('#announcementBtn').click();
    const first = page.locator('#announcementList details').first();
    await expect(first.locator('.announcement-detail')).toBeHidden();
    await expect(first.locator('summary')).toContainText('2026-10-04');
    await expect(first.locator('summary')).toContainText('マイ単語帳');
    await expect(page.locator('.announcement-excerpt, .announcement-disclosure')).toHaveCount(0);
    expect((await first.boundingBox()).height).toBeLessThan(110);
    const entry = await page.locator('#announcementFeedbackBtn').boundingBox();
    expect(entry.y).toBeLessThan((await first.boundingBox()).y);
    await expect(page.locator('#announcementFeedbackBtn')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`compact-announcements-${width}.png`) });
    await first.locator('summary').click();
    await expect(first.locator('.announcement-detail')).toBeVisible();
    await first.locator('summary').click();
    await expect(first.locator('.announcement-detail')).toBeHidden();
  }
});

test('お知らせはひとことへの移動と戻る・Escape・背景・ブラウザ戻るで状態とフォーカスを保つ', async ({ page }) => {
  const post = { id: 'announcement-nav-test', nickname: '確認用', text: 'テスト用の投稿', createdAt: 10, thread: [] };
  await page.route('**/*cloudfunctions.net/feedback', route => route.fulfill({ json: { items: [post] } }));
  await page.goto('/index.html');
  await page.locator('#announcementBtn').click();
  const first = page.locator('#announcementList details').first();
  await first.locator('summary').click();
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
  const readBefore = await page.evaluate(() => localStorage.getItem('vocabGame_readAnnouncementIds_v1'));
  const saveBefore = await page.evaluate(() => JSON.stringify([gameState.wordStates, gameState.srsData, gameState.myWordbooks, gameState.reviewMode]));
  await expect(page.locator('#announcementFeedbackDot')).toBeVisible();
  const entry = page.locator('#announcementFeedbackBtn');
  for (const close of ['button', 'Escape', 'background']) {
    await entry.click();
    await expect(page.locator('#announcementModal')).toBeHidden();
    await expect(page.locator('#feedbackModal')).toBeVisible();
    await expect(page.locator('#feedbackList')).toContainText('テスト用の投稿');
    await expect(page.locator('#feedbackClose')).toHaveText('お知らせに戻る');
    await expect(page.locator('#feedbackClose')).toBeFocused();
    if (close === 'button') await page.locator('#feedbackClose').click();
    else if (close === 'Escape') await page.keyboard.press('Escape');
    else await page.locator('#feedbackModal').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('#feedbackModal')).toBeHidden();
    await expect(page.locator('#announcementModal')).toBeVisible();
    await expect(entry).toBeFocused();
    await expect(first).toHaveAttribute('open', '');
    await expect(page.locator('#announcementFeedbackDot')).toBeHidden();
  }
  expect(await page.evaluate(() => localStorage.getItem('vocabGame_readAnnouncementIds_v1'))).toBe(readBefore);
  expect(await page.evaluate(() => JSON.stringify([gameState.wordStates, gameState.srsData, gameState.myWordbooks, gameState.reviewMode]))).toBe(saveBefore);
  await entry.click();
  await expect(page.locator('#feedbackModal')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#feedbackModal')).toBeHidden();
  await expect(page.locator('#announcementModal')).toBeHidden();
  await expect(page.locator('#announcementBtn')).toBeFocused();
  await page.locator('#topActionMenuBtn').click();
  await page.locator('#feedbackOpenBtn').click();
  await expect(page.locator('#feedbackClose')).toHaveText('×');
  await page.locator('#feedbackClose').click();
  await expect(page.locator('#feedbackModal')).toBeHidden();
  await expect(page.locator('#announcementModal')).toBeHidden();
});

test('お知らせはマイ単語帳のプレミアム条件と使い方を案内し、過去の既読を保つ', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('announcementLatestSeeded')) {
      localStorage.setItem('vocabGame_lastReadAnnouncementId', '2026-09-11-illustrated-wordbook');
      localStorage.setItem('announcementLatestSeeded', 'true');
    }
  });
  await page.goto('/index.html');
  const before = await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.wordStates, gameState.srsData, gameState.currentLevel]));
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 3件');
  const first = page.locator('#announcementList details').first();
  await expect(first).toHaveAttribute('data-announcement-id', '2026-10-04-my-wordbooks');
  await expect(first).toContainText('プレミアム機能');
  await first.locator('summary').click();
  await expect(first).toContainText('未収録の語は、自分で意味を登録');
  await expect(first).toContainText('復習キュー・苦手・得意・完璧');
  await expect(first).toContainText('「単語帳から選ぶ」→「マイ単語帳」');
  await expect(first).toContainText('「名前の変更・単語帳の削除」');
  await page.screenshot({ path: testInfo.outputPath('my-wordbooks-announcement.png') });
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 2件');
  await expect(page.locator('#announcementList')).not.toContainText('固定20語');
  await expect(page.locator('details[data-announcement-id="2026-09-11-illustrated-wordbook"]')).toHaveCount(0);
  await expect(page.locator('details[data-announcement-id="2026-07-17-review-ranking"] .announcement-read-label')).toHaveText('既読');
  expect(await page.evaluate(() => JSON.stringify([gameState.myWordbooks, gameState.wordStates, gameState.srsData, gameState.currentLevel]))).toBe(before);
  await page.reload();
  await page.locator('#announcementBtn').click();
  await expect(page.locator('#announcementReadStatus')).toHaveText('未読 2件');
  await expect(first.locator('.announcement-read-label')).toHaveText('既読');
});
