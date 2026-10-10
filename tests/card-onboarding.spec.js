const { test, expect } = require('@playwright/test');
const errors = new WeakMap();
const tutorialOrigin = 'http://onboarding.test';
const closeName = '単語カードの説明を閉じる';
const meaningCloseName = '意味カードの説明を閉じる';

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    const fileOrigin = new URL(baseURL);
    if (fileOrigin.hostname === 'localhost') fileOrigin.hostname = '127.0.0.1';
    let pendingFile = Promise.resolve();
    // Local files on a virtual production-like origin; never contact external services.
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== tutorialOrigin) return route.abort();
        const response = pendingFile.then(() => page.request.get(`${fileOrigin.origin}${url.pathname}${url.search}`));
        pendingFile = response.catch(() => {});
        await route.fulfill({ response: await response });
    });
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 1 }));
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
            getVoices: () => [{ name: 'Google US English', lang: 'en-US' }], speak() {}, cancel() {}
        } });
        window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    });
    await page.goto(`${tutorialOrigin}/index.html`);
    await expect(page.locator('.card-tutorial-note').first()).toBeVisible();
    await expect(page.locator('#liveTutorialHint')).toBeHidden();
    await expect(page.getByText('カードの使い方', { exact: true })).toHaveCount(0);
});
test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
    expect(errors.get(page)).toEqual([]);
});

const snapshot = page => page.evaluate(() => JSON.stringify({ word: gameState.currentWord, states: gameState.wordStates,
    srs: gameState.srsData, count: gameState.globalQuestionCount, score: gameState.reviewScore,
    flipped: gameState.meaningCardFlipped, undo: gameStateHistory, saved: localStorage.getItem('vocabClickerSave') }));
async function showApple(page) {
    await page.evaluate(() => showWord(Object.values(vocabularyDatabase).flat().find(item => item.word === 'apple')));
    await expect(page.locator('.word-text-main')).toHaveText('apple');
}
async function settle(page) {
    await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
}

test('初回カード案内：開始前も案内を読め、閉じると通常サイズに戻る', async ({ page }, testInfo) => {
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await settle(page);
        await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
        const [prompt, note] = await Promise.all([page.locator('#vocabWord').boundingBox(), page.locator('#vocabCardTutorialHint').boundingBox()]);
        expect(prompt.y + prompt.height).toBeLessThanOrEqual(note.y);
        expect(await page.getByRole('button', { name: closeName }).evaluate(element => {
            const rect = element.getBoundingClientRect();
            return element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
        })).toBe(true);
        await page.screenshot({ path: `screenshots/card-onboarding-start-${width}-${testInfo.project.name}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.getByRole('button', { name: closeName }).click();
    await expect(page.locator('#meaningCardTutorialHint')).toBeVisible();
    await page.getByRole('button', { name: meaningCloseName }).click();
    await expect(page.locator('.has-card-tutorial')).toHaveCount(0);
    await page.screenshot({ path: `screenshots/card-onboarding-closed-390-${testInfo.project.name}.png`, fullPage: true });
});

test('初回カード案内：初回は2枚に3項目を表示し、回答で案内を切り替えない', async ({ page }) => {
    await expect(page.locator('#vocabCardTutorialHint li')).toHaveText(['わかったらタップ', '意味は表示されません', '初回は「完璧」に分類']);
    await expect(page.locator('#meaningCardTutorialHint li')).toHaveText(['わからなかったらタップ', '意味を表示', '「苦手」に分類']);
    await expect(page.locator('#liveTutorialActionBtn')).toBeHidden();
    await expect(page.locator('#vocabCard')).toHaveAccessibleDescription('わかったらタップ 意味は表示されません 初回は「完璧」に分類');
    await expect(page.locator('#meaningCard')).toHaveAccessibleDescription('わからなかったらタップ 意味を表示 「苦手」に分類');
    expect(await page.evaluate(() => gameState.globalQuestionCount)).toBe(0);
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => Object.values(gameState.srsData).reduce((sum, item) => sum + (item.recentAnswers?.length || 0), 0))).toBe(0);
    await showApple(page);
    const key = await page.evaluate(() => getWordKeySafe(gameState.currentWord));
    await page.locator('#vocabCardTutorialHint li').first().click();
    expect(await page.evaluate(key => ({ answers: gameState.srsData[key].recentAnswers,
        state: gameState.wordStates[key], flipped: gameState.meaningCardFlipped,
        count: gameState.globalQuestionCount }), key)).toEqual({ answers: [true], state: 'perfect', flipped: false, count: 2 });
    await expect(page.locator('.card-tutorial-note').first()).toBeVisible();
    const meaningKey = await page.evaluate(() => getWordKeySafe(gameState.currentWord));
    const meaning = await page.evaluate(() => gameState.currentWord.meaning);
    await page.locator('#meaningCardTutorialHint li').first().click();
    await expect(page.locator('#meaningText')).toBeVisible();
    await expect(page.locator('#meaningText')).toContainText(meaning);
    expect(await page.evaluate(key => ({ answers: gameState.srsData[key].recentAnswers,
        state: gameState.wordStates[key], flipped: gameState.meaningCardFlipped,
        count: gameState.globalQuestionCount, step: window.liveTutorialState.step }), meaningKey))
        .toEqual({ answers: [false], state: 'weak', flipped: true, count: 2, step: 0 });
    await expect(page.locator('.card-tutorial-note')).toHaveCount(2);
});

test('初回カード案内：×だけでは回答せず、閉じた状態を再読込後も保持する', async ({ page }) => {
    const before = await snapshot(page);
    expect(await page.evaluate(() => isInstallGuideBlockedByImportantUi())).toBe(true);
    const close = page.getByRole('button', { name: closeName });
    await close.focus();
    await close.press('Enter');
    await expect(page.locator('#vocabCardTutorialHint')).toHaveCount(0);
    await expect(page.locator('#meaningCardTutorialHint')).toBeVisible();
    expect(await page.evaluate(() => isInstallGuideBlockedByImportantUi())).toBe(true);
    await expect(page.getByRole('button', { name: meaningCloseName })).toBeFocused();
    expect(await snapshot(page)).toBe(before);
    await page.getByRole('button', { name: meaningCloseName }).press('Enter');
    await expect(page.locator('#liveTutorialHint')).toBeHidden();
    await expect(page.locator('.card-tutorial-note, .has-card-tutorial')).toHaveCount(0);
    expect(await page.evaluate(() => isInstallGuideBlockedByImportantUi())).toBe(false);
    await expect(page.locator('#vocabCard')).not.toHaveAttribute('aria-describedby');
    await expect(page.locator('#meaningCard')).not.toHaveAttribute('aria-describedby');
    await expect(page.locator('#vocabCard')).toBeFocused();
    expect(await snapshot(page)).toBe(before);
    expect(await page.evaluate(() => [localStorage.getItem('vocabGame_skipLiveTutorial'), localStorage.getItem('vocabGame_onboardingVersion')])).toEqual(['true', '2']);
    await page.reload();
    await expect(page.locator('#liveTutorialHint')).toBeHidden();
    await expect(page.locator('.card-tutorial-note')).toHaveCount(0);
    expect(await page.evaluate(() => window.liveTutorialState.active)).toBe(false);
});

test('初回カード案内：×で閉じるまでは再読込しても案内を表示する', async ({ page }) => {
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => localStorage.getItem('vocabClickerSave'))).not.toBeNull();
    await page.reload();
    await expect(page.locator('.card-tutorial-note').first()).toBeVisible();
    await expect(page.locator('.card-tutorial-note')).toHaveCount(2);
    expect(await page.evaluate(() => localStorage.getItem('vocabGame_skipLiveTutorial'))).toBeNull();
});

test('初回カード案内：従来の完了設定・旧案内・既存保存がある人には再表示しない', async ({ page }) => {
    for (const key of ['vocabGame_onboardingVersion', 'vocabGame_skipWelcome', 'vocabGame_skipLiveTutorial', 'vocabClickerSave']) {
        await page.evaluate(key => {
            const save = localStorage.getItem('vocabClickerSave');
            ['vocabGame_onboardingVersion', 'vocabGame_skipWelcome', 'vocabGame_skipLiveTutorial', 'vocabGame_cardTutorialSeen', 'vocabGame_cardTutorialDismissed', 'vocabClickerSave'].forEach(item => localStorage.removeItem(item));
            localStorage.setItem(key, key === 'vocabClickerSave' ? save : key === 'vocabGame_onboardingVersion' ? '2' : 'true');
        }, key);
        await page.reload();
        await expect(page.locator('#liveTutorialHint')).toBeHidden();
        await expect(page.locator('.card-tutorial-note')).toHaveCount(0);
        expect(await page.evaluate(() => localStorage.getItem('vocabGame_onboardingVersion'))).toBe('2');
    }
});

test('初回カード案内：320〜1280px・スクロール・意味表示でも対応カード内に収まる', async ({ page }, testInfo) => {
    await page.locator('#vocabCard').click();
    await showApple(page);
    for (const width of [320, 390, 768, 769, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await settle(page);
        const before = await snapshot(page);
        const measure = () => page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect();
            const fits = (inner, outer) => inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
            const vocab = rect('#vocabCard'), meaning = rect('#meaningCard');
            const vn = rect('#vocabCardTutorialHint'), mn = rect('#meaningCardTutorialHint');
            const word = rect('.vocab-word-stack'), front = rect('#meaningCard .card-front'), back = rect('#meaningCard .card-back');
            const closes = [...document.querySelectorAll('.card-tutorial-close')].map(button => button.getBoundingClientRect());
            return { fits: fits(vn, vocab) && fits(mn, meaning), noOverlap: word.bottom <= vn.top && front.bottom <= mn.top && back.bottom <= mn.top,
                vocabGap: Math.round(vocab.bottom - vn.bottom), meaningGap: Math.round(meaning.bottom - mn.bottom),
                closeFits: closes.every(close => close.width >= 44 && close.height >= 44), pageFits: document.documentElement.scrollWidth <= innerWidth };
        });
        await expect.poll(measure, `${width}px`).toMatchObject({ fits: true, noOverlap: true, vocabGap: 15, meaningGap: 15, closeFits: true, pageFits: true });
        const normal = await measure();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        expect(await measure()).toEqual(normal);
        await page.evaluate(() => window.scrollTo(0, 0));
        expect(await snapshot(page)).toBe(before);
        if ([320, 390, 1280].includes(width)) await page.locator('.cards-section').screenshot({ path: `screenshots/card-onboarding-learning-${width}-${testInfo.project.name}.png` });
    }
    await page.locator('#meaningCard').click();
    await expect(page.locator('#meaningText')).toBeVisible();
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await settle(page);
        const [content, note, label] = await Promise.all([page.locator('#meaningText').boundingBox(), page.locator('#meaningCardTutorialHint').boundingBox(), page.locator('#meaningCard .card-label').boundingBox()]);
        expect(content.y + content.height).toBeLessThanOrEqual(note.y);
        expect(content.y).toBeGreaterThanOrEqual(label.y + label.height);
        await page.locator('.cards-section').screenshot({ path: `screenshots/card-onboarding-meaning-${width}-${testInfo.project.name}.png` });
    }
});

test('初回カード案内：カード再生成・Undoでも重複せず、閉じると通常の配置へ戻る', async ({ page }) => {
    await page.locator('#vocabCard').click();
    await showApple(page);
    const before = await snapshot(page);
    await page.evaluate(() => { setupCardListeners(); setupCardListeners(); });
    expect(await snapshot(page)).toBe(before);
    await expect(page.locator('.card-tutorial-note')).toHaveCount(2);
    await page.evaluate(() => { showNoWordsMessage(); hideNoWordsMessage(); showWord(gameState.currentWord); });
    await expect(page.locator('#vocabCardTutorialHint')).toBeVisible();
    await expect(page.locator('#meaningCardTutorialHint')).toBeVisible();
    await page.locator('#vocabCard').click();
    expect(await page.evaluate(() => gameState.globalQuestionCount)).toBe(2);
    await page.locator('#undoBtn').click();
    await expect(page.locator('.word-text-main')).toHaveText('apple');
    await expect(page.locator('.card-tutorial-note')).toHaveCount(2);
    await page.getByRole('button', { name: closeName }).click();
    await page.getByRole('button', { name: meaningCloseName }).click();
    await settle(page);
    expect(await page.locator('.word-text-main').evaluate(element => {
        const word = element.getBoundingClientRect(), card = document.getElementById('vocabCard').getBoundingClientRect();
        return Math.abs(word.top + word.height / 2 - card.top - card.height / 2) < 1;
    })).toBe(true);
});

test('初回カード案内：片方だけ閉じた状態を保持し、意味側の閉じるでも回答しない', async ({ page }) => {
    await page.locator('#vocabCard').click();
    await showApple(page);
    const before = await snapshot(page);
    await page.getByRole('button', { name: meaningCloseName }).click();
    expect(await snapshot(page)).toBe(before);
    await expect(page.locator('#meaningCardTutorialHint')).toHaveCount(0);
    await expect(page.locator('#vocabCardTutorialHint')).toBeVisible();
    await page.reload();
    await expect(page.locator('#meaningCardTutorialHint')).toHaveCount(0);
    await expect(page.locator('#vocabCardTutorialHint')).toBeVisible();
    await page.getByRole('button', { name: closeName }).click();
    await page.reload();
    await expect(page.locator('.card-tutorial-note')).toHaveCount(0);
});

test('初回カード案内：復習球の上余白を詰め、案内とポップアップはカードに重ならない', async ({ page }, testInfo) => {
    await page.locator('#vocabCard').click();
    for (const count of [1, 101, 0]) {
        await page.evaluate(count => {
            gameState.currentLevel = 'basic';
            gameState.currentMode = 'unlearned';
            gameState.reviewMode = count === 0 ? 'on' : 'off';
            gameState.wordStates = {};
            gameState.srsData = {};
            gameState.decks = null;
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
            setReviewRecommendationEnabled(false);
            updateDisplay();
        }, count);
        await showApple(page);
        await expect(page.locator('#reviewProgressWrap')).toBeVisible();
        await expect(page.locator('#reviewProgressLabel')).toHaveText(`復習キュー ${count}件`);
        for (const width of [320, 390, 768, 769, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await settle(page);
            const layout = () => page.evaluate(() => {
                const rect = selector => {
                    const { top, bottom, height } = document.querySelector(selector).getBoundingClientRect();
                    return { top, bottom, height };
                };
                return { queue: rect('#reviewProgressWrap'), balls: rect('#reviewQueuePreview'),
                    selector: rect('.learning-header .mode-buttons'), cards: rect('#cardsArea') };
            });
            const before = await layout();
            expect(before.queue.top).toBeGreaterThan(before.selector.bottom);
            expect(before.queue.bottom).toBeLessThan(before.cards.top);
            if (width <= 768) expect(before.queue.top - 170, `${width}px below white boundary`).toBe(12);
            else expect(before.queue.top - before.selector.bottom).toBe(20);
            expect(await page.locator('#liveTutorialHint').evaluate(element => element.getBoundingClientRect().height)).toBe(0);
            await expect(page.locator('.card-tutorial-note')).toHaveCount(2);
            if (count === 101) {
                await page.evaluate(() => setReviewRecommendationEnabled(true));
                await expect(page.locator('#reviewRecommendation')).toBeVisible();
                expect(await layout()).toEqual(before);
                const popover = await page.locator('#reviewRecommendation').boundingBox();
                expect(popover.y + popover.height, `${width}px popup before cards`).toBeLessThan(before.cards.top);
                for (const selector of ['#reviewModeInlineLabel', '#reviewQueueShuffleButton', '.card-tutorial-close']) {
                    for (const control of await page.locator(selector).all()) {
                        await control.scrollIntoViewIfNeeded();
                        expect(await control.evaluate(element => {
                            const bounds = element.getBoundingClientRect();
                            return element.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2));
                        }), `${width}px ${selector}`).toBe(true);
                    }
                }
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.evaluate(() => renderReviewRecommendation(buildReviewQueueSnapshot()));
            }
            if ([320, 390, 1280].includes(width) && (count === 101 || width === 390)) {
                await page.screenshot({ path: `screenshots/review-spacing-${count}-${width}-${testInfo.project.name}.png`, fullPage: true });
            }
            await page.evaluate(() => setReviewRecommendationEnabled(false));
            expect(await layout()).toEqual(before);
        }
    }
    const beforeClose = await snapshot(page);
    await page.getByRole('button', { name: closeName }).click();
    await page.getByRole('button', { name: meaningCloseName }).click();
    expect(await snapshot(page)).toBe(beforeClose);
    await expect(page.locator('.card-tutorial-note')).toHaveCount(0);
});
