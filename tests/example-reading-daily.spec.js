const { test, expect } = require('@playwright/test');
const data = require('../data/example-readings-daily.json');
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

test('標準全例：語句・難所・受け身・存在・進行形の対応と任意の全文訳を表示する', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=daily');
    await expect(page.locator('#exampleReadingSample option')).toHaveCount(2398);
    await expect(page.locator('.example-reading-preview label')).toHaveText('標準の読み方');
    const expected = {
        0: ['それは', '＝', 'ありそうもない'],
        89: ['シロナガスクジラ'],
        152: ['〜する傾向がある', '＝', '遅れている'],
        374: ['あなたは', '代用できる', '油を', 'バターの代わりに', 'このレシピでは'],
        547: ['彼女は', '受け取った', '彼が彼女への挨拶を拒んだことを', '〜として', '意図的な侮辱'],
        1229: ['遅れて来た人は', '＝ではない（今後）', '入場を認められる'],
        1586: ['お金は', '可能にする', 'あなたが', '物事をすることを'],
        1840: ['フィッシュアンドチップスは', '＝', 'よく', '作られる', 'タラを使って'],
        1872: ['水は', '＝', '構成されている', '水素と酸素で'],
        1895: ['彼は', '＝（過去）', '意識している', '＝であることを', '見られている'],
        2046: ['そのライオンは', 'いた', 'おりの中に'],
        2145: ['彼は', '＝（過去）', '任命された', '管理職に'],
        2160: ['私たちは', '待っている', 'あなたの到着を'],
        2325: ['あなたは', '＝（予測）', 'できる', '英語を話すことが', '近いうちに'],
        2387: ['私たちは', '尋ねた', '職員の一人に', '搭乗手続きカウンターがどこにあるかを']
    };
    for (const index of [...Object.keys(expected).map(Number), 121, 245, 862, 1683, 2394, 2395, 2396]) {
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

test('標準：通常起動で先読みせず、各教材一回だけ取得し、同綴り別品詞を照合する', async ({ page }) => {
    const requests = [];
    page.on('request', request => { if (/example-readings-.*\.json/.test(request.url())) requests.push(request.url()); });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    expect(requests).toHaveLength(0);
    await show(page, 'daily', 'update');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    const noun = await page.locator('#exampleSenseSelect option').evaluateAll(options => options.find(option => option.textContent.startsWith('名')).value);
    await page.locator('#exampleSenseSelect').selectOption(noun);
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleSentence')).toHaveText('Software update.');
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['ソフトウェアの', '更新']);
    const verb = await page.locator('#exampleSenseSelect option').evaluateAll(options => options.find(option => option.textContent.startsWith('動')).value);
    await page.locator('#exampleSenseSelect').selectOption(verb);
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['更新する', 'そのソフトウェアを']);
    for (const [level, spelling] of [['basic', 'last'], ['junior', 'beautiful'], ['daily', 'though']]) {
        await show(page, level, spelling);
        await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
        await page.locator('#exampleReadingToggle').click();
        await expect(page.locator('#exampleReadingPanel')).toBeVisible();
    }
    for (const level of ['junior', 'basic', 'daily']) expect(requests.filter(url => url.includes(`-${level}.json`))).toHaveLength(1);
    expect(requests.every(url => /\?v=\d{4}\.\d{4}\.\d{4}$/.test(url))).toBe(true);
    await page.evaluate(() => {
        gameState.currentLevel = 'selection1400';
        gameState.currentWord = vocabularyDatabase.junior[0];
        renderWordExample(gameState.currentWord);
    });
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
});

test('標準：取得失敗は操作で回復し、遅い再読込が別教材を上書きしない', async ({ page }) => {
    let requests = 0, release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/example-readings-daily.json*', async route => {
        if (++requests === 1) return route.fulfill({ status: 503, body: 'Unavailable' });
        await gate;
        return route.continue();
    });
    await page.goto('/vocab_clicker_game.html');
    await show(page, 'daily', 'unlikely');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await page.locator('#exampleReadingToggle').click();
    await show(page, 'basic', 'last');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    release();
    await page.evaluate(() => window.ExampleReading.load(false, 'daily'));
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('昨夜');
    await show(page, 'daily', 'unlikely');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['それは', '＝', 'ありそうもない']);
    expect(requests).toBe(2);
});

test('標準：長い節も320・390・1280pxで収め、開閉で操作バーを動かさない', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=daily');
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const index of [547, 1840, 2140, 2232, 2387]) {
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
