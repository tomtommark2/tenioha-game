const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const batch = require('../docs/vocabulary-changes/2026-09-09-phrase-pos-batch-04.json');
const words = [...new Set(batch.changes.map(c => c.after.word))];

test('第4回の全22語は修正内容・例文・履歴・幅別表示を保持する', async ({ page, browserName }) => {
  test.setTimeout(180000);
  await page.route(/https?:\/\/(?!localhost:8000)/, route => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  await page.evaluate(words => {
    const data = buildLocalSaveData();
    data.wordGroupingVersion = 1;
    for (const spelling of words) {
      const [level, word] = Object.entries(vocabularyDatabase).flatMap(([level, rows]) => rows.map(word => [level, word])).find(([, word]) => word.word === spelling);
      const key = getWordKey(word, level);
      data.wordStates[key] = 'weak';
      data.srsData[key] = { recentAnswers: [false, true], dueAt: 123, reviewStep: 1, successCount: 1, failCount: 1, scheduledIntervalDays: 1 };
    }
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
  }, words);
  await page.reload();
  const directory = path.resolve('screenshots/phrase-pos-repairs-2026-09-09-batch-04', browserName);
  fs.mkdirSync(directory, { recursive: true });
  const log = [];
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const spelling of words) {
      const record = await page.evaluate(spelling => {
        const [level, word] = ['junior', 'basic', 'daily', 'exam1'].flatMap(level => vocabularyDatabase[level].map(word => [level, word])).find(([, word]) => word.word === spelling);
        activateLearningSessionUI();
        gameState.currentLevel = level;
        loadVocabularyForLevel();
        gameState.currentWord = word;
        showWord(word);
        return { level, word, recent: gameState.srsData[getWordKey(word, level)].recentAnswers };
      }, spelling);
      expect(record.recent).toEqual([false, true]);
      await page.locator('#meaningCard').click();
      const senses = record.word.senses || [record.word];
      for (const change of batch.changes.filter(c => c.after.word === spelling)) {
        const index = senses.findIndex(s => s.pos === change.after.pos && s.phrase === change.after.phrase && s.example === change.after.example);
        expect(index).toBeGreaterThanOrEqual(0);
        await expect(page.locator('#meaningText')).toContainText(change.after.meaning.replace(/^【[^】]+】/, ''));
        if (senses.length > 1) await page.locator('#exampleSenseSelect').selectOption(String(index));
        await expect(page.locator('#exampleSentence')).toHaveText(change.after.example);
      }
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.merged-sense, #exampleSentence')].filter(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        const text = range.getBoundingClientRect(), box = el.closest('.card, .example-area').getBoundingClientRect();
        return text.left < box.left || text.right > box.right;
      }).length);
      expect(overflow).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const file = `${width}-${spelling}.png`;
      await page.screenshot({ path: path.join(directory, file), fullPage: true, animations: 'disabled' });
      log.push({ word: spelling, width, file, overflow });
      await page.evaluate(() => undoLastAction());
      expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers)).toEqual([false, true]);
    }
  }
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(log, null, 2) + '\n');
});
