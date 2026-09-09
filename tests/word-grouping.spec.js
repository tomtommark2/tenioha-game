const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/https?:\/\/(?!localhost:8000)/, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
});

test('統合カードの用法・発音・例文・音声と品詞フィルターを保持する', async ({ page }) => {
  const result = await page.evaluate(() => {
    activateLearningSessionUI();
    gameState.currentLevel = 'basic';
    loadVocabularyForLevel();
    initializeWordStates();
    gameState.currentWord = vocabularyDatabase.basic.find(word => word.word === 'adult');
    showWord(gameState.currentWord);
    return { senses: gameState.currentWord.senses, noun: isWordAllowedByPOS(gameState.currentWord, new Set(['名'])), adj: isWordAllowedByPOS(gameState.currentWord, new Set(['形'])), verb: isWordAllowedByPOS(gameState.currentWord, new Set(['動'])) };
  });
  expect([result.noun, result.adj, result.verb]).toEqual([true, true, false]);
  await expect(page.locator('.word-pos-label')).toContainText('形容詞');
  await expect(page.locator('.word-pos-label')).toContainText('名詞');
  await expect(page.locator('.word-ipa')).not.toBeEmpty();
  for (let i = 0; i < result.senses.length; i++) {
    await page.locator('#exampleSenseSelect').selectOption(String(i));
    await expect(page.locator('#exampleSentence')).toHaveText(result.senses[i].example);
    const spoken = await page.evaluate(() => { let text; const previous = speakText; speakText = value => { text = value; }; speakCurrentExample(); speakText = previous; return text; });
    expect(spoken).toBe(result.senses[i].example);
  }
  await page.locator('#meaningCard').click();
  for (const sense of result.senses) {
    await expect(page.locator('#meaningText')).toContainText(sense.meaning);
    await expect(page.locator('#meaningText')).toContainText(sense.phrase);
  }
  expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers)).toEqual([false]);
  await page.evaluate(() => undoLastAction());
  expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)]?.recentAnswers || [])).toEqual([]);
});

test('旧保存の対象だけ未学習へ戻し、新回答は再起動・参照語・Undoで共通になる', async ({ page }) => {
  const keys = await page.evaluate(() => {
    const grouped = vocabularyDatabase.basic.find(word => word.word === 'adult');
    const key = getWordKey(grouped, 'basic');
    const keepWord = vocabularyDatabase.basic.find(word => !word.senses && !word.ref);
    const keep = getWordKey(keepWord, 'basic');
    const data = buildLocalSaveData();
    delete data.wordGroupingVersion;
    data.wordStates = { [key]: 'perfect', [keep]: 'learned', 'word-v2:basic:adult:%E5%90%8D': 'weak', basic_adult: 'perfect' };
    data.srsData = Object.fromEntries(Object.keys(data.wordStates).map(key => [key, { recentAnswers: [false, true], successCount: 1, failCount: 1, dueAt: 123, reviewStep: 1, scheduledIntervalDays: 1 }]));
    data.points = 1234;
    data.reviewScore.total = 99;
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
    return { key, keep };
  });
  await page.reload();
  const reset = await page.evaluate(({ key, keep }) => ({ state: gameState.wordStates[key], old: gameState.wordStates.basic_adult, recent: gameState.srsData[key]?.recentAnswers || [], keep: gameState.srsData[keep].recentAnswers, points: gameState.points, score: gameState.reviewScore.total }), keys);
  expect(reset).toEqual({ state: 'unlearned', old: undefined, recent: [], keep: [false, true], points: 1234, score: 99 });
  await page.evaluate(({ key }) => {
    activateLearningSessionUI();
    gameState.currentWord = vocabularyDatabase.basic.find(word => word.word === 'adult');
    showWord(gameState.currentWord);
    gameState.currentQuestionReason = 'new';
    gameState.isReviewWord = false;
  }, keys);
  await page.locator('#vocabCard').click();
  await page.reload();
  const restored = await page.evaluate(({ key }) => ({ recent: gameState.srsData[key].recentAnswers, version: JSON.parse(localStorage.getItem('vocabClickerSave')).wordGroupingVersion, refs: Object.entries(vocabularyDatabase).flatMap(([level, words]) => words.filter(word => word.word === 'adult' && word.senses).map(word => getWordKey(word, level))) }), keys);
  expect(restored.recent).toEqual([true]);
  expect(restored.version).toBe(1);
  expect(new Set(restored.refs)).toEqual(new Set([keys.key]));
});

test('品詞修復した3語も統合済み履歴を再起動とUndoで保持する', async ({ page }) => {
  const keys = await page.evaluate(() => {
    const data = buildLocalSaveData();
    data.wordGroupingVersion = 1;
    const keys = ['lot', 'most', 'yeah'].map(spelling => {
      const word = vocabularyDatabase.junior.find(word => word.word === spelling);
      return getWordKey(word, 'junior');
    });
    for (const key of keys) {
      data.wordStates[key] = 'weak';
      data.srsData[key] = { recentAnswers: [false, true], successCount: 1, failCount: 1, dueAt: 123, reviewStep: 1, scheduledIntervalDays: 1 };
    }
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));
    return keys;
  });
  await page.reload();
  expect(await page.evaluate(keys => keys.map(key => gameState.srsData[key].recentAnswers), keys)).toEqual([[false, true], [false, true], [false, true]]);
  for (const spelling of ['lot', 'most', 'yeah']) {
    const filters = await page.evaluate(spelling => {
      activateLearningSessionUI();
      gameState.currentLevel = 'junior';
      gameState.currentWord = vocabularyDatabase.junior.find(word => word.word === spelling);
      showWord(gameState.currentWord);
      return ['名', '冠', '副'].map(pos => isWordAllowedByPOS(gameState.currentWord, new Set([pos])));
    }, spelling);
    if (spelling === 'lot') expect(filters).toEqual([true, false, false]);
    if (spelling === 'most') expect(filters[1]).toBe(false);
    if (spelling === 'yeah') expect(filters).toEqual([false, false, true]);
    await page.locator('#meaningCard').click();
    await page.evaluate(() => undoLastAction());
    expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers)).toEqual([false, true]);
  }
});

test('異なる発音と5用法でも意味・フレーズを欠落させない', async ({ page }) => {
  for (const spelling of ['record', 'round', 'one']) {
    const senses = await page.evaluate(spelling => {
      activateLearningSessionUI();
      gameState.currentWord = Object.values(vocabularyDatabase).flat().find(word => word.word === spelling && word.senses);
      showWord(gameState.currentWord);
      document.getElementById('meaningCard').classList.add('flipped');
      return gameState.currentWord.senses;
    }, spelling);
    await expect(page.locator('.merged-sense')).toHaveCount(senses.length);
    expect(await page.locator('.merged-sense').evaluateAll(els => els.filter(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().right > el.closest('.card').getBoundingClientRect().right - 8;
    }).length)).toBe(0);
    if (spelling === 'record') await expect(page.locator('.word-ipa-variant')).toHaveCount(2);
  }
});
