const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');
});

test('旧分類を引き継ぎ、過去の失敗数に依存せず10回で再判定する', async ({ page }) => {
  const result = await page.evaluate(() => {
    gameState.masteryThreshold = 90;
    gameState.wordStates.old = 'weak';
    gameState.srsData.old = { successCount: 0, failCount: 100, dueAt: 123, reviewStep: 0 };
    gameState.wordStates.perfectOld = 'perfect';
    gameState.srsData.perfectOld = { successCount: 5, failCount: 0, dueAt: 456 };
    migrateRecentReviewHistory();
    const unchanged = [gameState.wordStates.old, gameState.wordStates.perfectOld, gameState.srsData.old.dueAt, gameState.srsData.old.recentAnswers.length];
    for (let i = 0; i < 9; i++) updateSrsForWord('old', true, 'weak');
    const ninth = deriveStateFromAccuracy('old');
    updateSrsForWord('old', true, 'weak');
    const tenth = deriveStateFromAccuracy('old');
    updateSrsForWord('old', false, 'perfect');
    const failed = deriveStateFromAccuracy('old');
    updateSrsForWord('old', true, 'weak');
    const recovered = deriveStateFromAccuracy('old');
    updateSrsForWord('perfectOld', false, 'perfect');
    return { unchanged, ninth, tenth, failed, recovered,
      oldPerfectFailed: deriveStateFromAccuracy('perfectOld'),
      length: gameState.srsData.old.recentAnswers.length, fails: gameState.srsData.old.failCount };
  });
  expect(result).toEqual({ unchanged: ['weak', 'perfect', 123, 0], ninth: 'weak', tenth: 'perfect', failed: 'weak', recovered: 'perfect', oldPerfectFailed: 'weak', length: 10, fails: 101 });
});

test('新規語の早すぎる完璧判定を防ぎ、100%は直近全問正解で到達する', async ({ page }) => {
  const result = await page.evaluate(() => {
    gameState.masteryThreshold = 100;
    gameState.wordStates.fresh = 'unlearned';
    updateSrsForWord('fresh', true, 'unlearned');
    const first = deriveStateFromAccuracy('fresh');
    updateSrsForWord('fresh', false, 'learned');
    for (let i = 0; i < 9; i++) updateSrsForWord('fresh', true, 'learned');
    const nine = deriveStateFromAccuracy('fresh');
    updateSrsForWord('fresh', true, 'learned');
    return { first, nine, ten: deriveStateFromAccuracy('fresh'), totalFails: gameState.srsData.fresh.failCount };
  });
  expect(result).toEqual({ first: 'learned', nine: 'learned', ten: 'perfect', totalFails: 1 });
});

test('判定回数と正解数を即時保存し、履歴と現在の問題を保持する', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    startLearningSession();
    const word = gameState.currentWord;
    const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
    gameState.wordStates[key] = 'perfect';
    gameState.srsData[key] = { successCount: 8, failCount: 2, dueAt: 123, recentAnswers: [false, false, ...Array(8).fill(true)] };
    window.testMasteryKey = key;
    saveGame();
    openStudyModeModal();
  });
  const wordBefore = await page.locator('#vocabWord').textContent();
  await page.locator('[data-mastery-threshold="90"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabClickerSave')).masteryThreshold)).toBe(90);
  await expect(page.locator('#masteryChangePreview')).toContainText('復習対象へ 1語');
  await expect(page.getByRole('button', { name: '判定基準を適用', exact: true })).toHaveCount(0);
  await page.locator('[data-review-window="5"]').click();
  await expect(page.locator('[data-mastery-threshold="90"]')).toBeHidden();
  await expect(page.locator('#masteryThresholdExplanation')).toHaveText('直近5回で5回以上正解（100%）');
  await expect(page.locator('#masteryChangePreview')).toContainText('5回では90%を選べない');
  await page.locator('[data-mastery-threshold="80"]').click();
  await expect(page.locator('#masteryThresholdExplanation')).toHaveText('直近5回で4回以上正解（80%）');
  await page.screenshot({ path: `screenshots/recent-review-${testInfo.project.name}.png` });
  const saved = await page.evaluate(() => {
    const key = window.testMasteryKey;
    const data = JSON.parse(localStorage.getItem('vocabClickerSave'));
    return { threshold: data.masteryThreshold, size: data.reviewWindowSize, state: data.wordStates[key], due: data.srsData[key].dueAt, recent: data.srsData[key].recentAnswers.length };
  });
  expect(saved).toEqual({ threshold: 80, size: 5, state: 'perfect', due: 123, recent: 10 });
  await page.locator('.mastery-settings').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByRole('button', { name: '出題モードを閉じる', exact: true })).toBeInViewport();
  await page.screenshot({ path: `screenshots/recent-review-${testInfo.project.name}-lower.png` });
  await page.getByRole('button', { name: '出題モードを閉じる', exact: true }).click();
  expect(await page.locator('#vocabWord').textContent()).toBe(wordBefore);
  await page.reload();
  expect(await page.evaluate(() => [gameState.reviewWindowSize, gameState.masteryThreshold])).toEqual([5, 80]);
  await page.evaluate(() => openStudyModeModal());
  await page.locator('[data-review-window="10"]').click();
  await expect(page.locator('#masteryThresholdExplanation')).toHaveText('直近10回で8回以上正解（80%）');
});

test('5回の判定・10回へ戻した履歴不足・保存失敗を扱う', async ({ page }) => {
  const dialogPromise = page.waitForEvent('dialog');
  const result = await page.evaluate(() => {
    gameState.wordStates.k = 'weak';
    gameState.srsData.k = { recentAnswers: [true, true, true, true, true], legacyReviewState: 'weak', dueAt: 123, successCount: 5 };
    selectReviewWindow(5);
    const five = gameState.wordStates.k;
    selectReviewWindow(10);
    const ten = gameState.wordStates.k;
    const length = gameState.srsData.k.recentAnswers.length;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('test quota'); };
    selectReviewWindow(5);
    Storage.prototype.setItem = original;
    return { five, ten, length, sizeAfterFailure: gameState.reviewWindowSize, stateAfterFailure: gameState.wordStates.k };
  });
  expect(result).toEqual({ five: 'perfect', ten: 'learned', length: 5, sizeAfterFailure: 10, stateAfterFailure: 'learned' });
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('学習データを端末に保存できませんでした');
  await dialog.dismiss();
});

test('クラウド圧縮は直近履歴・移行状態・基準を欠落させない', async () => {
  const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
  const start = source.indexOf('function buildCloudSaveData(');
  const end = source.indexOf('\nfunction hasCloudSaveData(', start);
  const context = vm.createContext({ console });
  vm.runInContext(source.slice(start, end), context);
  const raw = { reviewTiming: 'long', reviewWindowSize: 5, masteryThreshold: 100, wordStates: { a: 'perfect' }, srsData: { a: { successCount: 8, failCount: 2, recentAnswers: [true, false], legacyReviewState: 'perfect', dueAt: 234 } } };
  const result = JSON.parse(context.buildCloudSaveData(JSON.stringify(raw)));
  expect(result.masteryThreshold).toBe(100);
  expect(result.reviewWindowSize).toBe(5);
  expect(result.reviewTiming).toBe('long');
  expect(result.srsData.a).toMatchObject(raw.srsData.a);
});

test('回答を戻すと直近履歴・分類・復習予定も元に戻る', async ({ page }) => {
  const result = await page.evaluate(() => {
    startLearningSession();
    const word = gameState.currentWord;
    const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
    gameState.wordStates[key] = 'learned';
    gameState.srsData[key] = { successCount: 4, failCount: 10, recentAnswers: [true, false], dueAt: 123, reviewStep: 1 };
    const before = JSON.stringify(gameState.srsData[key]);
    saveState();
    updateSrsForWord(key, true, 'learned');
    gameState.wordStates[key] = deriveStateFromAccuracy(key);
    undoLastAction();
    return { same: JSON.stringify(gameState.srsData[key]) === before, state: gameState.wordStates[key] };
  });
  expect(result).toEqual({ same: true, state: 'learned' });
});
