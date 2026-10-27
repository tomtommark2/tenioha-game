const { test, expect } = require('@playwright/test');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        for (const name of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + name, 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 1 }));
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
            getVoices: () => [{ name: 'Test voice', lang: 'en-US' }], speak: () => {}, cancel: () => {}
        } });
        window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await page.evaluate(() => document.fonts.ready);
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function displaySettings(page) {
    await page.locator('#otherMenuBtn').click();
    await page.getByRole('button', { name: '出題・復習・表示設定', exact: true }).click();
    await page.locator('#studySettingsDisplayTab').click();
}
const current = page => page.evaluate(() => {
    const word = gameState.currentWord;
    const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
    return { key, word: word.word, srs: JSON.parse(JSON.stringify(gameState.srsData[key])), state: gameState.wordStates[key], counts: { ...gameState.actionCounts } };
});

test('正解後の意味：初期オフは従来の一度タップで次へ進む', async ({ page }) => {
    await displaySettings(page);
    await expect(page.locator('#showMeaningOnCorrect')).not.toBeChecked();
    await expect(page.locator('#answerMeaningChoices')).toBeHidden();
    await page.locator('.study-mode-close-btn').click();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#answerMeaningBtn')).toBeHidden();
    const before = await current(page);
    await page.locator('#vocabCard').click();
    expect((await current(page)).key).not.toBe(before.key);
    await expect(page.locator('.answer-confirmation-actions')).toHaveCount(0);
});

test('正解後の意味：表示設定を端末に保存し、学習保存に混ぜず、保存失敗なら戻す', async ({ page }) => {
    await displaySettings(page);
    await page.evaluate(() => { window.answerSettingSaveCalls = 0; window.saveGame = () => { window.answerSettingSaveCalls++; }; });
    await page.locator('#showMeaningOnCorrect').check();
    await expect(page.getByRole('radio', { name: '目のボタン', exact: true })).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem('vocabGame_answerMeaningMode'))).toBe('button');
    expect(await page.evaluate(() => window.answerSettingSaveCalls)).toBe(0);
    await page.reload();
    await displaySettings(page);
    await expect(page.locator('#showMeaningOnCorrect')).toBeChecked();
    await page.getByText('毎回表示', { exact: true }).click();
    await page.reload();
    await displaySettings(page);
    await expect(page.getByRole('radio', { name: '毎回表示', exact: true })).toBeChecked();
    await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            if (key === 'vocabGame_answerMeaningMode') throw new Error('storage full');
            return original.call(this, key, value);
        };
    });
    await page.locator('#showMeaningOnCorrect').click();
    await expect(page.locator('#showMeaningOnCorrect')).toBeChecked();
    await expect(page.getByRole('radio', { name: '毎回表示', exact: true })).toBeChecked();
    await expect(page.locator('#answerMeaningSettingsStatus')).toContainText('変更前の設定に戻しました');
});

test('正解後の意味：旧オンを毎回表示として引き継ぎ、新しいオフを優先する', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('vocabGame_showMeaningOnCorrect', 'true'));
    await page.reload();
    await displaySettings(page);
    await expect(page.locator('#showMeaningOnCorrect')).toBeChecked();
    await expect(page.getByRole('radio', { name: '毎回表示', exact: true })).toBeChecked();
    await page.locator('#showMeaningOnCorrect').uncheck();
    await page.reload();
    await displaySettings(page);
    await expect(page.locator('#showMeaningOnCorrect')).not.toBeChecked();
});

test('正解後の意味：目は正解して表示し、通常タップは次へ、Undoと不正解は従来どおり', async ({ page }) => {
    await displaySettings(page);
    await page.locator('#showMeaningOnCorrect').check();
    await page.locator('.study-mode-close-btn').click();
    await expect(page.locator('#answerMeaningBtn')).toBeHidden();
    await page.locator('#vocabCard').click();
    const first = await current(page);
    await page.locator('#vocabCard').click();
    expect((await current(page)).key).not.toBe(first.key);
    await expect(page.locator('#meaningCard')).not.toHaveClass(/flipped/);
    const before = await current(page);
    await expect(page.locator('#answerMeaningBtn')).toHaveText('');
    await page.locator('#answerMeaningBtn').press('Enter');
    const answered = await current(page);
    expect(answered.key).toBe(before.key);
    expect(answered.srs.successCount).toBe(before.srs.successCount + 1);
    expect(answered.srs.failCount).toBe(before.srs.failCount);
    await expect(page.locator('#answerMeaningBtn')).toBeDisabled();
    await expect(page.locator('#meaningCard')).toHaveClass(/answer-confirmation/);
    await page.locator('#wordSpeechBtn').click();
    expect(await current(page)).toEqual(answered);
    await page.locator('#undoBtn').click();
    expect(await current(page)).toEqual(before);
    await expect(page.locator('#answerMeaningBtn')).toBeEnabled();
    await page.locator('#answerMeaningBtn').press('Space');
    const answeredAgain = await current(page);
    await page.locator('#meaningCard').click();
    expect((await current(page)).key).not.toBe(before.key);
    expect(await page.evaluate(key => JSON.parse(JSON.stringify(gameState.srsData[key])), before.key)).toEqual(answeredAgain.srs);
    const next = await current(page);
    await page.locator('#meaningCard').click();
    expect((await current(page)).srs.failCount).toBe(next.srs.failCount + 1);
    await expect(page.locator('#answerMeaningBtn')).toBeDisabled();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#answerMeaningBtn')).toBeEnabled();
});

test('正解後の意味：目と復習理由を280〜1280pxで重ねず、表示設定で現在のカードを動かさない', async ({ page }, testInfo) => {
    await page.evaluate(() => { setAnswerMeaningMode('button'); startLearningSession(); });
    const word = await page.evaluate(() => ({ ...vocabularyDatabase.junior.find(word => word.word === 'apple'), __sourceLevel: 'junior' }));
    await page.evaluate(async () => {
        const image = new Image();
        image.src = '/assets/ui/visibility-rounded.svg';
        await image.decode();
    });
    for (const width of [280, 320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(word => {
            showWord(word);
            const key = getWordKeySafe(word, 'junior');
            ensureSrsEntry(key).recentAnswers = [true, false, false];
            gameState.wordStates[key] = 'weak';
            gameState.isReviewWord = true;
            gameState.currentQuestionReason = 'due-weak';
            updateQuestionReasonUI();
        }, word);
        const card = page.locator('#vocabCard');
        await expect(page.locator('#vocabWord')).toContainText('apple');
        expect(await page.locator('#answerMeaningBtn .app-picto').evaluate(e => getComputedStyle(e, '::before').maskImage)).toContain('visibility-rounded.svg');
        const button = await page.locator('#answerMeaningBtn').boundingBox();
        const reason = await page.locator('#questionReasonLabel').boundingBox();
        expect(reason).not.toBeNull();
        expect(button.y + button.height).toBeLessThanOrEqual(reason.y + 1);
        const pos = await page.locator('.word-pos-label').boundingBox();
        expect(button.x + button.width).toBeLessThan(pos.x);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await card.screenshot({ path: `screenshots/answer-meaning-eye-review-${width}-${testInfo.project.name}.png` });
        if (width === 390) await page.locator('#cardsArea').screenshot({ path: `screenshots/answer-meaning-eye-cards-${testInfo.project.name}.png` });
        const baseline = await card.boundingBox();
        const before = await current(page);
        await page.evaluate(() => setAnswerMeaningMode('always'));
        await expect(page.locator('#answerMeaningBtn')).toBeHidden();
        expect(await card.boundingBox()).toEqual(baseline);
        expect(await current(page)).toEqual(before);
        await page.evaluate(() => setAnswerMeaningMode('button'));
        expect(await card.boundingBox()).toEqual(baseline);
    }
    await displaySettings(page);
    await page.screenshot({ path: `screenshots/answer-meaning-modes-settings-${testInfo.project.name}.png` });
});

test('正解後の意味：正解は一度だけ記録し、意味を確認して次へ進みUndoできる', async ({ page }) => {
    await page.evaluate(() => setShowMeaningOnCorrect(true));
    await page.locator('#vocabCard').click();
    const before = await current(page);
    await page.locator('#vocabCard').press('Enter');
    const answered = await current(page);
    expect(answered.key).toBe(before.key);
    expect(answered.srs.successCount).toBe(before.srs.successCount + 1);
    expect(answered.srs.failCount).toBe(before.srs.failCount);
    expect(answered.state).toBe('perfect');
    await expect(page.locator('#meaningCard')).toHaveClass(/flipped.*answer-confirmation/);
    await expect(page.locator('#meaningText')).toBeVisible();
    await expect(page.locator('.answer-confirmation-state')).toHaveText('正解');
    expect(await page.locator('.answer-confirmation-state .app-picto').evaluate(e => getComputedStyle(e, '::before').maskImage)).toContain('check-circle-rounded.svg');
    await page.locator('.answer-confirmation-next').click();
    expect((await current(page)).key).not.toBe(before.key);
    expect(await page.evaluate(key => gameState.srsData[key], before.key)).toEqual(answered.srs);
    await expect(page.locator('.answer-confirmation-actions')).toHaveCount(0);
    await page.locator('#undoBtn').click();
    const restored = await current(page);
    expect(restored.key).toBe(before.key);
    expect(restored.srs).toEqual(before.srs);
    expect(restored.state).toBe(before.state);
    await expect(page.locator('#meaningCard')).not.toHaveClass(/flipped|answer-confirmation/);
    expect(await page.evaluate(() => showMeaningOnCorrect)).toBe(true);
});

test('正解後の意味：不正解の確認・単語音声・次への操作で二重に採点しない', async ({ page }) => {
    await page.evaluate(() => setShowMeaningOnCorrect(true));
    await page.locator('#vocabCard').click();
    const before = await current(page);
    await page.locator('#wordSpeechBtn').click();
    expect((await current(page)).srs).toEqual(before.srs);
    await page.locator('#meaningCard').click();
    const answered = await current(page);
    expect(answered.srs.failCount).toBe(before.srs.failCount + 1);
    expect(answered.srs.successCount).toBe(before.srs.successCount);
    await expect(page.locator('.answer-confirmation-actions')).toHaveCount(0);
    await page.locator('#vocabCard').press('Space');
    expect(await page.evaluate(key => gameState.srsData[key], before.key)).toEqual(answered.srs);
    expect((await current(page)).key).not.toBe(before.key);
});

test('正解後の意味：280〜1280pxで開く前はコンパクトにし、開いた長い意味と次へを収める', async ({ page }, testInfo) => {
    await page.evaluate(() => { setShowMeaningOnCorrect(true); startLearningSession(); });
    const word = await page.evaluate(() => ({ ...gameState.currentWord, meaning: '意味を確認します。'.repeat(25), phrase: '', __customWord: true }));
    for (const width of [280, 320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(word => showWord(word), word);
        const before = await page.locator('#meaningCard').boundingBox();
        await page.locator('#vocabCard').click();
        const after = await page.locator('#meaningCard').boundingBox();
        expect(after.width).toBe(before.width);
        expect(after.height).toBeGreaterThan(before.height);
        const footer = await page.locator('.answer-confirmation-actions').boundingBox();
        const meaning = await page.locator('#meaningCard > .card-back').boundingBox();
        expect(footer.x).toBeGreaterThanOrEqual(after.x);
        expect(footer.x + footer.width).toBeLessThanOrEqual(after.x + after.width);
        expect(meaning.y + meaning.height).toBeLessThanOrEqual(footer.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if ([390, 1280].includes(width)) await page.screenshot({ path: `screenshots/answer-meaning-${width}-${testInfo.project.name}.png` });
    }
});

test('正解後の意味：語義や品詞が多くても開く前の意味カードを同じ高さに保つ', async ({ page }) => {
    await page.locator('#vocabCard').click();
    const original = await page.evaluate(() => ({ ...gameState.currentWord, pos: '名', phrase: '', example: '', meaning: '意味' }));
    for (const width of [280, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(word => showWord(word), original);
        const baseline = await page.locator('#meaningCard').boundingBox();
        const long = { ...original, senses: Array.from({ length: 8 }, (_, index) => ({ pos: '名', meaning: `意味${index + 1}：詳しい説明です。`, phrase: 'sample phrase' })) };
        await page.evaluate(word => showWord(word), long);
        const closed = await page.locator('#meaningCard').boundingBox();
        expect(closed.height, `${width}px closed card`).toBe(baseline.height);
        await expect(page.locator('#meaningCard > .card-back')).toBeHidden();
        await page.locator('#meaningCard').click();
        await expect(page.locator('#meaningText')).toBeVisible();
        expect((await page.locator('#meaningCard').boundingBox()).height, `${width}px revealed meanings`).toBeGreaterThan(closed.height);
        await page.locator('#undoBtn').click();
        expect((await page.locator('#meaningCard').boundingBox()).height, `${width}px after undo`).toBe(baseline.height);
    }
});

test('正解後の意味：初回説明も設定に合わせ、確認中の次へと重ねない', async ({ page }) => {
    await page.evaluate(() => { window.liveTutorialState = { active: true, step: 0, dismissedCards: [] }; renderLiveTutorial(); });
    await expect(page.locator('#vocabCardTutorialHint')).toContainText('意味は表示されません');
    await page.evaluate(() => setShowMeaningOnCorrect(true));
    await expect(page.locator('#vocabCardTutorialHint')).toContainText('意味を確認して次へ');
    await page.locator('#vocabCard').click();
    await page.locator('#vocabCard').click();
    await expect(page.locator('.answer-confirmation-next')).toBeVisible();
    await expect(page.locator('#meaningCardTutorialHint')).toBeHidden();
    await page.locator('.answer-confirmation-next').click();
    await expect(page.locator('#meaningCardTutorialHint')).toBeVisible();
});

for (const mode of ['always', 'button']) {
test(`正解後の意味：最後の1語を確認してから完了し、Undoでカードを復元できる（${mode}）`, async ({ page }) => {
    await page.evaluate(mode => {
        setAnswerMeaningMode(mode);
        startLearningSession();
        const target = vocabulary.find(word => word.word === 'abroad');
        vocabularyDatabase[gameState.currentLevel] = [target];
        loadVocabularyForLevel();
        showWord(target);
        gameState.decks = null;
        invalidateLearningProgressSnapshot();
        gameState.reviewMode = 'off';
        gameState.randomMode = false;
    }, mode);
    const before = await current(page);
    await page.locator(mode === 'button' ? '#answerMeaningBtn' : '#vocabCard').click();
    await expect(page.locator('#meaningText')).toBeVisible();
    await page.locator('.answer-confirmation-next').click();
    await expect(page.locator('.no-words')).toBeVisible();
    await page.locator('#undoBtn').click();
    expect((await current(page)).key).toBe(before.key);
    await expect(page.locator('#meaningCard')).not.toHaveClass(/flipped|answer-confirmation/);
    await page.locator(mode === 'button' ? '#answerMeaningBtn' : '#vocabCard').click();
    await expect(page.locator('.answer-confirmation-next')).toBeVisible();
});
}

test('正解後の意味：確認中も無料版の時間制限を維持する', async ({ page }) => {
    await page.evaluate(() => { setShowMeaningOnCorrect(true); startLearningSession(); });
    await page.locator('#vocabCard').click();
    const answered = await current(page);
    await page.evaluate(() => { isTrialLimitDisabledForLocalDevelopment = () => false; trialState.playTimeSeconds = 480; });
    await page.locator('.answer-confirmation-next').click();
    await expect(page.locator('#trialOverlay')).toBeVisible();
    expect(await current(page)).toEqual(answered);
});
