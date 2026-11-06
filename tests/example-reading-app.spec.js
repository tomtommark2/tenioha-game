const { test, expect } = require('@playwright/test');
const path = require('node:path');
const output = path.resolve('docs/experiments/example-reading-adoption-2026-11-06');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        const nativeFetch = window.fetch.bind(window);
        window.fetch = (input, options) => String(input) === 'https://us-central1-tenioha-game.cloudfunctions.net/feedback'
            ? Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false }), { headers: { 'Content-Type': 'application/json' } }))
            : nativeFetch(input, options);
        for (const name of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + name, 'true');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
    });
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function show(page, spelling) {
    await page.evaluate(spelling => {
        gameState.currentLevel = 'junior';
        loadVocabularyForLevel();
        initializeWordStates();
        activateLearningSessionUI();
        showWord(vocabularyDatabase.junior.find(word => word.word === spelling));
    }, spelling);
}

test('通常画面：開始待ちを保ち、読み方を一度だけ読み込んでA案で表示する', async ({ page }, info) => {
    const requests = [];
    page.on('request', request => { if (request.url().includes('example-readings-junior.json')) requests.push(request.url()); });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await expect(page.locator('#exampleReadingSample, .example-label')).toHaveCount(0);
    expect(requests).toHaveLength(0);
    expect(await page.evaluate(() => document.body.classList.contains('example-reading-preview-active'))).toBe(false);
    await show(page, 'after');
    await expect(page.locator('#exampleReadingToggle')).toBeVisible();
    const choose = async prefix => {
        const value = await page.locator('#exampleSenseSelect option').evaluateAll((options, prefix) => options.find(option => option.textContent.startsWith(prefix)).value, prefix);
        await page.locator('#exampleSenseSelect').selectOption(value);
    };
    await choose('接');
    await expect(page.locator('#exampleSentence')).toHaveText('Call me after you arrive.');
    const snapshot = await page.evaluate(() => JSON.stringify({ states: gameState.wordStates, srs: gameState.srsData, counts: gameState.actionCounts }));
    for (const width of [280, 320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
        await page.locator('#exampleReadingToggle').click();
        await expect(page.locator('.example-reading-chunk span:last-child').last()).toHaveText('あなたが着いた後で');
        await expect(page.locator('.example-reading-meaning p')).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        if (process.env.READING_CAPTURE === '1' && width !== 280 && info.project.name === 'reading-desktop') {
            await page.mouse.move(0, 0);
            await page.locator('#exampleArea').screenshot({ path: path.join(output, `normal-${width}-open.png`), scale: 'css' });
        }
        await page.locator('#exampleReadingToggle').click();
        if (process.env.READING_CAPTURE === '1' && width !== 280 && info.project.name === 'reading-desktop') {
            await page.mouse.move(0, 0);
            await page.locator('#exampleArea').screenshot({ path: path.join(output, `normal-${width}-closed.png`), scale: 'css' });
            await page.screenshot({ path: path.join(output, `normal-${width}-page.png`), fullPage: true, scale: 'css' });
        }
    }
    expect(await page.evaluate(() => JSON.stringify({ states: gameState.wordStates, srs: gameState.srsData, counts: gameState.actionCounts }))).toBe(snapshot);
    await choose('副');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('そのすぐ後に');
    await show(page, 'candy');
    await expect(page.locator('#exampleReadingToggle')).toBeVisible();
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatch(/\?v=\d{4}\.\d{4}\.\d{4}$/);
});

test('通常画面：読込中に例文・開始画面へ切り替えても古い読み方を出さない', async ({ page }) => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/example-readings-junior.json*', async route => { await gate; await route.continue(); });
    await page.goto('/index.html');
    await show(page, 'apple');
    await show(page, 'book');
    release();
    await expect(page.locator('#exampleReadingToggle')).toBeVisible();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child').last()).toHaveText('新しい本を');
    await page.evaluate(() => showLearningStartPrompt());
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    expect(await page.locator('#exampleArea').getAttribute('class')).not.toContain('has-example');
    await show(page, 'apple');
    await page.locator('#exampleReadingToggle').click();
    await page.evaluate(() => showNoWordsMessage());
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
});

test('通常画面：取得失敗は自動再試行せず、手動再読込を示して学習を妨げない', async ({ page }) => {
    let requests = 0;
    await page.route('**/data/example-readings-junior.json*', route => { requests++; return route.fulfill({ status: 503, body: 'Unavailable' }); });
    await page.goto('/vocab_clicker_game.html');
    await show(page, 'apple');
    await page.evaluate(() => window.ExampleReading.load());
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await expect(page.locator('#exampleSentence')).toHaveText('I like apple pie.');
    await page.locator('#vocabCard').click();
    await show(page, 'book');
    expect(requests).toBe(1);
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await page.evaluate(() => {
        const word = { word: 'custom', pos: '名', meaning: '自作', example: '', __customWord: true };
        renderWordExample(word);
    });
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    expect(await page.locator('#exampleArea').getAttribute('class')).not.toContain('has-example');
    await expect(page.locator('#exampleSentence')).toBeEmpty();
});

test('通常画面：通信が回復すればワンタップで取得し、失敗中も保存・回答を増やさない', async ({ page }) => {
    let requests = 0;
    await page.route('**/data/example-readings-junior.json*', route => ++requests <= 2
        ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
    await page.goto('/index.html');
    await show(page, 'beautiful');
    const state = () => page.evaluate(() => JSON.stringify({ words: gameState.wordStates, counts: gameState.actionCounts, srs: gameState.srsData }));
    const before = await state();
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('読み方を表示できませんでした');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['彼女', '＝', 'とても美しい']);
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    expect(requests).toBe(3);
    expect(await state()).toBe(before);
});

test('通常画面：古い部分データの未対応例も再取得でき、取得中に替えた現在の語へ戻る', async ({ page }) => {
    const data = require('../data/example-readings-junior.json');
    let requests = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/example-readings-junior.json*', async route => {
        requests++;
        if (requests === 1) return route.fulfill({ json: { ...data, entries: data.entries.slice(0, 310) } });
        await gate;
        return route.continue();
    });
    await page.goto('/index.html');
    await show(page, 'zoo');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingToggle')).toBeDisabled();
    await show(page, 'beautiful');
    release();
    await expect(page.locator('#exampleReadingToggle')).toBeEnabled();
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['彼女', '＝', 'とても美しい']);
    await show(page, 'zoo');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('ライオンが');
    expect(requests).toBe(2);
});
