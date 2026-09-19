const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    // Full-catalogue behavior; free access has dedicated 100-word tests.
    localStorage.setItem('vocabGame_isUnlocked', 'true');
    localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
});

async function select(page, word) {
  await page.evaluate(word => {
    activateLearningSessionUI();
    switchLevel('illustrated');
    gameState.currentWord = vocabularyDatabase.illustrated.find(item => item.word === word);
    showWord(gameState.currentWord);
  }, word);
}

async function registeredLearningKeys(page) {
  return page.evaluate(() => {
    const rows = ['junior', 'basic', 'daily', 'exam1'].flatMap(level =>
      vocabularyDatabase[level].map(word => ({ level, word })));
    return WORD_ILLUSTRATIONS.map(entry => {
      const source = rows.find(({ level, word }) => (word.senses || [word]).some(sense =>
        sense.word === entry.word && sense.pos === entry.pos && (sense.__sourceLevel || level) === entry.level));
      if (!source) throw new Error(`Missing registered source: ${entry.level}/${entry.word}`);
      return getWordKey(source.word, source.level);
    });
  });
}

test('イラスト単語帳は登録済み名詞だけで元の学習キーを共有する', async ({ page }) => {
  const expectedKeys = [...new Set(await registeredLearningKeys(page))].sort();
  const result = await page.evaluate(() => {
    const keys = new Set(['junior', 'basic', 'daily', 'exam1'].flatMap(level => vocabularyDatabase[level].map(word => getWordKey(word, level))));
    return {
      count: vocabularyDatabase.illustrated.length,
      learningKeys: vocabularyDatabase.illustrated.map(word => getWordKey(word, 'illustrated')).sort(),
      unique: new Set(vocabularyDatabase.illustrated.map(word => getWordKey(word, 'illustrated'))).size,
      valid: vocabularyDatabase.illustrated.every(word => word.pos === '名' && word.senses.length === 1 && keys.has(getWordKey(word, 'illustrated')) && WordIllustrations.find(word, 'illustrated', vocabularyDatabase)),
    };
  });
  // Multiple source senses (e.g. lot) can share one existing grouped learning card.
  expect(result.learningKeys).toEqual(expectedKeys);
  expect(result.count).toBe(expectedKeys.length);
  expect(result.unique).toBe(result.count);
  expect(result.valid).toBe(true);
  await select(page, 'apple');
  const key = await page.evaluate(() => getWordKeySafe(gameState.currentWord));
  await page.locator('#meaningCard').click();
  expect(await page.evaluate(key => gameState.srsData[key].failCount, key)).toBe(1);
  await page.evaluate(() => switchLevel('junior'));
  expect(await page.evaluate(key => gameState.wordStates[key], key)).toBe('weak');
});

test('前の絵は正解後に閲覧でき、採点せず、同じ未回答語とUndoでは隠す', async ({ page }) => {
  await select(page, 'apple');
  await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
  await page.locator('#vocabCard').click();
  await expect(page.locator('#previousIllustrationBtn')).toBeVisible();
  const state = await page.evaluate(() => JSON.stringify(gameState));
  await page.locator('#previousIllustrationBtn').click();
  await expect(page.locator('#previousIllustrationModal')).toBeHidden();
  await expect(page.locator('#wordIllustration')).toBeVisible();
  await page.locator('#wordIllustrationSlot').click();
  await expect(page.locator('#previousIllustrationWord')).toHaveText('apple');
  await expect(page.locator('#previousIllustrationImage img')).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(gameState))).toBe(state);
  await page.getByRole('button', { name: 'イラストを閉じる', exact: true }).click();
  await expect(page.locator('#wordIllustrationSlot')).toBeFocused();
  await page.locator('#undoBtn').click();
  await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
  await page.evaluate(() => {
    WordIllustrations.rememberAnswer(gameState.currentWord, 'illustrated', vocabularyDatabase);
    showWord(gameState.currentWord);
  });
  await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
});

test('前の絵は不正解の次問でも開き、未収録語の回答と再読込で消える', async ({ page }) => {
  await select(page, 'apple');
  await page.locator('#meaningCard').click();
  await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
  await page.locator('#meaningCard').click();
  await expect(page.locator('#previousIllustrationBtn')).toBeVisible();
  await page.evaluate(() => {
    gameState.currentWord = { word: 'unillustrated-test', pos: '名' };
    WordIllustrations.rememberAnswer(gameState.currentWord, 'basic', vocabularyDatabase);
    WordIllustrations.refreshPrevious(null);
  });
  await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
  await page.reload();
  await expect(page.locator('#previousIllustrationBtn')).toBeHidden();
});

test('イラスト単語帳の復習は収録語だけを名詞表示で出す', async ({ page }) => {
  const result = await page.evaluate(() => {
    gameState.currentLevel = 'illustrated';
    const illustrated = vocabularyDatabase.illustrated.find(word => word.word === 'back');
    const other = vocabularyDatabase.basic.find(word => !WordIllustrations.find(word, 'basic', vocabularyDatabase));
    const key = getWordKey(illustrated, 'illustrated');
    const otherKey = getWordKey(other, 'basic');
    gameState.wordStates = { [key]: 'weak', [otherKey]: 'weak' };
    return getReviewQueueCandidatesAcrossLevels().map(item => ({ key: item.key, word: item.word.word, pos: item.word.pos, senses: item.word.senses.length }));
  });
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ word: 'back', pos: '名', senses: 1 });
});

test('イラスト画面は小さい画面でも閉じて学習に戻れる', async ({ page }, testInfo) => {
  await page.evaluate(() => WordIllustrations.openWordbook());
  await expect(page.locator('#illustratedWordbookModal')).toBeVisible();
  await expect(page.locator('.illustrated-word-tile')).toHaveCount(new Set(await registeredLearningKeys(page)).size);
  await expect.poll(() => page.locator('.illustrated-word-tile img').first().evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('illustrated-wordbook.png') });
  await page.getByRole('button', { name: 'イラスト単語帳を閉じる', exact: true }).click();
  await expect(page.locator('#illustratedWordbookModal')).toBeHidden();
  await page.evaluate(() => WordIllustrations.openWordbook());
  await page.locator('#illustratedWordbookModal').click({ position: { x: 1, y: 1 } });
  await expect(page.locator('#illustratedWordbookModal')).toBeHidden();
  await page.evaluate(() => WordIllustrations.openWordbook());
  await expect(page.locator('#illustratedWordbookModal')).toBeVisible();
  await page.evaluate(() => history.back());
  await expect(page.locator('#illustratedWordbookModal')).toBeHidden();
  await page.evaluate(() => WordIllustrations.openWordbook());
  await page.getByRole('button', { name: 'apple：', exact: false }).click();
  await expect(page.locator('#illustratedWordbookModal')).toBeHidden();
  await expect(page.locator('#vocabWord')).toContainText('apple');
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
  await page.locator('#vocabCard').click();
  await expect(page.locator('#previousIllustrationBtn')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('previous-button.png') });
  await page.locator('#previousIllustrationBtn').click();
  await expect(page.locator('#wordIllustration')).toBeVisible();
  await page.locator('#wordIllustrationSlot').click();
  await expect(page.locator('#previousIllustrationModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#previousIllustrationModal')).toBeHidden();
  await expect(page.locator('#wordIllustrationSlot')).toBeFocused();
  await page.evaluate(() => WordIllustrations.openWordbook());
  await page.getByRole('button', { name: '学習する', exact: true }).click();
  expect(await page.evaluate(() => gameState.currentLevel)).toBe('illustrated');
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
});

test('前の絵と一覧は320pxでも収まり、最終回答後も絵を開ける', async ({ page }) => {
  test.setTimeout(90000);
  await select(page, 'apple');
  await page.locator('#vocabCard').click();
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    const rect = await page.locator('#previousIllustrationBtn').boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width);
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => showNoWordsMessage());
  await page.locator('#previousIllustrationBtn').click();
  await expect(page.locator('#wordIllustration')).toBeVisible();
  await page.locator('#wordIllustrationSlot').click();
  await expect(page.locator('#previousIllustrationWord')).toHaveText('apple');
  await page.keyboard.press('Escape');
  await page.evaluate(() => WordIllustrations.openWordbook());
  await page.setViewportSize({ width: 320, height: 650 });
  const images = await page.locator('.illustrated-word-tile img').evaluateAll(async images => {
    // Bound diagnostic eager loads; production uses lazy loading.
    for (let i = 0; i < images.length; i += 12) {
      await Promise.all(images.slice(i, i + 12).map(image => { image.loading = 'eager'; return image.decode(); }));
    }
    return images.every(image => image.naturalWidth > 0);
  });
  expect(images).toBe(true);
  expect(await page.locator('#illustratedWordbookGallery').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('イラスト画面は小さい画面でも表示済みの絵を意味カード操作で消したり作り直したりしない', async ({ page }) => {
  await select(page, 'apple');
  await page.locator('#currentIllustrationBtn').click();
  await expect(page.locator('#wordIllustration')).toBeVisible();
  await page.evaluate(() => {
    window.illustrationBefore = document.getElementById('wordIllustration');
    window.illustrationMutations = [];
    window.illustrationObserver = new MutationObserver(records => {
      window.illustrationMutations.push(...records.map(record => record.type));
    });
    window.illustrationObserver.observe(document.getElementById('wordIllustrationSlot'), {
      childList: true, attributes: true, subtree: true
    });
  });
  await page.locator('#currentIllustrationBtn').click();
  await page.locator('#meaningCard .card-front').click();
  await expect(page.locator('#meaningCard .card-back')).toBeVisible();
  await expect(page.locator('#wordIllustration')).toBeVisible();
  const result = await page.evaluate(() => {
    window.illustrationObserver.disconnect();
    return {
      sameImage: window.illustrationBefore === document.getElementById('wordIllustration'),
      mutations: window.illustrationMutations,
      answers: gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers
    };
  });
  expect(result).toEqual({ sameImage: true, mutations: [], answers: [false] });
  await page.locator('#meaningCard .card-back').click();
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
});

test('イラスト画面は小さい画面でも回答前に表示・拡大・切替でき、自己申告の採点とUndoを維持する', async ({ page }, testInfo) => {
  await select(page, 'apple');
  const buttonStyle = await page.locator('#currentIllustrationBtn').evaluate(button => {
    const style = getComputedStyle(button);
    return { background: style.backgroundColor, color: style.color, weight: style.fontWeight };
  });
  expect(buttonStyle).toEqual({ background: 'rgb(243, 240, 251)', color: 'rgb(101, 85, 143)', weight: '600' });
  const key = await page.evaluate(() => getWordKeySafe(gameState.currentWord));
  const state = await page.evaluate(() => JSON.stringify(gameState));
  await page.locator('#currentIllustrationBtn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#wordIllustration')).toBeVisible();
  await expect(page.locator('#meaningCard .card-back')).toBeHidden();
  await page.locator('#wordIllustrationSlot').click();
  await expect(page.locator('#previousIllustrationWord')).toHaveText('apple');
  await page.keyboard.press('Escape');
  await expect(page.locator('#wordIllustrationSlot')).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify(gameState))).toBe(state);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    const geometry = await page.locator('#currentIllustrationBtn').evaluate(button => {
      const rect = button.getBoundingClientRect();
      const label = button.parentElement.querySelector('.card-label').getBoundingClientRect();
      const card = button.parentElement.getBoundingClientRect();
      return { width: rect.width, height: rect.height, labelCenterOffset: Math.abs((rect.top + rect.bottom - label.top - label.bottom) / 2), overlap: rect.left < label.right && rect.right > label.left && rect.top < label.bottom && rect.bottom > label.top };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(44);
    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(geometry.overlap).toBe(false);
    expect(geometry.labelCenterOffset).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`hint-${width}.png`) });
  }
  await page.locator('#vocabCard').click();
  expect(await page.evaluate(key => gameState.srsData[key].recentAnswers, key)).toEqual([true]);
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
  await page.locator('#previousIllustrationBtn').click();
  await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
  await page.locator('#currentIllustrationBtn').click();
  const currentSrc = await page.evaluate(() => WordIllustrations.find(gameState.currentWord, 'illustrated', vocabularyDatabase).src);
  await expect(page.locator('#wordIllustration')).toHaveAttribute('src', currentSrc);
  await page.locator('#undoBtn').click();
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
  await page.locator('#currentIllustrationBtn').click();
  await page.locator('#meaningCard .card-front').click();
  expect(await page.evaluate(key => gameState.srsData[key].recentAnswers, key)).toEqual([false]);
  await page.evaluate(() => {
    switchLevel('basic');
    gameState.currentWord = vocabularyDatabase.basic.find(word => !WordIllustrations.find(word, 'basic', vocabularyDatabase));
    showWord(gameState.currentWord);
  });
  await expect(page.locator('#currentIllustrationBtn')).toBeHidden();
  await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
});
