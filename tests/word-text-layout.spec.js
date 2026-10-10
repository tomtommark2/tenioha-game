const { test, expect } = require('@playwright/test');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_installGuideDismissed', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 1 }));
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
            getVoices: () => [{ name: 'Google US English', lang: 'en-US' }], speak() {}, cancel() {}
        } });
        window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    });
    await page.goto('/index.html');
    await page.locator('#vocabCard').click();
});

test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function show(page, word) {
    await page.evaluate(word => {
        showWord(Object.values(vocabularyDatabase).flat().find(item => item.word === word)
            || { word, pos: '名', meaning: '表示確認用', example: '' });
    }, word);
    await expect(page.locator('.word-text-main')).toHaveText(word);
}

async function singleLine(page) {
    return page.locator('.word-text-main').evaluate(element => {
        const style = getComputedStyle(element), fontSize = parseFloat(style.fontSize);
        return element.getBoundingClientRect().height <= fontSize * 1.2 + 1
            && element.scrollWidth <= element.clientWidth + 1;
    });
}

test('単語表示：320・390・768・1280pxで長い収録語は一行、短い語は42px', async ({ page }) => {
    for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const word of ['businesswoman', 'environment', 'responsibility', 'international', 'telecommunications', 'apple']) {
            await show(page, word);
            await expect.poll(() => singleLine(page), `${width}px ${word}`).toBe(true);
            const size = await page.locator('.word-text-main').evaluate(element => parseFloat(getComputedStyle(element).fontSize));
            expect(size).toBeGreaterThanOrEqual(24);
            expect(size).toBeLessThanOrEqual(42);
            if (word === 'apple') expect(size).toBe(42);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await show(page, 'businesswoman');
    await page.screenshot({ path: test.info().outputPath('word-fit-320.png') });
});

test('単語表示：熟語は空白で折り返し、ハイフン付きの綴りも途中で切らない', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const phrase = 'as a matter of fact well-known';
    await show(page, phrase);
    await expect(page.locator('.word-text-token')).toHaveText(['as', 'a', 'matter', 'of', 'fact', 'well-known']);
    const layout = await page.locator('.word-text-main').evaluate(element => {
        const tokens = [...element.querySelectorAll('.word-text-token')];
        const fontSize = parseFloat(getComputedStyle(element).fontSize);
        return { lines: new Set(tokens.map(token => Math.round(token.getBoundingClientRect().top))).size,
            unbroken: tokens.every(token => token.getBoundingClientRect().height <= fontSize * 1.2 + 1),
            fits: element.scrollWidth <= element.clientWidth + 1 };
    });
    expect(layout).toMatchObject({ unbroken: true, fits: true });
    expect(layout.lines).toBeGreaterThan(1);
});

test('単語表示：回転・音声表示切替・Undo・カード再作成でも調整し学習データは不変', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await show(page, 'businesswoman');
    const snapshot = () => page.evaluate(() => JSON.stringify({ word: gameState.currentWord,
        states: gameState.wordStates, srs: gameState.srsData, count: gameState.globalQuestionCount,
        score: gameState.reviewScore, undo: gameStateHistory, saved: localStorage.getItem('vocabClickerSave') }));
    const before = await snapshot();
    for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(() => singleLine(page)).toBe(true);
        if (width === 1280) await expect(page.locator('.word-text-main')).toHaveCSS('font-size', '42px');
        await page.evaluate(() => updateSpeechSettings({ showWordButton: false }));
        await expect.poll(() => singleLine(page)).toBe(true);
        await page.evaluate(() => updateSpeechSettings({ showWordButton: true }));
    }
    await page.evaluate(() => { setupCardListeners(); setupCardListeners(); });
    await expect.poll(() => singleLine(page)).toBe(true);
    expect(await snapshot()).toBe(before);
    await page.locator('#vocabCard').click();
    await page.locator('#undoBtn').click();
    await expect(page.locator('.word-text-main')).toHaveText('businesswoman');
    await expect.poll(() => singleLine(page)).toBe(true);
    await page.evaluate(() => { showNoWordsMessage(); hideNoWordsMessage(); showWord(gameState.currentWord); });
    await expect.poll(() => singleLine(page)).toBe(true);
    await show(page, 'apple');
    await expect(page.locator('.word-text-main')).toHaveCSS('font-size', '42px');
});

test('単語表示：フォント読込後とカード幅だけの変更でも再調整する', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await show(page, 'businesswoman');
    await page.evaluate(async () => {
        const face = new FontFace('WordLayoutTest', 'url(/assets/ui/roboto-flex-latin.woff2)', { weight: '100 1000' });
        document.fonts.add(face);
        document.getElementById('vocabWord').style.fontFamily = 'WordLayoutTest, sans-serif';
        await face.load();
        await document.fonts.ready;
        if (face.status !== 'loaded') throw new Error('表示確認用フォントを読み込めませんでした。');
    });
    await expect.poll(() => singleLine(page)).toBe(true);
    await page.locator('#vocabWord').evaluate(element => { element.style.width = '200px'; });
    await expect.poll(() => singleLine(page)).toBe(true);
    await page.locator('#vocabWord').evaluate(element => { element.style.width = '100%'; });
    await expect.poll(() => singleLine(page)).toBe(true);
});

test('単語表示：極端に長い自作入力は24pxで先頭から末尾までスクロールできる', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const word = `custom-${'a'.repeat(110)}`;
    await show(page, word);
    const text = page.locator('.word-text-main');
    await expect(text).toHaveCSS('font-size', '24px');
    await expect(text).toHaveAttribute('tabindex', '0');
    expect(await text.evaluate(element => {
        const token = element.querySelector('.word-text-token');
        return Math.abs(token.getBoundingClientRect().left - element.getBoundingClientRect().left) < 1
            && element.scrollWidth > element.clientWidth;
    })).toBe(true);
    await text.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    expect(await text.evaluate(element => {
        const token = element.querySelector('.word-text-token');
        return element.scrollLeft > 0 && token.getBoundingClientRect().right <= element.getBoundingClientRect().right + 1;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('単語表示：短い語の不要な縦スクロールをなくし、本当に長い熟語だけスクロールする', async ({ page }) => {
    for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const word of ['angel', 'apple', 'gym', 'reply', 'businesswoman']) {
            await show(page, word);
            await expect(page.locator('.word-text-main')).toHaveCSS('overflow-y', 'visible');
            await expect(page.locator('.word-text-main')).not.toHaveAttribute('tabindex');
            await expect(page.locator('.word-text-main')).not.toHaveClass(/word-text-tall/);
        }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await show(page, Array(70).fill('as a matter of fact').join(' '));
    const text = page.locator('.word-text-main');
    await expect(text).toHaveClass(/word-text-tall/);
    await expect(text).toHaveAttribute('tabindex', '0');
    await expect(text).toHaveCSS('overflow-y', 'auto');
    expect(await text.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await text.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await text.evaluate(element => element.querySelector('.word-text-token:last-child').getBoundingClientRect().bottom <= element.getBoundingClientRect().bottom + 1)).toBe(true);
    await show(page, 'angel');
    await expect(text).toHaveCSS('overflow-y', 'visible');
});

test('単語表示：品詞は上部中央・単語は中央・復習理由は左上で切替えても動かない', async ({ page }, testInfo) => {
    for (const width of [320, 390, 768, 769, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const showWordButton of [true, false]) {
            await page.evaluate(showWordButton => updateSpeechSettings({ showWordButton }), showWordButton);
            for (const word of ['apple', 'businesswoman', 'record']) {
                await show(page, word);
                if (word === 'record') {
                    // Display fixture with two pronunciations; not a vocabulary data edit.
                    await page.evaluate(() => showWord({ word: 'record', pos: '名', meaning: '表示確認',
                        senses: [{ pos: '名', meaning: '表示確認', ipa: '/ˈrekərd/' },
                            { pos: '動', meaning: '表示確認', ipa: '/rɪˈkɔːrd/' }] }));
                    await expect(page.locator('.word-ipa-variant')).toHaveCount(2);
                }
                await page.evaluate(async () => {
                    const word = gameState.currentWord;
                    const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
                    gameState.srsData[key] = { recentAnswers: [true, true, true] };
                    gameState.isReviewWord = false;
                    gameState.currentQuestionReason = null;
                    setCardStatusVisible(true);
                    await document.fonts.ready;
                    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                });
                const snapshot = () => page.evaluate(() => JSON.stringify({ states: gameState.wordStates,
                    srs: gameState.srsData, score: gameState.reviewScore, count: gameState.globalQuestionCount,
                    undo: gameStateHistory, saved: localStorage.getItem('vocabClickerSave') }));
                const before = await snapshot();
                const positions = () => page.evaluate(() => {
                    const rect = selector => {
                        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
                        return { x, y, width, height };
                    };
                    return ['#vocabCard', '#meaningCard', '#exampleArea', '#vocabWord', '.word-text-main', '.word-ipa'].map(rect);
                });
                const normal = await positions();
                await expect(page.locator('#vocabCard > .card-label')).toHaveCount(0);
                await expect(page.locator('.card-accuracy')).toHaveText('100%');
                const balance = await page.evaluate(() => {
                    const card = document.getElementById('vocabCard').getBoundingClientRect();
                    const pos = document.querySelector('.word-pos-label').getBoundingClientRect();
                    const word = document.querySelector('.word-text-main').getBoundingClientRect();
                    return { posCenter: (pos.left + pos.right - card.left - card.right) / 2,
                        posTop: pos.top - card.top,
                        wordCenterX: (word.left + word.right - card.left - card.right) / 2,
                        wordCenterY: (word.top + word.bottom - card.top - card.bottom) / 2 };
                });
                expect(Math.abs(balance.posCenter)).toBeLessThan(0.1);
                expect(balance.posTop).toBeGreaterThanOrEqual(14);
                expect(balance.posTop).toBeLessThanOrEqual(16);
                expect(Math.abs(balance.wordCenterX)).toBeLessThan(0.1);
                expect(Math.abs(balance.wordCenterY)).toBeLessThan(0.1);
                const capture = width === 390 && showWordButton && word === 'apple';
                if (capture) {
                    await page.locator('#cardsArea').screenshot({ path: `screenshots/review-question-normal-390-${testInfo.project.name}.png` });
                }
                for (const [reason, text] of [['due-weak', '苦手の復習'], ['due-learned', '得意の定着チェック']]) {
                    await page.evaluate(reason => {
                        gameState.isReviewWord = true;
                        gameState.currentQuestionReason = reason;
                        updateQuestionReasonUI();
                    }, reason);
                    await expect(page.locator('#questionReasonLabel')).toHaveText(text);
                    await expect(page.locator('.word-ipa')).toBeVisible();
                    expect(await positions(), `${width}px ${word}, speech ${showWordButton}, ${reason}`).toEqual(normal);
                    const layout = await page.evaluate(() => {
                        const card = document.getElementById('vocabCard').getBoundingClientRect();
                        const reason = document.getElementById('questionReasonLabel').getBoundingClientRect();
                        const word = document.querySelector('.word-text-main').getBoundingClientRect();
                        const pos = document.querySelector('.word-pos-label').getBoundingClientRect();
                        const others = [document.querySelector('.card-accuracy'), document.getElementById('wordSpeechBtn')]
                            .filter(el => el && !el.hidden).map(el => el.getBoundingClientRect());
                        const separate = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
                        return { left: reason.left - card.left, top: reason.top - card.top,
                            height: reason.height,
                            gap: word.top - Math.max(reason.bottom, pos.bottom), contained: reason.right <= card.right,
                            headerClear: separate(reason, pos) && others.every(rect => separate(reason, rect) && separate(pos, rect))
                                && (others.length < 2 || separate(others[0], others[1])),
                            pageFits: document.documentElement.scrollWidth <= innerWidth };
                    });
                    expect(layout.left).toBeGreaterThanOrEqual(14);
                    expect(layout.left).toBeLessThanOrEqual(16);
                    expect(layout.top).toBeGreaterThanOrEqual(14);
                    expect(layout.top).toBeLessThanOrEqual(16);
                    expect(layout.gap).toBeGreaterThanOrEqual(8);
                    expect(layout).toMatchObject({ contained: true, headerClear: true, pageFits: true });
                    if (capture) {
                        await page.locator('#cardsArea').screenshot({ path: `screenshots/review-question-${reason}-390-${testInfo.project.name}.png` });
                    }
                    if (width === 1280 && showWordButton && word === 'apple' && reason === 'due-weak') {
                        await page.screenshot({ path: `screenshots/review-question-1280-${testInfo.project.name}.png` });
                    }
                    await page.evaluate(() => setCardStatusVisible(false));
                    await expect(page.locator('#questionReasonLabel')).toBeHidden();
                    expect(await positions()).toEqual(normal);
                    await page.evaluate(() => setCardStatusVisible(true));
                    expect(await positions()).toEqual(normal);
                }
                await page.evaluate(() => {
                    gameState.isReviewWord = false;
                    gameState.currentQuestionReason = null;
                    updateQuestionReasonUI();
                });
                await expect(page.locator('#questionReasonLabel')).toBeHidden();
                expect(await positions()).toEqual(normal);
                expect(await snapshot()).toBe(before);
            }
        }
    }
});

test('単語表示：通常と苦手の復習の比較画像・カード寸法', async ({ page }, testInfo) => {
    const sizes = [];
    for (const width of [320, 390, 768, 769, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await show(page, 'apple');
        await page.evaluate(async () => {
            const word = gameState.currentWord;
            const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
            gameState.wordStates[key] = 'unlearned';
            gameState.srsData[key] = { recentAnswers: [] };
            gameState.isReviewWord = false;
            gameState.currentQuestionReason = null;
            setCardStatusVisible(true);
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const measure = () => page.evaluate(() => {
            const rect = id => {
                const { width, height } = document.getElementById(id).getBoundingClientRect();
                return { width, height };
            };
            return { vocab: rect('vocabCard'), meaning: rect('meaningCard') };
        });
        const normal = await measure();
        expect(normal.vocab.width).toBe(normal.meaning.width);
        if (width > 768) expect(normal.vocab.height).toBe(normal.meaning.height);
        if (width === 390 || width === 1280) {
            await page.locator('#cardsArea').screenshot({ path: `screenshots/review-question-preview-normal-${width}-${testInfo.project.name}.png` });
        }
        await page.evaluate(() => {
            const word = gameState.currentWord;
            const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
            gameState.wordStates[key] = 'weak';
            gameState.srsData[key] = { recentAnswers: [false, false, true] };
            gameState.isReviewWord = true;
            gameState.currentQuestionReason = 'due-weak';
            updateQuestionReasonUI();
        });
        await expect(page.locator('#questionReasonLabel')).toHaveText('苦手の復習');
        const review = await measure();
        expect(review).toEqual(normal);
        sizes.push({ width, normal, review });
        if (width === 390 || width === 1280) {
            await page.locator('#cardsArea').screenshot({ path: `screenshots/review-question-preview-weak-${width}-${testInfo.project.name}.png` });
        }
    }
    await testInfo.attach('card-sizes', { body: JSON.stringify(sizes, null, 2), contentType: 'application/json' });
});

test('単語表示：ハテナと承認済み復習ラベルを表示し、確認・Undo・再生成を保つ', async ({ page }, testInfo) => {
    for (const width of [320, 390, 768, 769, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await show(page, 'apple');
        await page.evaluate(async () => {
            const key = getWordKeySafe(gameState.currentWord);
            gameState.wordStates[key] = 'weak';
            gameState.srsData[key] = { recentAnswers: [true, false, true], successCount: 2, failCount: 1 };
            gameState.isReviewWord = true;
            gameState.currentQuestionReason = 'due-weak';
            setCardStatusVisible(true);
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const prompt = page.locator('#meaningCard .card-front .card-content');
        await expect(prompt).toHaveText('?');
        await expect(prompt).toHaveAccessibleName('意味を見る');
        const measure = () => page.evaluate(() => {
            const reason = document.getElementById('questionReasonLabel');
            const prompt = document.querySelector('#meaningCard .card-front .card-content');
            const style = getComputedStyle(prompt);
            const icon = getComputedStyle(prompt, '::before');
            const rect = prompt.getBoundingClientRect();
            const card = document.getElementById('meaningCard').getBoundingClientRect();
            return { width: rect.width, height: rect.height, background: style.backgroundColor,
                color: style.color, radius: style.borderRadius,
                iconWidth: icon.width, iconHeight: icon.height, iconMask: icon.maskImage || icon.webkitMaskImage,
                reasonBorder: getComputedStyle(reason).borderTopWidth,
                reasonMask: getComputedStyle(reason, '::before').maskImage || getComputedStyle(reason, '::before').webkitMaskImage,
                fits: rect.left >= card.left && rect.right <= card.right && rect.top >= card.top && rect.bottom <= card.bottom,
                card: { x: card.x, y: card.y, width: card.width, height: card.height } };
        });
        const before = await measure();
        expect(before).toMatchObject({ width: 58, height: 58, background: 'rgb(243, 240, 251)',
            color: 'rgb(103, 84, 140)', radius: '20px', iconWidth: '40px', iconHeight: '40px', reasonBorder: '0px', fits: true });
        expect(before.iconMask).toContain('assets/ui/question-mark-rounded.svg');
        expect(before.reasonMask).toContain('assets/ui/refresh-rounded.svg');
        for (const path of ['/assets/ui/question-mark-rounded.svg', '/assets/ui/refresh-rounded.svg']) {
            expect((await page.request.get(path)).ok()).toBe(true);
        }
        const meaning = await page.evaluate(() => gameState.currentWord.meaning);
        await prompt.click();
        await expect(page.locator('#meaningCard .card-back')).toBeVisible();
        await expect(page.locator('#meaningText')).toContainText(meaning);
        expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers)).toEqual([true, false, true, false]);
        expect((await measure()).card).toEqual(before.card);
        await page.locator('#undoBtn').click();
        await expect(prompt).toBeVisible();
        expect(await page.evaluate(() => gameState.srsData[getWordKeySafe(gameState.currentWord)].recentAnswers)).toEqual([true, false, true]);
        expect(await measure()).toEqual(before);
        await page.evaluate(() => {
            showNoWordsMessage();
            hideNoWordsMessage();
            showWord(gameState.currentWord);
        });
        await expect(prompt).toHaveText('?');
        await expect(prompt).toHaveAccessibleName('意味を見る');
        expect(await measure()).toEqual(before);
        if (width === 320) {
            await page.locator('#cardsArea').screenshot({ path: `screenshots/review-question-prompt-320-${testInfo.project.name}.png` });
        }
    }
});

test('単語表示：複数品詞・発音なし・再生成でも単語中央と上段を保つ', async ({ page }, testInfo) => {
    const fixtures = [
        { word: 'sample', pos: '名', meaning: '表示確認' },
        { word: 'sample', pos: '名', meaning: '表示確認', senses: ['名', '動', '形', '副'].map(pos => ({ pos, meaning: '表示確認' })) },
        { word: 'sample', pos: '長い品詞の表示確認', meaning: '表示確認' }
    ];
    for (const width of [320, 390, 769, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const fixture of fixtures) {
            await page.evaluate(async fixture => {
                showWord(fixture);
                gameState.isReviewWord = true;
                gameState.currentQuestionReason = 'due-learned';
                const key = getWordKeySafe(gameState.currentWord, gameState.currentLevel);
                gameState.srsData[key] = { recentAnswers: [true] };
                setCardStatusVisible(true);
                await document.fonts.ready;
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            }, fixture);
            await expect(page.locator('.word-ipa')).toHaveCount(0);
            const measure = () => page.evaluate(() => {
                const card = document.getElementById('vocabCard').getBoundingClientRect();
                const pos = document.querySelector('.word-pos-label').getBoundingClientRect();
                const word = document.querySelector('.word-text-main').getBoundingClientRect();
                const reason = document.getElementById('questionReasonLabel').getBoundingClientRect();
                const separate = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
                return { centerX: (word.left + word.right - card.left - card.right) / 2,
                    centerY: (word.top + word.bottom - card.top - card.bottom) / 2,
                    posCenter: (pos.left + pos.right - card.left - card.right) / 2,
                    posTop: pos.top - card.top, gap: word.top - pos.bottom,
                    clear: separate(reason, pos) && [...document.querySelectorAll('.card-accuracy, #wordSpeechBtn')]
                        .filter(el => !el.hidden).every(el => separate(pos, el.getBoundingClientRect()) && separate(reason, el.getBoundingClientRect())),
                    fits: document.documentElement.scrollWidth <= innerWidth,
                    cardHeight: card.height, wordTop: word.top };
            });
            const before = await measure();
            expect(Math.abs(before.centerX)).toBeLessThan(0.1);
            expect(Math.abs(before.centerY)).toBeLessThan(0.1);
            expect(Math.abs(before.posCenter)).toBeLessThan(0.1);
            expect(before.posTop).toBeGreaterThanOrEqual(14);
            expect(before.posTop).toBeLessThanOrEqual(16);
            expect(before.gap).toBeGreaterThanOrEqual(12);
            expect(before).toMatchObject({ clear: true, fits: true });
            await page.evaluate(() => {
                setupCardListeners();
                showNoWordsMessage();
                hideNoWordsMessage();
                showWord(gameState.currentWord);
            });
            await expect(page.locator('#vocabCard > .card-label')).toHaveCount(0);
            await expect(page.locator('#questionReasonLabel')).toHaveText('得意の定着チェック');
            expect(await measure()).toEqual(before);
            if (width === 320 && fixture.senses) {
                await page.locator('#vocabCard').screenshot({ path: `screenshots/review-question-multiple-pos-320-${testInfo.project.name}.png` });
            }
        }
    }
});
