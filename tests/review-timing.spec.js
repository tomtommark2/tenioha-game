const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).not.toContainText('ファイルを読み込んでください');
});

test('復習タイミングは即時保存し予定済みの日時を変えない', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    startLearningSession();
    const word = gameState.currentWord;
    window.timingTestKey = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
    gameState.wordStates[window.timingTestKey] = 'weak';
    gameState.srsData[window.timingTestKey] = { dueAt: 123, reviewStep: 2, scheduledIntervalDays: 3, successCount: 1 };
    openStudyModeModal();
  });
  await page.getByText('判定のしくみ', { exact: true }).click();
  await page.getByRole('button', { name: '復習タイミングを確認・変更' }).click();
  await expect(page.locator('#reviewTimingSettings')).toHaveAttribute('open', '');
  await expect(page.locator('#reviewTimingExample')).toContainText('約1日後');
  await page.locator('[data-review-timing="short"]').click();
  await expect(page.locator('#reviewTimingExample')).toContainText('約12時間後');
  await expect(page.locator('#reviewTimingIntervals')).toHaveText('12時間 → 1.5日 → 3.5日 → 7日 → 15日 → 30日');
  await expect(page.locator('#reviewTimingStatus')).toContainText('保存しました');
  expect(await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vocabClickerSave'));
    return [data.reviewTiming, data.srsData[window.timingTestKey].dueAt, data.srsData[window.timingTestKey].reviewStep];
  })).toEqual(['short', 123, 2]);
  await page.locator('#reviewTimingSettings').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `screenshots/review-timing-${testInfo.project.name}.png` });
  await expect(page.getByRole('button', { name: '出題モードを閉じる', exact: true })).toBeInViewport();
  await page.reload();
  expect(await page.evaluate(() => gameState.reviewTiming)).toBe('short');
  await page.evaluate(() => { openStudyModeModal(); openReviewTimingSettings(); });
  await page.locator('[data-review-timing="long"]').click();
  await expect(page.locator('#reviewTimingExample')).toContainText('約2日後');
  await page.locator('[data-review-timing="standard"]').click();
  await expect(page.locator('#reviewTimingExample')).toContainText('約1日後');
});

test('復習タイミングの倍率・再学習・配点・旧保存の互換性', async ({ page }) => {
  const result = await page.evaluate(() => {
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    const rows = [];
    try {
      for (const timing of ['short', 'standard', 'long']) {
        gameState.reviewTiming = timing;
        const steps = [];
        for (let step = 0; step < 6; step++) {
          const key = `timing-${timing}-${step}`;
          gameState.srsData[key] = { reviewStep: step };
          updateSrsForWord(key, true, 'weak');
          const s = gameState.srsData[key];
          steps.push({ days: (s.dueAt - s.lastReviewedAt) / 86400000, nominal: getPreviousReviewIntervalDays(s), points: calculateReviewEventPoints('scheduled-correct', getPreviousReviewIntervalDays(s)) });
          updateSrsForWord(key, false, 'learned');
          if (s.dueAt - s.lastReviewedAt !== 300000 || !s.isRelearning) throw Error('relearning changed');
        }
        rows.push(steps);
      }
    } finally { Math.random = originalRandom; }
    const data = buildLocalSaveData();
    delete data.reviewTiming;
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
    loadGame();
    const missing = gameState.reviewTiming;
    data.reviewTiming = 'invalid';
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
    loadGame();
    return { rows, missing, invalid: gameState.reviewTiming };
  });
  for (let i = 0; i < 3; i++) {
    expect(result.rows[i].map(s => s.days)).toEqual([1, 3, 7, 14, 30, 60].map(d => d * [0.5, 1, 2][i]));
    expect(result.rows[i].map(s => s.nominal)).toEqual([1, 3, 7, 14, 30, 60]);
    expect(result.rows[i].map(s => s.points)).toEqual([3, 3, 4, 5, 6, 7]);
  }
  expect(result.missing).toBe('standard');
  expect(result.invalid).toBe('standard');
});

test('復習タイミングの保存失敗時は設定を戻す', async ({ page }) => {
  page.on('dialog', dialog => dialog.dismiss());
  await page.evaluate(() => {
    openStudyModeModal();
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw Error('test quota'); };
    try { selectReviewTiming('long'); } finally { Storage.prototype.setItem = original; }
  });
  expect(await page.evaluate(() => gameState.reviewTiming)).toBe('standard');
  await expect(page.locator('#reviewTimingStatus')).toContainText('変更前の設定に戻しました');
});
