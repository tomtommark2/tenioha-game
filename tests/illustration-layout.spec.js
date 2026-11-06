const { test, expect } = require('@playwright/test');

test('絵・意味・前の絵の切替でヘッダーを保ち、開いた意味だけ必要な高さにする', async ({ page, baseURL }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
  });
  await page.goto('/index.html');
  await page.evaluate(async () => {
    closeAnnouncementModal();
    activateLearningSessionUI();
    switchLevel('illustrated');
    gameState.currentWord = vocabularyDatabase.illustrated.find(word => word.word === 'apple');
    showWord(gameState.currentWord);
    await document.fonts.ready;
  });
  const measure = () => page.evaluate(() => Object.fromEntries([
    '.header', '.rpg-inline', '.review-score-summary', '#cardsArea', '#vocabCard', '#meaningCard', '#exampleArea', '.answer-tools'
  ].map(selector => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return [selector, [rect.x + scrollX, rect.y + scrollY, rect.width, rect.height].map(value => Math.round(value * 10) / 10)];
  })));
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await page.evaluate(() => { WordIllustrations.resetPrevious(); showWord(gameState.currentWord); });
    // Settle the viewport change before recording geometry.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const before = await measure();
    expect(before['.answer-tools'][3]).toBe(44);
    const buttons = await page.locator('.answer-tools button').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    expect(buttons[0].y).toBe(buttons[1].y);
    expect(buttons[0].x + buttons[0].width).toBeLessThanOrEqual(buttons[1].x);
    expect(buttons.every(button => button.width >= 44 && button.height >= 44)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#meaningCard .card-back')).toBeHidden();
    await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
    await page.evaluate(() => WordIllustrations.show(gameState.currentWord, 'illustrated', vocabularyDatabase));
    await expect(page.locator('#wordIllustration')).toBeVisible();
    expect(await measure(), `image at ${width}px`).toEqual(before);
    await page.evaluate(() => handleMeaningCardClick({ currentTarget: document.getElementById('meaningCard') }));
    await expect(page.locator('#meaningCard .card-back')).toBeVisible();
    const answered = await measure();
    for (const selector of ['.header', '.rpg-inline', '.review-score-summary', '#vocabCard']) {
      expect(answered[selector], `${selector} after answer at ${width}px`).toEqual(before[selector]);
    }
    for (const selector of ['#cardsArea', '#meaningCard']) {
      expect(answered[selector].slice(0, 3)).toEqual(before[selector].slice(0, 3));
    }
    expect(answered['#meaningCard'][3]).toBeGreaterThanOrEqual(before['#meaningCard'][3]);
    // Since October, hidden meanings keep a compact card and may expand on reveal.
    const shift = answered['#cardsArea'][3] - before['#cardsArea'][3];
    for (const selector of ['#exampleArea', '.answer-tools']) {
      expect(answered[selector][0]).toBe(before[selector][0]);
      expect(answered[selector].slice(2)).toEqual(before[selector].slice(2));
      expect(answered[selector][1] - before[selector][1]).toBeCloseTo(shift, 0);
    }
    await page.evaluate(() => {
      WordIllustrations.rememberAnswer(vocabularyDatabase.illustrated.find(word => word.word === 'baby'), 'illustrated', vocabularyDatabase);
      showWord(gameState.currentWord);
    });
    await expect(page.locator('#previousIllustrationBtn')).toBeVisible();
    expect(await measure(), `previous button at ${width}px`).toEqual(before);
  }
});
