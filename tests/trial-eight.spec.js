const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL); url.hostname = 'localhost.';
  await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto(url.href);
});

test('8分の境界・案内・翌日回復が一致する', async ({ page }) => {
  const result = await page.evaluate(() => {
    learningSessionStarted = false;
    trialState.playTimeSeconds = 479; updateTrialUI();
    const before = { blocked: checkTrialLimit(), timer: document.getElementById('trialTimerDisplay').textContent };
    trialState.playTimeSeconds = 480; updateTrialUI();
    const at = { blocked: checkTrialLimit(), timer: document.getElementById('trialTimerDisplay').textContent };
    return { limit: TRIAL_CONFIG.LIMIT_SECONDS, before, at };
  });
  expect(result).toEqual({limit:480,before:{blocked:false,timer:'00:01'},at:{blocked:true,timer:'00:00'}});
  await expect(page.locator('#trialOverlay')).toBeVisible();
  await expect(page.locator('.trial-limit-message')).toContainText('1日8分');
  await expect(page.locator('.trial-limit-time')).toHaveText('本日 08:00 / 08:00');
  await expect(page.locator('.trial-limit-note')).toContainText('翌日に8分');
  await expect(page.locator('.purchase-lead')).toContainText('無料版は1日8分');
  const reset = await page.evaluate(() => {
    trialState.lastPlayDate = '2000-01-01';
    const changed = resetTrialDayIfNeeded(); updateTrialUI();
    return { changed, elapsed:trialState.playTimeSeconds, day:trialState.lastPlayDate, today:getTrialDateKey(), timer:document.getElementById('trialTimerDisplay').textContent, blocked:checkTrialLimit() };
  });
  expect(reset.changed).toBe(true); expect(reset.elapsed).toBe(0); expect(reset.day).toBe(reset.today); expect(reset.timer).toBe('08:00'); expect(reset.blocked).toBe(false);
});

test('旧10分版の当日消費時間を消さず8分を超えていればロックする', async ({ page }) => {
  await page.evaluate(() => {
    // Keep unload autosave from overwriting the seeded legacy elapsed time.
    trialState.playTimeSeconds = 550;
    trialState.lastPlayDate = getTrialDateKey();
    saveTrialState();
  });
  await page.reload();
  await expect(page.locator('#trialOverlay')).toBeVisible();
  expect(await page.evaluate(()=>trialState.playTimeSeconds)).toBeGreaterThanOrEqual(550);
  expect(await page.evaluate(()=>TRIAL_CONFIG.LIMIT_SECONDS)).toBe(480);
  expect(await page.evaluate(()=>WORD_ILLUSTRATIONS.length)).toBe(1292);
  expect(await page.evaluate(()=>vocabularyDatabase.illustrated.length)).toBe(1289);
});
