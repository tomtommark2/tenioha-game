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
