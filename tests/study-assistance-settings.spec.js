const { test, expect } = require('@playwright/test');
const pageErrors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    const errors = [];
    pageErrors.set(page, errors);
    page.on('pageerror', error => errors.push(error.message));
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
    });
    await page.goto('/index.html');
    await page.waitForFunction(() => !!window.WordIllustrations && typeof renderReviewRecommendation === 'function');
});

test.afterEach(async ({ page }) => {
    expect(pageErrors.get(page)).toEqual([]);
});

async function openSettings(page, category = '復習') {
    await page.getByRole('button', { name: 'その他メニュー', exact: true }).click();
    await page.getByRole('button', { name: '出題・復習・表示設定', exact: true }).click();
    await expect(page.locator('#studyModeModal')).toBeVisible();
    await page.getByRole('tab', { name: category, exact: true }).click();
}

async function seedDue(page, count, mode = 'off') {
    return page.evaluate(({ count, mode }) => {
        gameState.currentLevel = 'basic';
        gameState.currentMode = 'unlearned';
        gameState.reviewMode = mode;
        gameState.mixCycleCounter = 7;
        gameState.randomMode = false;
        gameState.decks = null;
        gameState.wordStates = {};
        gameState.srsData = {};
        gameState.activeReviewLevels = ['basic'];
        gameState.posFilters = ['名', '動', '形', '副', '助', '前', '接', '代', 'other'];
        const words = [...new Map(vocabularyDatabase.basic.map(word => [getWordKeySafe(word, 'basic'), word])).values()].slice(0, count);
        for (const word of words) {
            const key = getWordKeySafe(word, 'basic');
            gameState.wordStates[key] = 'weak';
            gameState.srsData[key] = { dueAt: Date.now() - 1000, reviewStep: 1, scheduledIntervalDays: 1,
                recentAnswers: [false], successCount: 0, failCount: 1, everWrong: true };
        }
        loadVocabularyForLevel();
        invalidateLearningProgressSnapshot();
        activateLearningSessionUI();
        const snapshot = updateDisplay();
        showNextWord(snapshot);
        return { count: snapshot.dueWords.length,
            savedMode: gameState.reviewMode, isReview: gameState.isReviewWord,
            currentKey: getWordKeySafe(gameState.currentWord, gameState.currentWord.__sourceLevel || gameState.currentLevel) };
    }, { count, mode });
}

async function selectWord(page, word) {
    await page.evaluate(word => {
        const item = vocabularyDatabase.junior.find(item => item.word === word);
        openWordFromList('junior', encodeURIComponent(getWordKeySafe(item, 'junior')));
    }, word);
}

async function records(page) {
    return page.evaluate(() => JSON.stringify({ srs: gameState.srsData, states: gameState.wordStates,
        score: gameState.reviewScore, counts: gameState.actionCounts, word: gameState.currentWord,
        undo: gameStateHistory, save: localStorage.getItem('vocabClickerSave'), dirty: window.isDirty }));
}

test('復習案内：100個では非表示、101個でも強制切替せず分類・モードを維持', async ({ page }) => {
    for (const mode of ['off', 'random', 'on']) {
        const hundred = await seedDue(page, 100, mode);
        expect(hundred.count).toBe(100);
        expect(hundred.savedMode).toBe(mode);
        expect(hundred.isReview).toBe(mode === 'on');
        await expect(page.locator('#reviewRecommendation')).toBeHidden();
        const over = await seedDue(page, 101, mode);
        expect(over).toMatchObject({ count: 101, savedMode: mode, isReview: mode === 'on' });
        if (mode === 'on') {
            await expect(page.locator('#reviewRecommendation')).toBeHidden();
            await expect(page.locator('#learnedBtn')).toBeDisabled();
        } else {
            await expect(page.locator('#reviewRecommendation')).toBeVisible();
            await expect(page.locator('#reviewRecommendationText')).toHaveText('復習が溜まっています');
            await expect(page.locator('#reviewProgressLabel')).toHaveText('復習キュー 101件');
            await expect(page.locator('#learnedBtn')).toBeEnabled();
        }
        expect((await seedDue(page, 100, mode)).savedMode).toBe(mode);
    }
});

test('復習案内：設定で非表示にでき再読込でも維持し、保存・履歴は変えない', async ({ page }) => {
    await seedDue(page, 101, 'off');
    await page.evaluate(() => saveGame());
    await page.getByRole('button', { name: 'あとで', exact: true }).click();
    await openSettings(page);
    const before = await records(page);
    await expect(page.locator('[data-review-mode-option="off"]')).toBeEnabled();
    await page.getByRole('switch', { name: '復習のおすすめを表示', exact: true }).uncheck();
    await expect(page.locator('#reviewModeInlineLabel')).toHaveText('新規だけ');
    await expect(page.locator('#learnedBtn')).toBeEnabled();
    await expect(page.locator('[data-review-mode-option="off"]')).toBeEnabled();
    expect(await records(page)).toBe(before);
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('off');
    await page.reload();
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('off');
    await seedDue(page, 101, 'off');
    await openSettings(page);
    await expect(page.locator('#reviewRecommendationEnabled')).not.toBeChecked();
    await page.locator('#reviewRecommendationEnabled').check();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await page.getByRole('button', { name: '出題・復習・表示設定を閉じる', exact: true }).click();
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('off');
});

test('復習案内：本人がボタンを押したときだけ復習専用へ切替、配点・Undoは従来どおり', async ({ page }, testInfo) => {
    await seedDue(page, 101, 'off');
    const unchanged = await records(page);
    for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('#reviewRecommendation')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const layout = await page.locator('#reviewRecommendation').evaluate(notice => {
            const hint = notice.getBoundingClientRect();
            const header = notice.closest('.review-progress-header').getBoundingClientRect();
            const action = notice.querySelector('.review-recommendation-action').getBoundingClientRect();
            const later = notice.querySelector('.review-recommendation-later').getBoundingClientRect();
            return { left: hint.left, right: hint.right, top: hint.top, bottom: hint.bottom,
                width: hint.width, height: hint.height, anchorRight: header.right, anchorBottom: header.bottom,
                actionStart: action.left, laterEnd: later.right, actionHeight: action.height, laterHeight: later.height };
        });
        expect(layout.left).toBeGreaterThanOrEqual(16);
        expect(layout.right).toBeLessThanOrEqual(width - 16);
        expect(layout.top).toBeGreaterThanOrEqual(16);
        expect(layout.bottom).toBeLessThanOrEqual(884);
        expect(layout.width).toBeLessThanOrEqual(240);
        expect(layout.height).toBeLessThanOrEqual(60);
        expect(layout.right).toBeCloseTo(layout.anchorRight, 0);
        expect(layout.top - layout.anchorBottom).toBeCloseTo(3, 0);
        expect(layout.laterEnd).toBeLessThanOrEqual(layout.actionStart);
        expect(layout.actionHeight).toBeGreaterThanOrEqual(44);
        expect(layout.laterHeight).toBeGreaterThanOrEqual(44);
        await expect(page.getByRole('region', { name: /復習が\s*溜まっています/ })).toBeVisible();
        expect(await page.locator('#reviewProgressWrap #reviewRecommendation').count()).toBe(1);
        expect(await page.locator('#reviewRecommendation [aria-modal], #reviewRecommendation [role="dialog"]').count()).toBe(0);
        // The hint must not cover answer cards or existing queue controls.
        for (const selector of ['#vocabCard', '#meaningCard', '#reviewModeInlineLabel', '#reviewQueueShuffleButton', '#otherMenuBtn', '#currentIllustrationBtn']) {
            if (!await page.locator(selector).isVisible()) continue;
            expect(await page.locator(selector).evaluate(control => {
                const rect = control.getBoundingClientRect();
                return control.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
            })).toBe(true);
        }
        await page.screenshot({ path: `screenshots/review-recommendation-${width}-${testInfo.project.name}.png` });
        await page.locator('.review-recommendation-content').screenshot({ path: `screenshots/review-recommendation-detail-${width}-${testInfo.project.name}.png` });
    }
    expect(await records(page)).toBe(unchanged);
    await page.getByRole('button', { name: '復習する', exact: true }).click();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    expect(await page.evaluate(() => ({ mode: gameState.reviewMode, review: gameState.isReviewWord }))).toEqual({ mode: 'on', review: true });
    const key = await page.evaluate(() => getWordKeySafe(gameState.currentWord, gameState.currentWord.__sourceLevel || gameState.currentLevel));
    const before = await page.evaluate(() => gameState.reviewScore.total);
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => ({ count: buildReviewQueueSnapshot().dueWords.length, mode: gameState.reviewMode,
        score: gameState.reviewScore.total, savedMode: gameState.reviewMode }))).toEqual({ count: 100, mode: 'on', score: before + 3, savedMode: 'on' });
    await page.evaluate(() => setReviewRecommendationEnabled(false));
    await page.locator('#undoBtn').click();
    expect(await page.evaluate(() => ({ count: buildReviewQueueSnapshot().dueWords.length, mode: gameState.reviewMode,
        score: gameState.reviewScore.total, key: getWordKeySafe(gameState.currentWord, gameState.currentWord.__sourceLevel || gameState.currentLevel),
        enabled: reviewRecommendationEnabled }))).toEqual({ count: 101, mode: 'on', score: before, key, enabled: false });
    await page.evaluate(() => setReviewRecommendationEnabled(true));
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('on');
});

test('復習案内：表示・非表示で余白やカードの縦位置を変えない', async ({ page }) => {
    await page.evaluate(() => setReviewRecommendationEnabled(false));
    await seedDue(page, 101, 'off');
    const measure = () => page.evaluate(() => ({
        scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        elements: ['.container', '#reviewProgressWrap', '.review-progress-header', '#reviewQueuePreview', '#cardsArea', '#exampleArea']
            .map(selector => {
                const element = document.querySelector(selector);
                const rect = element.getBoundingClientRect();
                return { selector, top: rect.top, height: rect.height, paddingTop: getComputedStyle(element).paddingTop };
            })
    }));
    for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
        await page.setViewportSize(viewport);
        const before = await measure();
        await page.evaluate(() => setReviewRecommendationEnabled(true));
        await expect(page.locator('#reviewRecommendation')).toBeVisible();
        const after = await measure();
        expect(after).toEqual(before);
        await page.evaluate(() => setReviewRecommendationEnabled(false));
        await expect(page.locator('#reviewRecommendation')).toBeHidden();
        expect(await measure()).toEqual(before);
    }
});

test('復習案内：期限前・対象外を数えず、一覧からの学習を妨げない', async ({ page }) => {
    await seedDue(page, 102);
    const future = await page.evaluate(() => {
        const snapshot = buildReviewQueueSnapshot();
        for (const word of snapshot.dueWords.slice(0, 2)) {
            gameState.srsData[getWordKeySafe(word, 'basic')].dueAt = Date.now() + 3600000;
        }
        const next = updateDisplay();
        return { count: next.dueWords.length, mode: gameState.reviewMode };
    });
    expect(future).toEqual({ count: 100, mode: 'off' });
    await seedDue(page, 101);
    const manual = await page.evaluate(() => {
        const other = vocabularyDatabase.basic.find(word => !gameState.wordStates[getWordKeySafe(word, 'basic')]);
        openWordFromList('basic', encodeURIComponent(getWordKeySafe(other, 'basic')));
        const chosenNewWord = !gameState.isReviewWord && gameState.currentWord.word === other.word;
        gameState.activeReviewLevels = ['junior'];
        updateDisplay();
        return { chosenNewWord, currentMode: gameState.currentMode, scopedMode: gameState.reviewMode };
    });
    expect(manual).toEqual({ chosenNewWord: true, currentMode: 'unlearned', scopedMode: 'off' });
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
});

test('復習案内：あとでなら学習を変えず、100以下の後に再び超えたら表示する', async ({ page }) => {
    await seedDue(page, 101);
    const before = await records(page);
    await page.getByRole('button', { name: 'あとで', exact: true }).focus();
    await page.getByRole('button', { name: 'あとで', exact: true }).click();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await expect(page.locator('#vocabCard')).toBeFocused();
    expect(await records(page)).toBe(before);
    await page.evaluate(() => updateReviewProgressUI());
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await seedDue(page, 102);
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await seedDue(page, 100);
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await seedDue(page, 101);
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
    await page.getByRole('button', { name: 'あとで', exact: true }).click();
    await page.locator('#reviewModeInlineLabel').click();
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('random');
});

test('復習案内：自動フォーカス・スクロール固定・履歴追加・Tabの閉込めをしない', async ({ page }) => {
    await seedDue(page, 100);
    await page.locator('#vocabCard').focus();
    const history = await page.evaluate(() => ({ length: window.history.length, state: window.history.state }));
    await seedDue(page, 101);
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
    await expect(page.locator('#vocabCard')).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/dismissible-modal-open/);
    expect(await page.evaluate(() => ({ length: window.history.length, state: window.history.state }))).toEqual(history);
    const before = await records(page);
    await page.getByRole('button', { name: 'あとで', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#reviewQueueShuffleButton')).toBeFocused();
    await page.getByRole('button', { name: '復習する', exact: true }).focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.getElementById('reviewRecommendation').contains(document.activeElement))).toBe(false);
    await page.locator('#vocabCard').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await expect(page.locator('#vocabCard')).toBeFocused();
    expect(await records(page)).toBe(before);
    await page.evaluate(() => updateReviewProgressUI());
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
});

test('復習案内：外側のカード・メニュー・出題切替は一度の操作で動き、案内だけ閉じる', async ({ page }) => {
    await seedDue(page, 101);
    const beforeAnswers = await page.evaluate(() => gameState.globalQuestionCount);
    await page.locator('#vocabCard').click();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('off');
    expect(await page.evaluate(() => gameState.globalQuestionCount)).toBeGreaterThan(beforeAnswers);
    await seedDue(page, 100);
    await seedDue(page, 101);
    await page.locator('#reviewModeInlineLabel').click();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    expect(await page.evaluate(() => gameState.reviewMode)).toBe('random');
    await seedDue(page, 100);
    await seedDue(page, 101);
    await openSettings(page);
    await expect(page.locator('#studyModeModal')).toBeVisible();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await page.getByRole('button', { name: '出題・復習・表示設定を閉じる', exact: true }).click();
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
});

test('復習案内：学習開始を待ち、設定画面・意味の確認中には割り込まない', async ({ page }) => {
    await page.evaluate(() => setReviewRecommendationEnabled(false));
    await seedDue(page, 101);
    await page.evaluate(() => saveGame());
    await page.reload();
    await page.evaluate(() => setReviewRecommendationEnabled(true));
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    expect(await page.evaluate(() => learningSessionStarted)).toBe(false);
    await page.locator('#vocabCard').click();
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
    await page.getByRole('button', { name: 'あとで', exact: true }).click();
    await seedDue(page, 100);
    await openSettings(page);
    await seedDue(page, 101);
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await expect(page.locator('#studyModeModal')).toBeVisible();
    await page.getByRole('button', { name: '出題・復習・表示設定を閉じる', exact: true }).click();
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
    await page.getByRole('button', { name: 'あとで', exact: true }).click();
    await seedDue(page, 100);
    await page.evaluate(() => setReviewRecommendationEnabled(false));
    await seedDue(page, 101);
    await page.locator('#meaningCard').click();
    await page.evaluate(() => setReviewRecommendationEnabled(true));
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    expect(await page.evaluate(() => gameState.meaningCardFlipped)).toBe(true);
    await page.locator('#meaningCard').click();
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
});

test('復習案内：利用制限の画面より先に出ず、閉じる操作も制限を解除しない', async ({ page }) => {
    await seedDue(page, 100);
    await page.evaluate(() => document.getElementById('trialOverlay').style.display = 'flex');
    await seedDue(page, 101);
    await expect(page.locator('#reviewRecommendation')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#trialOverlay')).toBeVisible();
    await page.evaluate(() => {
        document.getElementById('trialOverlay').style.display = 'none';
        updateReviewProgressUI();
    });
    await expect(page.locator('#reviewRecommendation')).toBeVisible();
});

test('イラスト常時：状態表示から設定へ直行し、学習を開始せずキーボードと戻るも使える', async ({ page }) => {
    const badge = page.getByRole('button', { name: 'イラスト常時表示中：表示設定を開く', exact: true });
    await expect(page.locator('#illustrationModeButton')).toBeHidden();
    await openSettings(page, '表示');
    await page.locator('#illustrationAlwaysVisible').check();
    await page.getByRole('button', { name: '出題・復習・表示設定を閉じる', exact: true }).click();
    await expect(badge).toBeVisible();
    await expect(badge).toBeEnabled();
    await expect(badge).toHaveText('イラスト常時表示中');
    const before = await records(page);
    expect(await page.evaluate(() => learningSessionStarted)).toBe(false);
    for (const action of ['click', 'Enter', 'Space']) {
        if (action === 'click') await badge.click();
        else await badge.press(action);
        await expect(page.locator('#studyModeModal')).toBeVisible();
        await expect(page.getByRole('tab', { name: '表示', exact: true })).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#illustrationAlwaysVisible')).toBeChecked();
        expect(await records(page)).toBe(before);
        expect(await page.evaluate(() => learningSessionStarted)).toBe(false);
        if (action === 'Space') await page.goBack();
        else await page.keyboard.press('Escape');
        await expect(page.locator('#studyModeModal')).toBeHidden();
        await expect(badge).toBeFocused();
    }
    await badge.click();
    await page.locator('#illustrationAlwaysVisible').uncheck();
    await page.getByRole('button', { name: '出題・復習・表示設定を閉じる', exact: true }).click();
    await expect(page.locator('#illustrationModeButton')).toBeHidden();
    await expect(page.locator('#otherMenuBtn')).toBeFocused();
    expect(await records(page)).toBe(before);
});

test('イラスト常時：状態表示は次問・Undo・再読込・カード再生成でも保ち、設定を開いても回答しない', async ({ page }) => {
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await selectWord(page, 'apple');
    const badge = page.locator('#illustrationModeButton');
    await expect(badge).toBeVisible();
    const before = await records(page);
    const flipped = await page.evaluate(() => gameState.meaningCardFlipped);
    await badge.click();
    expect(await records(page)).toBe(before);
    expect(await page.evaluate(() => gameState.meaningCardFlipped)).toBe(flipped);
    await page.keyboard.press('Escape');
    await page.locator('#vocabCard').click();
    await expect(badge).toBeVisible();
    await page.locator('#undoBtn').click();
    await expect(badge).toBeVisible();
    await page.reload();
    await expect(badge).toBeVisible();
    await page.evaluate(() => {
        showNoWordsMessage();
        hideNoWordsMessage();
        showLearningStartPrompt();
    });
    await expect(badge).toBeVisible();
    await badge.click();
    await expect(page.getByRole('tab', { name: '表示', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('イラスト常時：状態表示は320〜1280pxで見出し・イラスト・回答を覆わない', async ({ page }, testInfo) => {
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await selectWord(page, 'apple');
    for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        const layout = await page.locator('#illustrationModeButton').evaluate(button => {
            const rect = button.getBoundingClientRect();
            const card = button.closest('.meaning-card').getBoundingClientRect();
    const targets = ['.card-label', '#currentIllustrationBtn:not([hidden])', '.card-front'];
            const overlaps = targets.some(selector => {
                const target = button.parentElement.querySelector(selector);
                if (!target) return false;
                const other = target.getBoundingClientRect();
                return rect.left < other.right && other.left < rect.right && rect.top < other.bottom && other.top < rect.bottom;
            });
            return { fits: rect.left >= card.left && rect.right <= card.right && rect.top >= card.top && rect.bottom <= card.bottom,
                height: rect.height, overlaps, pageFits: document.documentElement.scrollWidth <= innerWidth };
        });
        expect(layout).toMatchObject({ fits: true, overlaps: false, pageFits: true });
        expect(layout.height).toBeGreaterThanOrEqual(44);
        if (width === 320 || width === 1280) await page.screenshot({ path: `screenshots/illustration-mode-${width}-${testInfo.project.name}.png` });
    }
    await page.locator('#illustrationModeButton').click();
    await expect(page.getByRole('tab', { name: '表示', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('イラスト常時：初期オフ、設定で回答前から表示し、解除しても採点・履歴を変えない', async ({ page }) => {
    await selectWord(page, 'apple');
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    await openSettings(page, '表示');
    const before = await records(page);
    const toggle = page.getByRole('switch', { name: 'イラストを常時表示', exact: true });
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    await expect(page.locator('#illustrationModeButton')).toBeVisible();
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
    expect(await records(page)).toBe(before);
    await toggle.uncheck();
    await expect(page.locator('#illustrationModeButton')).toBeHidden();
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    expect(await records(page)).toBe(before);
});

test('イラスト常時：イラストと同じ場所に一つだけ表示し、設定を変えても回答しない', async ({ page }) => {
    await selectWord(page, 'apple');
    const manual = page.locator('#currentIllustrationBtn');
    const mode = page.locator('#illustrationModeButton');
    await expect(manual).toBeVisible();
    await expect(mode).toBeHidden();
    const right = (await manual.boundingBox()).x + (await manual.boundingBox()).width;
    const before = await records(page);
    await manual.click();
    await expect(page.locator('#wordIllustrationSlot')).toBeVisible();
    expect(await records(page)).toBe(before);
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await expect(manual).toBeHidden();
    await expect(mode).toBeVisible();
    expect((await mode.boundingBox()).x + (await mode.boundingBox()).width).toBe(right);
    await expect(page.locator('#meaningCard button:not([hidden])')).toHaveCount(1);
    await mode.click();
    await expect(page.getByRole('tab', { name: '表示', exact: true })).toHaveAttribute('aria-selected', 'true');
    expect(await records(page)).toBe(before);
    await page.locator('#illustrationAlwaysVisible').uncheck();
    await page.keyboard.press('Escape');
    await expect(manual).toBeVisible();
    await expect(mode).toBeHidden();
    expect(await records(page)).toBe(before);
    await selectWord(page, 'quickly');
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await expect(mode).toBeVisible();
    await expect(manual).toBeHidden();
});

test('イラスト常時：次問・再読込・Undoでも表示し、画像なしでは通常表示', async ({ page }) => {
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await selectWord(page, 'apple');
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
    await page.locator('#vocabCard').click();
    await page.locator('#undoBtn').click();
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
    await selectWord(page, 'banana');
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /banana/);
    await page.reload();
    await selectWord(page, 'apple');
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
    await page.evaluate(() => {
        const word = vocabularyDatabase.junior.find(word => !WordIllustrations.find(word, 'junior', vocabularyDatabase));
        openWordFromList('junior', encodeURIComponent(getWordKeySafe(word, 'junior')));
    });
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    await openSettings(page, '表示');
    await expect(page.locator('#illustrationAlwaysVisible')).toBeChecked();
    await expect(page.locator('#illustrationModeButton')).toBeVisible();
});

test('イラスト常時：画像の読込遅延・失敗で前の絵を出さず、無料枠も維持', async ({ page }) => {
    await page.route('**/assets/word-illustrations/apple-*', async route => {
        await new Promise(resolve => setTimeout(resolve, 250));
        await route.continue();
    });
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await selectWord(page, 'apple');
    await selectWord(page, 'banana');
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /banana/);
    await page.waitForTimeout(300);
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /banana/);
    // Use an unrequested image: WebKit can reuse the already decoded apple.
    let failedRequests = 0;
    await page.route('**/assets/word-illustrations/orange-*', route => {
        failedRequests++;
        return route.abort();
    });
    await selectWord(page, 'orange');
    await expect.poll(() => failedRequests).toBeGreaterThan(0);
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    await expect(page.locator('#illustrationModeButton')).toBeVisible();
    const allowed = await page.evaluate(() => {
        gameState.currentLevel = 'illustrated';
        const paid = vocabularyDatabase.illustrated.find(word => !WordIllustrations.canUseWord(word, 'illustrated', vocabularyDatabase));
        gameState.currentWord = paid;
        showWord(paid);
        return { count: WordIllustrations.accessibleWords('illustrated', vocabularyDatabase).length,
            currentIsFree: WordIllustrations.canUseWord(gameState.currentWord, 'illustrated', vocabularyDatabase) };
    });
    expect(allowed).toEqual({ count: 100, currentIsFree: true });
});

test('イラスト常時：オフでも回答後の表示と手動表示は従来どおり', async ({ page }) => {
    await selectWord(page, 'apple');
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await page.locator('#meaningCard').click();
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(false));
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /apple/);
    await page.locator('#meaningCard').click();
    await selectWord(page, 'banana');
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    await page.locator('#currentIllustrationBtn').click();
    await expect(page.locator('#wordIllustration')).toHaveAttribute('src', /banana/);
});

test('復習案内：設定保存に失敗したら両スイッチと動作を元に戻す', async ({ page }) => {
    await selectWord(page, 'apple');
    await openSettings(page);
    await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            if (['vocabGame_reviewRecommendationEnabled', 'vocabGame_illustrationAlwaysVisible'].includes(key)) throw new Error('test quota');
            return original.call(this, key, value);
        };
    });
    await page.locator('#reviewRecommendationEnabled').click();
    await expect(page.locator('#reviewRecommendationEnabled')).toBeChecked();
    await expect(page.locator('#reviewRecommendationSettingsStatus')).toContainText('保存できなかったため');
    await page.getByRole('tab', { name: '表示', exact: true }).click();
    await page.locator('#illustrationAlwaysVisible').click();
    await expect(page.locator('#illustrationAlwaysVisible')).not.toBeChecked();
    await expect(page.locator('#illustrationVisibilityStatus')).toContainText('保存できなかったため');
    await expect(page.locator('#wordIllustrationSlot')).toBeHidden();
    await expect(page.locator('#illustrationModeButton')).toBeHidden();
});

test('イラスト常時：解除の保存失敗でもオンの状態表示と閉じた後のフォーカスを維持', async ({ page }) => {
    await page.evaluate(() => WordIllustrations.setAlwaysVisible(true));
    await selectWord(page, 'apple');
    const before = await records(page);
    const badge = page.locator('#illustrationModeButton');
    await badge.click();
    await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            if (key === 'vocabGame_illustrationAlwaysVisible') throw new Error('test quota');
            return original.call(this, key, value);
        };
    });
    await page.locator('#illustrationAlwaysVisible').click();
    await expect(page.locator('#illustrationAlwaysVisible')).toBeChecked();
    await expect(badge).toBeVisible();
    await expect(page.locator('#illustrationVisibilityStatus')).toContainText('保存できなかったため');
    await page.keyboard.press('Escape');
    await expect(badge).toBeFocused();
    expect(await records(page)).toBe(before);
});

test('イラスト常時：320px設定の操作・拡大・閉じる・フォーカス復帰を維持', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await selectWord(page, 'apple');
    await openSettings(page);
    for (const selector of ['#reviewRecommendationEnabled', '#illustrationAlwaysVisible']) {
        await page.getByRole('tab', { name: selector.includes('Recommendation') ? '復習' : '表示', exact: true }).click();
        await page.locator(selector).scrollIntoViewIfNeeded();
        const fits = await page.locator(selector).evaluate(input => {
            const label = input.closest('label').getBoundingClientRect();
            return label.left >= 0 && label.right <= innerWidth && label.height >= 44;
        });
        expect(fits).toBe(true);
    }
    await page.locator('#illustrationAlwaysVisible').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#illustrationAlwaysVisible')).toBeChecked();
    await page.screenshot({ path: `screenshots/study-assistance-settings-${testInfo.project.name}.png` });
    await page.getByRole('button', { name: '出題・復習・表示設定を閉じる', exact: true }).click();
    await expect(page.locator('#otherMenuBtn')).toBeFocused();
    await expect(page.locator('#wordIllustration')).toBeVisible();
    await page.locator('#wordIllustrationSlot').click();
    await expect(page.locator('#previousIllustrationModal')).toBeVisible();
    await page.waitForFunction(() => {
        const image = document.querySelector('#previousIllustrationImage img');
        return image?.complete && image.naturalWidth > 0;
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `screenshots/study-assistance-image-${testInfo.project.name}.png` });
    await page.keyboard.press('Escape');
    await expect(page.locator('#previousIllustrationModal')).toBeHidden();
    await expect(page.locator('#wordIllustrationSlot')).toBeFocused();
});
