const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.beforeEach(async ({ page, baseURL }) => {
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        for (const name of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + name, 'true');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
    });
    await page.goto('/index.html');
    await page.evaluate(() => {
        activateLearningSessionUI();
        gameState.currentLevel = 'junior';
        loadVocabularyForLevel();
        initializeWordStates();
        showWord(vocabularyDatabase.junior.find(word => word.word === 'because'));
    });
});

const measure = page => page.evaluate(() => {
    const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const style = getComputedStyle(document.querySelector('#exampleArea'));
    return { area: rect('#exampleArea'), text: rect('.example-text'), tools: rect('.answer-tools'), speaker: rect('#speakerBtn'),
        contentWidth: document.querySelector('#exampleArea').clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        sentence: rect('#exampleSentence') };
});

function expectReadable(layout) {
    expect(layout.text.width).toBeGreaterThanOrEqual(Math.min(220, layout.contentWidth - 60) - 1);
    expect(layout.speaker.width).toBeGreaterThanOrEqual(44);
    expect(layout.area.height).toBeLessThan(200);
    const separateRow = layout.tools.y >= layout.text.bottom - 1;
    const beside = layout.tools.x >= layout.text.right - 1;
    expect(separateRow || beside).toBe(true);
}

test('例文枠：読み方を開かない通常画面で、枠幅に応じて操作ボタンを折り返す', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const width of [240, 280, 320, 390, 520, 840]) {
        await page.locator('#exampleArea').evaluate((element, width) => { element.style.width = `${width}px`; element.style.maxWidth = '100%'; }, width);
        const hidden = await measure(page);
        expectReadable(hidden);
        await page.locator('#previousIllustrationBtn').evaluate(element => { element.hidden = false; });
        const visible = await measure(page);
        expectReadable(visible);
        expect(visible.area.height).toBeCloseTo(hidden.area.height, 0);
        expect(visible.text.width).toBeCloseTo(hidden.text.width, 0);
        if (width === 280) await page.locator('#exampleArea').screenshot({ path: path.resolve('docs/experiments/example-reading-2026-11-06', `${browserName}-narrow-280-closed.png`) });
        await page.locator('#previousIllustrationBtn').evaluate(element => { element.hidden = true; });
    }
});

test('例文枠：280・320・390pxの通常表示で英文の幅とボタンの操作面積を保つ', async ({ page, browserName }) => {
    for (const width of [280, 320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        expectReadable(await measure(page));
        for (const selector of ['#speakerBtn', '#undoBtn', '#previousIllustrationBtn']) {
            const size = await page.locator(selector).boundingBox();
            expect(size.width).toBeGreaterThanOrEqual(44);
            expect(size.height).toBeGreaterThanOrEqual(44);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        await page.screenshot({ path: path.resolve('docs/experiments/example-reading-2026-11-06', `${browserName}-${width}-normal-closed.png`), fullPage: true });
    }
});
