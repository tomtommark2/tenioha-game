const { test, expect } = require('@playwright/test');
const data = require('../data/example-readings-basic.json');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
        for (const flag of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + flag, 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
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

test('基礎全例：難しいまとまり・be・受け身の対応と、任意の全文訳を表示する', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=basic');
    await expect(page.locator('#exampleReadingSample option')).toHaveCount(1521);
    await expect(page.locator('#exampleSentence')).toHaveText('I saw him last night.');
    const japanese = {
        13: ['私たちは', '逃した', '最終バスを', 'そういうもの', '＝', '人生'],
        41: ['広告は', '影響を与える', '私たちが買うものに'],
        43: ['その医師は', '助言した', '私に', '休むように'],
        46: ['彼は', '持っている', '高齢の母親を', '世話をする必要がある'],
        56: ['どうか', '許可してください', '私が説明するのを'],
        62: ['彼女', '＝（過去）', '楽しませられた', 'その話に'],
        68: ['私は', 'くじいた', '自分の足首を', 'サッカーをしているときに'],
        80: ['どうやら', '彼は', '来ない']
    };
    for (const index of [1, 13, 38, 41, 43, 46, 56, 62, 68, 80, 95, 289, 416, 659, 769, 1031, 1272, 1283, 1424, 1448, 1519]) {
        await page.locator('#exampleReadingSample').selectOption(String(index));
        await expect(page.locator('#exampleReadingPanel')).toBeHidden();
        const before = await snapshot(page);
        await page.locator('#exampleReadingToggle').click();
        expect((await page.locator('.example-reading-chunk span:first-child').allTextContents()).join(' ')).toBe(data.entries[index].example);
        if (japanese[index]) await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(japanese[index]);
        await expect(page.locator('.example-reading-meaning p')).toBeHidden();
        await page.getByText('全体の意味', { exact: true }).click();
        await expect(page.locator('.example-reading-meaning p')).toHaveText(data.entries[index].translation);
        expect(await snapshot(page)).toBe(before);
    }
});

test('受け身：等号で動作・状態・完了・未来・否定・入れ子の違いを保つ', async ({ page }) => {
    test.setTimeout(60000);
    const samples = {
        junior: {
            197: ['この本', '＝（過去）', '書かれた', '漱石によって'],
            494: ['その車', '＝', '駐車されている', 'その家の前に'],
            618: ['誰一人〜ない', '＝（過去）', 'けがをした'],
            1262: ['私', '＝（過去）', '驚いた', 'その知らせに']
        },
        basic: {
            117: ['彼女', '＝（過去）', '授与された', '賞を'],
            263: ['その状況', '今では＝（完了）', 'はっきり説明されている'],
            321: ['どうか', '確かめて', 'すべての用紙', '＝', '正しく記入されていることを'],
            329: ['その訴訟', '＝（予測）', '審理される', '法廷で'],
            350: ['その古い家', '＝（過去）', '言われていた', '＝であると', '呪われた状態'],
            562: ['＝にならないで', 'だまされる側に'],
            708: ['内側の壁', '＝', '塗られている', '白く'],
            1058: ['その雑誌', '＝', '出版される', '毎月']
        }
    };
    for (const [level, examples] of Object.entries(samples)) {
        await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=' + level);
        for (const [index, japanese] of Object.entries(examples)) {
            await page.locator('#exampleReadingSample').selectOption(index);
            const before = await snapshot(page);
            await page.locator('#exampleReadingToggle').click();
            await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(japanese);
            expect((await page.locator('.example-reading-chunk span:first-child').allTextContents()).join(' ')).toBe(await page.locator('#exampleSentence').textContent());
            await expect(page.locator('.example-reading-meaning p')).toBeHidden();
            expect(await snapshot(page)).toBe(before);
        }
    }
});

test('基礎：各レベル1回だけ取得し、同綴りの別用法と追加済みの例文を表示する', async ({ page }) => {
    const requests = [];
    page.on('request', request => { if (/example-readings-.*\.json/.test(request.url())) requests.push(request.url()); });
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    expect(requests).toEqual([]);
    await show(page, 'basic', 'last');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    const value = await page.locator('#exampleSenseSelect option').evaluateAll(options => options.find(option => option.textContent.startsWith('動')).value);
    await page.locator('#exampleSenseSelect').selectOption(value);
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('続いた');
    await show(page, 'basic', 'atom');
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方');
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('原子');
    await page.evaluate(() => window.ExampleReading.load(false, 'basic'));
    expect(requests.filter(url => url.includes('-basic.json'))).toHaveLength(1);
    expect(requests.filter(url => url.includes('-junior.json'))).toHaveLength(0);
    await show(page, 'junior', 'beautiful');
    await expect(page.locator('#exampleReadingToggle')).toBeVisible();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['彼女', '＝', 'とても美しい']);
    await show(page, 'basic', 'athlete');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('プロの運動選手');
    expect(requests).toHaveLength(2);
    expect(requests.every(url => /\?v=\d{4}\.\d{4}\.\d{4}$/.test(url))).toBe(true);
});

test('基礎：取得失敗は手動で回復し、部分データの未登録例へ再試行を促し続けない', async ({ page }) => {
    let requests = 0;
    await page.route('**/data/example-readings-basic.json*', route => ++requests === 1
        ? route.fulfill({ status: 503, body: 'Unavailable' })
        : route.fulfill({ json: { ...data, complete: false, entries: data.entries.slice(0, 100) } }));
    await page.goto('/vocab_clicker_game.html');
    await show(page, 'basic', 'last');
    const before = await snapshot(page);
    await expect(page.locator('#exampleReadingToggle')).toHaveText('読み方を再読込');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['私は', '見た', '彼を', '昨夜']);
    expect(await snapshot(page)).toBe(before);
    await show(page, 'basic', 'atom');
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    expect(requests).toBe(2);
});

test('レベル切替：遅れて届く中学データで、基礎の読み方を表示しない', async ({ page }) => {
    let releaseJunior, releaseBasic;
    const juniorGate = new Promise(resolve => { releaseJunior = resolve; });
    const basicGate = new Promise(resolve => { releaseBasic = resolve; });
    await page.route('**/data/example-readings-junior.json*', async route => { await juniorGate; await route.continue(); });
    await page.route('**/data/example-readings-basic.json*', async route => { await basicGate; await route.continue(); });
    await page.goto('/index.html');
    await show(page, 'junior', 'beautiful');
    await show(page, 'basic', 'last');
    releaseJunior();
    await page.evaluate(() => window.ExampleReading.load());
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    releaseBasic();
    await expect(page.locator('#exampleReadingToggle')).toBeVisible();
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('#exampleReadingPanel')).toContainText('昨夜');
    await show(page, 'junior', 'beautiful');
    await page.locator('#exampleReadingToggle').click();
    await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(['彼女', '＝', 'とても美しい']);
});

test('基礎：長い名詞句と修飾を320・390・1280pxで収め、開閉で操作バーを動かさない', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/index.html?exampleReadingPreview=1&exampleReadingLevel=basic');
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const index of [46, 769, 1272, 1424]) {
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
