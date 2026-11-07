const { test, expect } = require('@playwright/test');
const data = require('../data/example-readings-exam1.json');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        for (const flag of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + flag, 'true');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
        const nativeFetch = window.fetch.bind(window);
        window.fetch = (input, options) => String(input) === 'https://us-central1-tenioha-game.cloudfunctions.net/feedback'
            ? Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false }), { headers: { 'Content-Type': 'application/json' } }))
            : nativeFetch(input, options);
    });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function show(page, level, spelling) {
    await page.evaluate(({ level, spelling }) => {
        gameState.currentLevel = level;
        loadVocabularyForLevel();
        initializeWordStates();
        activateLearningSessionUI();
        showWord(vocabularyDatabase[level].find(word => word.word === spelling));
    }, { level, spelling });
}
const snapshot = page => page.evaluate(() => JSON.stringify({ words: gameState.wordStates, srs: gameState.srsData, counts: gameState.actionCounts }));

test('受験全例：難所・熟語・beと受け身・進行形・否定を保ち、全文訳は別に開く', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=exam1');
    await expect(page.locator('#exampleReadingSample option')).toHaveCount(2581);
    await expect(page.locator('.example-reading-preview label')).toHaveText('受験の読み方');
    const expected = {
        0: ['〜できますか', 'あなたは', '特定する', 'その泥棒を'],
        1: ['そのガイドは', '手伝った', '私たちが', 'その鳥を特定するのを'],
        2: ['この切符は', '＝', '有効', '一日間'],
        118: ['熱望する', '＝であることを', '作家'],
        240: ['私＝ではない', '気にしている'],
        328: ['その学生は', '認めた', '〜ということを', '自分が', '不正をしていた', 'その試験で'],
        430: ['〜を考慮すると', '彼は', '＝', '若い'],
        483: ['＝でいないで', '臆病者'],
        601: ['取り合う価値があるものとして扱う', '返事をすることで'],
        713: ['緊急ではなく予定して行う', '手術'],
        1044: ['＝', '入院させられる'],
        1265: ['屋根は', '雨漏りしている'],
        1465: ['どちらの答えも〜ない', '＝', '正しい'],
        1559: ['その便は', '＝（過去）', '定員を超えて予約されていた'],
        1922: ['＝である', '退却中'],
        2157: ['私＝', 'おなかがぺこぺこ'],
        2170: ['コーヒーは', '＝', '刺激物'],
        2468: ['＝でいて', '私のバレンタインの相手'],
        2495: ['忍耐は', '＝', '美徳'],
        2579: ['私たちは', '座った', '暖炉のそばに', 'ある寒い夕べに']
    };
    for (const index of [...Object.keys(expected).map(Number), 71, 170, 373, 1829, 1899, 1900, 1999, 2480, 2530, 2558]) {
        await page.locator('#exampleReadingSample').selectOption(String(index));
        await expect(page.locator('#exampleReadingPanel')).toBeHidden();
        const before = await snapshot(page);
        await page.locator('#exampleReadingToggle').click();
        expect((await page.locator('.example-reading-chunk span:first-child').allTextContents()).join(' ')).toBe(data.entries[index].example);
        if (expected[index]) await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(expected[index]);
        await expect(page.locator('.example-reading-meaning p')).toBeHidden();
        await page.getByText('全体の意味', { exact: true }).click();
        await expect(page.locator('.example-reading-meaning p')).toHaveText(data.entries[index].translation);
        expect(await snapshot(page)).toBe(before);
    }
});

test('受験：同綴りの別品詞・同品詞の別例文を選び、教材ごとに一度だけ取得する', async ({ page }) => {
    const requests = [];
    page.on('request', request => { if (/example-readings-.*\.json/.test(request.url())) requests.push(request.url()); });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    expect(requests).toHaveLength(0);
    await show(page, 'exam1', 'identify');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    await page.locator('#exampleSenseSelect').selectOption('1');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleSentence')).toHaveText('The guide helped us identify the bird.');
    await expect(page.locator('#exampleReadingPanel')).toContainText('私たちが');
    await page.locator('#exampleSenseSelect').selectOption('0');
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleSentence')).toHaveText('Can you identify the thief?');
    await expect(page.locator('#exampleReadingPanel')).toContainText('その泥棒を');
    await show(page, 'exam1', 'edit');
    for (const [prefix, english] of [['名', 'Final edit.'], ['動', 'Edit a video.']]) {
        const value = await page.locator('#exampleSenseSelect option').evaluateAll((options, prefix) => options.find(option => option.textContent.startsWith(prefix)).value, prefix);
        await page.locator('#exampleSenseSelect').selectOption(value);
        await expect(page.locator('#exampleReadingPanel')).toBeHidden();
        await page.locator('#exampleReadingToggle').click();
        expect((await page.locator('.example-reading-chunk span:first-child').allTextContents()).join(' ')).toBe(english);
    }
    for (const [level, spelling] of [['daily', 'unlikely'], ['basic', 'last'], ['junior', 'beautiful'], ['exam1', 'fireplace']]) {
        await show(page, level, spelling);
        await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
        await page.locator('#exampleReadingToggle').click();
        await expect(page.locator('#exampleReadingPanel')).toBeVisible();
    }
    for (const level of ['junior', 'basic', 'daily', 'exam1']) expect(requests.filter(url => url.includes(`-${level}.json`))).toHaveLength(1);
    expect(requests.every(url => /\?v=\d{4}\.\d{4}\.\d{4}$/.test(url))).toBe(true);
});

test('受験：取得失敗から回復し、遅い再読込が切替後の標準を上書きしない', async ({ page }) => {
    let requests = 0, release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/example-readings-exam1.json*', async route => {
        if (++requests === 1) return route.fulfill({ status: 503, body: 'Unavailable' });
        await gate;
        return route.continue();
    });
    await page.goto('/vocab_clicker_game.html');
    await show(page, 'exam1', 'valid');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await page.locator('#exampleReadingToggle').click();
    await show(page, 'daily', 'unlikely');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    release();
    await page.evaluate(() => window.ExampleReading.load(false, 'exam1'));
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('ありそうもない');
    await show(page, 'exam1', 'valid');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('有効');
    expect(requests).toBe(2);
});

test('受験：長い注記・節を320・390・1280pxで収め、開閉で操作バーを動かさない', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=exam1');
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const index of [1, 328, 601, 1752, 2579]) {
            await page.locator('#exampleReadingSample').selectOption(String(index));
            await page.evaluate(() => document.fonts.ready);
            const top = await page.locator('#exampleReadingToggle').evaluate(element => element.getBoundingClientRect().top + scrollY);
            await page.locator('#exampleReadingToggle').click();
            const metrics = await page.evaluate(() => ({
                width: document.documentElement.scrollWidth,
                overflow: [...document.querySelectorAll('.example-reading-chunk')].some(element => element.scrollWidth > element.clientWidth + 1),
                top: document.querySelector('#exampleReadingToggle').getBoundingClientRect().top + scrollY,
                controls: ['#speakerBtn', '#exampleReadingToggle', '#undoBtn'].map(selector => {
                    const r = document.querySelector(selector).getBoundingClientRect();
                    return { width: r.width, height: r.height };
                })
            }));
            expect(metrics.width).toBeLessThanOrEqual(width);
            expect(metrics.overflow).toBe(false);
            expect(metrics.top).toBeCloseTo(top, 0);
            for (const control of metrics.controls) {
                expect(control.width).toBeGreaterThanOrEqual(44);
                expect(control.height).toBeGreaterThanOrEqual(44);
            }
        }
    }
});
