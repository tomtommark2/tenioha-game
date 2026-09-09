const { test, expect } = require('@playwright/test');
// Content regression checks remain; visual recordings are disabled by user request.
test.use({ screenshot: 'off', video: 'off', trace: 'off' });
const batches = [
  { id: '01', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-01.json') },
  { id: '02', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-02.json') },
  { id: '03', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-03.json') },
  { id: '04', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-04.json') },
  { id: '05', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-05.json') },
  { id: '06', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-06.json') },
  { id: '07', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-07.json') },
  { id: '08', batch: require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-08.json') },
];

for (const { id, batch } of batches) {
test(`仮例文第${id}回${batch.changes.length}行の実表示・読み上げ・保存復元・Undoを検証する`, async ({ page }) => {
  test.setTimeout(180000);
  await page.route(/https?:\/\/(?!localhost:8000)/, route => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  await page.evaluate(changes => {
    const data = buildLocalSaveData();
    data.wordGroupingVersion = 1;
    for (const c of changes) {
      const key = getWordKey(vocabularyDatabase[c.level][c.index], c.level);
      data.wordStates[key] = 'weak';
      data.srsData[key] = { recentAnswers: [false, true], dueAt: 123, reviewStep: 1, successCount: 1, failCount: 1, scheduledIntervalDays: 1 };
    }
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
  }, batch.changes);
  await page.reload();
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const c of batch.changes) {
      const recent = await page.evaluate(c => {
        activateLearningSessionUI();
        gameState.currentLevel = c.level;
        loadVocabularyForLevel();
        gameState.currentWord = vocabulary.find(r => r.id === c.after.id);
        showWord(gameState.currentWord);
        return gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers;
      }, c);
      expect(recent).toEqual([false, true]);
      await expect(page.locator('#exampleSentence')).toHaveText(c.after.example);
      await page.locator('#meaningCard').click();
      // The existing renderer omits dictionary cross-reference annotations such as ⇔.
      const displayMeaning = await page.evaluate(meaning => cleanMeaningForDisplay(meaning), c.after.meaning);
      await expect(page.locator('#meaningText')).toContainText(displayMeaning);
      await expect(page.locator('#meaningText')).toContainText(c.after.phrase);
      const spoken = await page.evaluate(() => { let value; const previous = speakText; speakText = text => { value = text; }; speakCurrentExample(); speakText = previous; return value; });
      expect(spoken).toBe(c.after.example);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => ['meaningText', 'exampleSentence'].filter(id => {
        const el = document.getElementById(id), range = document.createRange(); range.selectNodeContents(el);
        const text = range.getBoundingClientRect(), box = el.closest('.card, .example-area').getBoundingClientRect();
        return text.left < box.left || text.right > box.right;
      }));
      expect(overflow).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.evaluate(() => undoLastAction());
      expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers)).toEqual([false, true]);
    }
  }
});
}
