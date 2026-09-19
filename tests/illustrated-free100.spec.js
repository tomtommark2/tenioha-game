const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, baseURL }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('vocabGame_skipWelcome', 'true');
    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
  });
  await page.goto('/index.html');
  await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
  await page.evaluate(() => updateTrialTimer());
});

test('無料100語・有料全674語で、通常学習と他単語帳は制限しない', async ({ page }) => {
  const result = await page.evaluate(() => {
    const api = WordIllustrations, db = vocabularyDatabase;
    const free = api.accessibleWords('illustrated', db);
    return {
      count: free.length, unique: new Set(free.map(w => getWordKey(w, 'illustrated'))).size,
      full: db.illustrated.length,
      other: ['junior','basic','daily','exam1','selection1400','selection1900','sys_2000'].every(l => api.accessibleWords(l, db).length === db[l].length),
      originals: ['apple','animal','baby','bag','ball','banana','bicycle','bird','boat','book','bottle','box','bread','bus','butterfly','cake','car','cat','chair','clock'].every(w => free.some(item => item.word === w))
    };
  });
  expect(result).toEqual({ count:100, unique:100, full:674, other:true, originals:true });
  await page.evaluate(() => WordIllustrations.openWordbook());
  await expect(page.locator('.illustrated-word-tile')).toHaveCount(100);
  await expect(page.locator('#illustratedWordbookCount')).toHaveText('無料体験 100語 / 全674語');
  await page.evaluate(() => {
    localStorage.setItem('vocabGame_isUnlocked', 'true');
    localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
    updateTrialTimer();
  });
  await expect(page.locator('.illustrated-word-tile')).toHaveCount(674);
  await expect(page.locator('#illustrationUpgrade')).toBeHidden();
});

test('無料100語の出題・一覧・復習・保存デッキ・直接選択の境界', async ({ page }) => {
  await page.evaluate(() => {
    activateLearningSessionUI(); switchLevel('illustrated'); openWordListModal();
  });
  expect(await page.evaluate(() => vocabulary.length)).toBe(100);
  expect(await page.evaluate(() => getSortedWordListItems().length)).toBe(100);
  const result = await page.evaluate(() => {
    closeWordListModal();
    const api = WordIllustrations, db = vocabularyDatabase;
    const locked = db.illustrated.find(w => !api.canUseWord(w, 'illustrated', db));
    const before = gameState.currentWord;
    openWordFromList('illustrated', encodeURIComponent(locked.__groupKey));
    const directBlocked = gameState.currentWord === before;
    gameState.wordStates[locked.__groupKey] = 'weak';
    ensureSrsEntry(locked.__groupKey).firstTryPerfect = false;
    const reviewBlocked = !getReviewQueueCandidatesAcrossLevels().some(e => e.key === locked.__groupKey);
    gameState.decks = { unlearned:[locked] };
    const deckBlocked = getWordFromDeck('unlearned', vocabulary) !== locked;
    gameState.currentWord = locked; showWord(locked);
    const restoreBlocked = api.canUseWord(gameState.currentWord, 'illustrated', db);
    return {directBlocked, reviewBlocked, deckBlocked, restoreBlocked};
  });
  expect(result).toEqual({directBlocked:true, reviewBlocked:true, deckBlocked:true, restoreBlocked:true});
});

test('有料期限切れで100語へ戻り、保存済み履歴と8分制限を保持', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('vocabGame_isUnlocked', 'true');
    localStorage.setItem('vocabGame_expiry', String(Date.now() + 86400000));
    updateTrialTimer(); activateLearningSessionUI(); switchLevel('illustrated');
    gameState.wordStates['preserved-history'] = 'learned';
    gameState.srsData['preserved-history'] = { dueAt:12345, recentAnswers:[true,false] };
    WordIllustrations.openWordbook();
    localStorage.setItem('vocabGame_expiry', String(Date.now() - 1000));
    updateTrialTimer();
  });
  await expect(page.locator('.illustrated-word-tile')).toHaveCount(100);
  expect(await page.evaluate(() => WordIllustrations.canUseWord(gameState.currentWord, 'illustrated', vocabularyDatabase))).toBe(true);
  expect(await page.evaluate(() => vocabulary.length)).toBe(100);
  expect(await page.evaluate(() => gameState.srsData['preserved-history'])).toEqual({dueAt:12345,recentAnswers:[true,false]});
  expect(await page.evaluate(() => gameState.wordStates['preserved-history'])).toBe('learned');
  expect(await page.evaluate(() => TRIAL_CONFIG.LIMIT_SECONDS)).toBe(480);
});

test('無料の通常学習は100語の対象外もイラストを表示できる', async ({ page }) => {
  expect(await page.evaluate(() => ['junior','basic','daily','exam1'].every(level => {
    gameState.currentLevel = level;
    return WORD_ILLUSTRATIONS.every(entry => WordIllustrations.canUseEntry(entry));
  }))).toBe(true);
  await page.evaluate(() => {
    activateLearningSessionUI(); switchLevel('daily');
    gameState.currentWord = vocabularyDatabase.daily.find(w => w.word === 'shelter');
    showWord(gameState.currentWord); WordIllustrations.openCurrent();
  });
  await expect(page.locator('#wordIllustration')).toBeVisible();
});

test('無料100語案内は320pxに収まり、購入案内を閉じて戻れる', async ({ page }, testInfo) => {
  await page.setViewportSize({width:320,height:850});
  await page.evaluate(() => WordIllustrations.openWordbook());
  await expect(page.locator('.illustrated-word-tile')).toHaveCount(100);
  const images = await page.locator('.illustrated-word-tile img').evaluateAll(async images => {
    for (let i = 0; i < images.length; i += 8) {
      await Promise.all(images.slice(i,i+8).map(img => {img.loading='eager';return img.decode();}));
    }
    return images.every(img => img.naturalWidth > 0);
  });
  expect(images).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#illustratedWordbookGallery').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('free100-320.png')});
  await page.getByRole('button',{name:'有料版について',exact:true}).click();
  await expect(page.locator('#profileModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#profileModal')).toBeHidden();
  await expect(page.locator('#illustratedWordbookModal')).toBeVisible();
});
