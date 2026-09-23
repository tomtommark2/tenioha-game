const { test, expect } = require('@playwright/test');

async function selectWord(page, word = 'shelter', level = 'daily', pos = '名') {
  await page.evaluate(({ word, level, pos }) => {
    activateLearningSessionUI();
    gameState.currentLevel = level;
    gameState.currentWord = vocabularyDatabase[level].find(item => item.word === word && (item.pos === pos || item.senses?.some(sense => sense.pos === pos)))
      || ['junior', 'basic', 'daily', 'exam1'].flatMap(source => vocabularyDatabase[source]).find(item => item.word === word && item.senses?.some(sense => sense.pos === pos && sense.__sourceLevel === level));
    if (!gameState.currentWord) throw new Error(`Missing vocabulary: ${level}/${word}`);
    // Exercise each registered source sense without changing its grouped learning key.
    // Normal grouped cards use their first illustrated sense (covered by wordbook tests).
    const grouped = gameState.currentWord;
    const sense = grouped.senses?.find(item => item.word === word && item.pos === pos && (item.__sourceLevel || level) === level);
    if (sense) gameState.currentWord = { ...sense, senses: [sense], __groupKey: getWordKeySafe(grouped) };
    showWord(gameState.currentWord);
  }, { word, level, pos });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
});

test('登録済み名詞は意味を開いた後だけ表示され、次問でキャラクターへ戻る', async ({ page }) => {
  const entries = await page.evaluate(() => WORD_ILLUSTRATIONS);
  test.setTimeout(Math.max(180000, entries.length * 1000));
  expect(entries.length).toBeGreaterThanOrEqual(30);
  expect(entries.filter(entry => entry.level === 'junior').length).toBeGreaterThanOrEqual(20);
  for (const entry of entries) {
    await selectWord(page, entry.word, entry.level);
    await expect(page.locator('#heroCharacter')).toBeVisible();
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    const before = await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)]?.failCount || 0);
    await page.locator('#meaningCard').click();
    await expect(page.locator('#wordIllustration')).toBeVisible();
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', entry.src);
    await expect(page.locator('#heroCharacter')).toBeHidden();
    expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].failCount)).toBe(before + 1);
    await page.locator('#meaningCard').click();
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    await expect(page.locator('#heroCharacter')).toBeVisible();
  }
});
