const { test, expect } = require('@playwright/test');

const storageKey = 'vocabGame_reviewQueueShuffle_v1';
const shuffleName = '復習キューの残り順をシャッフルして、この端末に保存する';
const pageErrors = new WeakMap();

test.beforeEach(async ({ page, context }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    const host = url.hostname;
    if (['localhost', '127.0.0.1'].includes(host)) return route.continue();
    if (host === 'us-central1-tenioha-game.cloudfunctions.net' && url.pathname === '/feedback') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify({ items: [], isAdmin: false }) });
    }
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => {
    // Reloads can interrupt WebKit's cross-origin preflight. This suite tests
    // local queue persistence, so keep the unrelated public feedback list in-process.
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.url || String(input);
      if (url === 'https://us-central1-tenioha-game.cloudfunctions.net/feedback') {
        return Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_skipLiveTutorial', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

async function prepare(page, url = '/index.html') {
  await page.goto(url);
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  return page.evaluate(() => {
    const words = vocabularyDatabase.basic.slice(0, 6);
    gameState.currentLevel = 'basic';
    persistLastLevel('basic');
    gameState.currentMode = 'unlearned';
    gameState.reviewMode = 'on';
    gameState.activeReviewLevels = ['basic'];
    gameState.currentWord = null;
    gameState.isReviewWord = false;
    gameState.wordStates = {};
    gameState.srsData = {};
    gameState.decks = null;
    resetReviewQueueShuffleOrder();
    speechSettings.autoRead = false;
    words.forEach((word, index) => {
      const key = getWordKeySafe(word, 'basic');
      gameState.wordStates[key] = 'weak';
      gameState.srsData[key] = { dueAt: Date.now() - 10000 + index, reviewStep: 1,
        scheduledIntervalDays: 1, recentAnswers: [false], successCount: 0, failCount: 1 };
    });
    invalidateLearningProgressSnapshot();
    const snapshot = buildReviewQueueSnapshot();
    updateReviewProgressUI(snapshot);
    saveGame();
    window.shuffleTestKeys = words.map(word => getWordKeySafe(word, 'basic'));
    return snapshot.dueWords.map(word => word.word);
  });
}
const queue = page => page.locator('#reviewQueuePreview .review-queue-chip').allTextContents();

for (const entry of ['index.html', 'vocab_clicker_game.html']) {
  test(`復習シャッフル：${entry}は同じ順番を再読み込み後に出題する`, async ({ page }, testInfo) => {
    if (entry === 'index.html') await page.setViewportSize({ width: 320, height: 740 });
    const initial = await prepare(page, `/${entry}`);
    const writes = [];
    page.on('request', request => {
      if (request.method() !== 'GET' && !request.url().endsWith('/feedback')) writes.push(request.url());
    });
    const savedGame = await page.evaluate(() => localStorage.getItem('vocabClickerSave'));
    await page.locator('#reviewQueueShuffleButton').click();
    const shuffled = await queue(page);
    expect(shuffled).not.toEqual(initial);
    expect(await page.evaluate(() => localStorage.getItem('vocabClickerSave'))).toBe(savedGame);
    expect(writes).toEqual([]);
    const storedKeys = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).order, storageKey);
    await page.reload();
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    expect(await queue(page)).toEqual(shuffled);
    expect(await page.evaluate(() => gameState.reviewQueueWasShuffled)).toBe(true);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).order, storageKey)).toEqual(storedKeys);
    await page.locator('#vocabCard').click();
    await expect.poll(() => page.evaluate(() => gameState.currentWord.word)).toBe(shuffled[0]);
    await page.locator('#vocabCard').click();
    await expect.poll(() => page.evaluate(() => gameState.currentWord.word)).toBe(shuffled[1]);
    expect(await queue(page)).toEqual(shuffled.slice(1));
    const remainingKeys = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).order, storageKey);
    await page.reload();
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    expect(await queue(page)).toEqual(shuffled.slice(1));
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).order, storageKey)).toEqual(remainingKeys);
    await page.locator('#vocabCard').click();
    await expect.poll(() => page.evaluate(() => gameState.currentWord.word)).toBe(shuffled[1]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (entry === 'index.html') await page.screenshot({ path: `screenshots/review-shuffle-20261014-${testInfo.project.name}-320.png` });
  });
}

test('復習シャッフル：表示中の問題・期限・配点を変えず、Undoでも順番を保存する', async ({ page }) => {
  await prepare(page);
  await page.locator('#reviewQueueShuffleButton').click();
  await page.locator('#vocabCard').click();
  const current = await page.evaluate(() => gameState.currentWord.word);
  const unchanged = await page.evaluate(() => JSON.stringify({ srs: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount }));
  await page.locator('#reviewQueueShuffleButton').click();
  expect(await page.evaluate(() => gameState.currentWord.word)).toBe(current);
  expect(await page.evaluate(() => JSON.stringify({ srs: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount }))).toBe(unchanged);
  const shuffled = await queue(page);
  expect(shuffled[0]).toBe(current);
  await page.locator('#vocabCard').click();
  await expect.poll(() => page.evaluate(() => gameState.currentWord.word)).toBe(shuffled[1]);
  await page.locator('#undoBtn').click();
  await expect.poll(() => page.evaluate(() => gameState.currentWord.word)).toBe(current);
  expect(await queue(page)).toEqual(shuffled);
  await page.reload();
  expect(await queue(page)).toEqual(shuffled);
});

test('復習シャッフル：設定内の入口から保存し、保存失敗時は順番を保持する', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => openStudyModeModal());
  await page.getByRole('tab', { name: '復習', exact: true }).click();
  await expect(page.locator('#studyModeShuffleButton')).toHaveText('シャッフル');
  await page.getByRole('tabpanel', { name: '復習', exact: true }).getByRole('button', { name: shuffleName, exact: true }).click();
  await expect(page.locator('#studyModeShuffleStatus')).toContainText('シャッフルして保存しました');
  const before = await page.evaluate(key => ({ raw: localStorage.getItem(key), order: [...gameState.reviewQueueShuffleOrder] }), storageKey);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, storageKey);
  await page.locator('#studyModeShuffleButton').click();
  await expect(page.locator('#studyModeShuffleStatus')).toHaveText('並び順を保存できませんでした');
  expect(await page.evaluate(key => ({ raw: localStorage.getItem(key), order: [...gameState.reviewQueueShuffleOrder] }), storageKey)).toEqual(before);
});

test('復習シャッフル：範囲の変更とログアウトのデータリセットで保存順を解除する', async ({ page }) => {
  await prepare(page);
  await page.locator('#reviewQueueShuffleButton').click();
  expect(await page.evaluate(key => Boolean(localStorage.getItem(key)), storageKey)).toBe(true);
  await page.evaluate(() => openStudyModeModal());
  await page.locator('summary').filter({ hasText: '出題範囲' }).click();
  await page.locator('[data-review-level="daily"]').check();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.evaluate(() => closeStudyModeModal());
  await page.locator('#reviewQueueShuffleButton').click();
  await page.evaluate(() => resetGameData());
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  expect(await page.evaluate(() => gameState.reviewQueueWasShuffled)).toBe(false);
});

test('復習シャッフル：キューを消化した後のUndoでも最後の語の順番を復元する', async ({ page }) => {
  await prepare(page);
  await page.locator('#reviewQueueShuffleButton').click();
  const shuffled = await queue(page);
  await page.locator('#vocabCard').click();
  for (const word of shuffled) {
    await expect.poll(() => page.evaluate(() => gameState.currentWord.word)).toBe(word);
    await page.locator('#vocabCard').click();
  }
  expect(await queue(page)).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  // The empty screen can hide the example area containing Undo; check its restore path directly.
  await page.evaluate(() => undoLastAction());
  expect(await queue(page)).toEqual([shuffled.at(-1)]);
  await expect(page.locator('#vocabWord .word-text-main')).toHaveText(shuffled.at(-1));
  await page.reload();
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  expect(await queue(page)).toEqual([shuffled.at(-1)]);
});
