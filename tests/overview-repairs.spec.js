const { test, expect } = require('@playwright/test');
const batch = require('../docs/vocabulary-changes/2026-09-09-overview-batch-01.json');

test.use({ screenshot: 'off', video: 'off', trace: 'off' });

test('全体点検修復の参照先・用法切替・新語の回答と既存履歴を検証する', async ({ page }) => {
  test.setTimeout(240000);
  await page.route(/https?:\/\/(?!localhost:8000)/, route => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  const inventory = await page.evaluate(batch => {
    const expected = [...batch.changes.map(c => ({ ...c, added: false })), ...batch.additions.map(c => ({ ...c, added: true }))];
    const targets = [];
    for (const [level, rows] of Object.entries(vocabularyDatabase)) for (const [index, row] of rows.entries()) {
      const resolved = resolveReferencedVocabularyWord(row, level);
      for (const [senseIndex, sense] of (resolved.senses || [resolved]).entries()) {
        const match = expected.find(c => sense.word === c.after.word && sense.phrase === c.after.phrase && sense.example === c.after.example);
        if (match) targets.push({ level, index, senseIndex, after: match.after, added: match.added, key: getWordKey(resolved, level) });
      }
    }
    const newKeys = targets.filter(t => t.added).map(t => t.key);
    const initiallyNew = newKeys.every(key => !gameState.srsData[key]?.recentAnswers?.length && (!gameState.wordStates[key] || gameState.wordStates[key] === 'unlearned'));
    const expensive = ['junior', 'selection1400', 'sys_2000'].map(level => {
      const row = vocabularyDatabase[level].find(r => r.word === 'expensive');
      return getWordKey(resolveReferencedVocabularyWord(row, level), level);
    });
    const data = buildLocalSaveData();
    data.wordGroupingVersion = 1;
    const existingKeys = [...new Set([...targets.filter(t => !t.added).map(t => t.key), ...expensive.slice(1)])];
    for (const key of existingKeys) {
      data.wordStates[key] = 'weak';
      data.srsData[key] = { recentAnswers: [false, true], dueAt: 123, reviewStep: 1, successCount: 1, failCount: 1, scheduledIntervalDays: 1 };
    }
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
    return { targets, newKeys, existingKeys, expensive, initiallyNew };
  }, batch);
  expect(inventory.initiallyNew).toBe(true);
  expect(inventory.newKeys).toHaveLength(7);
  expect(new Set(inventory.expensive).size).toBe(3);
  expect(new Set(inventory.targets.map(t => t.after.word)).size).toBe(14);
  expect(inventory.targets.some(t => t.level === 'selection1900')).toBe(true);
  expect(inventory.targets.some(t => t.level === 'selection1400')).toBe(true);
  expect(inventory.targets.some(t => t.level === 'sys_2000')).toBe(true);
  await page.reload();
  const selectTarget = async target => page.evaluate(t => {
    activateLearningSessionUI();
    gameState.currentLevel = t.level;
    loadVocabularyForLevel();
    initializeWordStates();
    gameState.currentWord = vocabulary[t.index];
    gameState.currentQuestionReason = 'new';
    gameState.isReviewWord = false;
    showWord(gameState.currentWord);
    return getWordKeySafe(gameState.currentWord);
  }, target);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const target of inventory.targets) {
      expect(await selectTarget(target)).toBe(target.key);
      if (await page.locator('#exampleSenseSelect').count()) await page.locator('#exampleSenseSelect').selectOption(String(target.senseIndex));
      await expect(page.locator('#exampleSentence')).toHaveText(target.after.example);
      const prior = await page.evaluate(key => gameState.srsData[key].recentAnswers || [], target.key);
      expect(prior).toEqual(target.added ? [] : [false, true]);
      await page.locator('#meaningCard').click();
      const meaning = await page.evaluate(value => cleanMeaningForDisplay(value).replace(/^【[名動形副助接前代冠数間限定]】\s*/, ''), target.after.meaning);
      await expect(page.locator('#meaningText')).toContainText(meaning);
      await expect(page.locator('#meaningText')).toContainText(target.after.phrase);
      const spoken = await page.evaluate(() => { let result; const old = speakText; speakText = text => { result = text; }; speakCurrentExample(); speakText = old; return result; });
      expect(spoken).toBe(target.after.example);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => ['meaningText', 'exampleSentence'].filter(id => {
        const el = document.getElementById(id), range = document.createRange(); range.selectNodeContents(el);
        const text = range.getBoundingClientRect(), box = el.closest('.card, .example-area').getBoundingClientRect();
        return text.left < box.left || text.right > box.right;
      }))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.evaluate(() => undoLastAction());
      expect(await page.evaluate(key => gameState.srsData[key].recentAnswers || [], target.key)).toEqual(prior);
    }
  }
  // Newly added entries must be learnable, not just visible. Check one real answer per new key.
  for (const target of inventory.targets.filter(t => t.added)) {
    await selectTarget(target);
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(key => gameState.srsData[key].recentAnswers, target.key)).toEqual([true]);
  }
  await page.reload();
  const restored = await page.evaluate(({ existingKeys, newKeys, expensive }) => ({
    old: existingKeys.map(k => gameState.srsData[k].recentAnswers),
    added: newKeys.map(k => gameState.srsData[k].recentAnswers),
    expensive: expensive.map(k => gameState.srsData[k].recentAnswers),
  }), inventory);
  expect(restored.old).toEqual(inventory.existingKeys.map(() => [false, true]));
  expect(restored.added).toEqual(inventory.newKeys.map(() => [true]));
  expect(restored.expensive).toEqual([[true], [false, true], [false, true]]);
});
