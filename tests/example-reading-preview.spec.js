const { test, expect } = require('@playwright/test');
const path = require('node:path');
const errors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'us-central1-tenioha-game.cloudfunctions.net' && url.pathname === '/feedback') {
            return route.fulfill({ json: { items: [], isAdmin: false }, headers: { 'Access-Control-Allow-Origin': '*' } });
        }
        return url.origin === new URL(baseURL).origin ? route.continue() : route.abort();
    });
    await page.addInitScript(() => {
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, options) => String(input) === 'https://us-central1-tenioha-game.cloudfunctions.net/feedback'
            ? Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false }), { headers: { 'Content-Type': 'application/json' } }))
            : originalFetch(input, options);
        for (const name of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + name, 'true');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 1 }));
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
            getVoices: () => [{ name: 'Test voice', lang: 'en-US' }],
            speak: utterance => { window.lastSpokenText = utterance.text; }, cancel: () => {}
        } });
        window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    });
    await page.goto('/index.html?exampleReadingPreview=1');
    await expect(page.locator('#exampleSentence')).toHaveText('I like apple pie.');
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test('例文の読み方：追加データを選択でき、代表例の全文訳は別に開く', async ({ page }) => {
    test.setTimeout(60000);
    await expect(page.locator('#exampleReadingSample option')).toHaveCount(1528);
    for (const index of [0, 5, 53, 130, 192, 200, 201, 217, 246, 310, 395, 460, 487, 555, 618, 710, 711, 712, 976, 1020, 1162, 1330, 1489, 1526]) {
        await page.locator('#exampleReadingSample').selectOption(String(index));
        await expect(page.locator('#exampleReadingPanel')).toBeHidden();
        await page.getByRole('button', { name: '読み方', exact: true }).click();
        const english = await page.locator('.example-reading-chunk span:first-child').allTextContents();
        expect(english.join(' ')).toBe(await page.locator('#exampleSentence').textContent());
        const expectedJapanese = {
            0: ['私は', '好んでいる', 'アップルパイを'],
            5: ['どうか', 'ください', '私に', '水を少し'],
            53: ['あなたは持っていますか', '何か質問を'],
            130: ['どの色を', 'あなたは好んでいますか', '一番'],
            192: ['私は', '好んでいる', 'りんごを', 'でも', '私は', '好んでいない', 'バナナを'],
            200: ['ある', 'すてきなカフェが', 'この近くに'],
            217: ['あなたは手伝ってくれますか', '私がこの箱を運ぶのを'],
            246: ['保って', '自分の部屋を', 'きれいな状態に']
        };
        if (expectedJapanese[index]) {
            expect(await page.locator('.example-reading-chunk span:last-child').allTextContents()).toEqual(expectedJapanese[index]);
        }
        await expect(page.locator('.example-reading-meaning')).not.toHaveAttribute('open', '');
        await page.getByText('全体の意味', { exact: true }).click();
        await expect(page.locator('.example-reading-meaning p')).toBeVisible();
        if (index === 0) await expect(page.locator('.example-reading-meaning p')).toHaveText('私はアップルパイが好きです。');
        if (index === 201) await expect(page.locator('.example-reading-meaning p')).toHaveText('私はケーキが一切れ欲しい。');
        await page.getByRole('button', { name: '読み方', exact: true }).click();
        await expect(page.locator('#exampleReadingPanel')).toBeHidden();
        await page.getByRole('button', { name: '読み方', exact: true }).click();
        await expect(page.locator('.example-reading-meaning p')).toBeHidden();
    }
});

test('例文の読み方：補助データが読めなくても通常の学習画面は使える', async ({ page }) => {
    await page.route('**/data/example-readings-junior.json*', route => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.reload();
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#vocabWord')).not.toHaveText('クリックしてスタート');
});

test('例文の読み方：同綴り別品詞への切替で説明と全文訳を閉じる', async ({ page }) => {
    await page.locator('#exampleReadingSample').selectOption('2');
    await page.getByRole('button', { name: '読み方', exact: true }).click();
    await expect(page.locator('.example-reading-note')).toContainText('状態');
    await page.getByText('全体の意味', { exact: true }).click();
    const verb = await page.locator('#exampleSenseSelect option').evaluateAll(options => options.find(option => option.textContent.startsWith('動')).value);
    await page.locator('#exampleSenseSelect').selectOption(verb);
    await expect(page.locator('#exampleSentence')).toHaveText('Open your book.');
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await expect(page.locator('#exampleReadingToggle')).toHaveAttribute('aria-expanded', 'false');
    await page.locator('#exampleReadingToggle').press('Enter');
    await expect(page.locator('.example-reading-note')).toContainText('相手に行動');
    await expect(page.locator('.example-reading-meaning p')).toBeHidden();
});

test('例文の読み方：beの等号・過去・否定・疑問を示し、助動詞と存在は区別する', async ({ page }) => {
    test.setTimeout(60000);
    const samples = {
        93: ['彼女', '＝', 'とても美しい'],
        129: ['彼女', '＝', '私の一番の友達'],
        564: ['私', '＝', 'うれしい', 'あなたに会えて'],
        984: ['その試験', '＝（過去）', 'かなり難しい'],
        331: ['英語', '＝ではない', '難しい'],
        1014: ['＝？', 'あなた', '準備ができている'],
        743: ['私＝', '学生'],
        1002: ['どうか', '＝でいて', '静か'],
        651: ['天気を示すit', '＝', '寒い', '1月は'],
        74: ['その赤ちゃんは', '眠っている'],
        197: ['この本は', '書かれた', '漱石によって'],
        167: ['猫はいる', 'その箱の中に'],
        326: ['ある', '本が一冊', 'その机の上に']
    };
    for (const [index, japanese] of Object.entries(samples)) {
        await page.locator('#exampleReadingSample').selectOption(index);
        await page.locator('#exampleReadingToggle').click();
        await expect(page.locator('.example-reading-chunk span:last-child')).toHaveText(japanese);
        expect((await page.locator('.example-reading-chunk span:first-child').allTextContents()).join(' ')).toBe(await page.locator('#exampleSentence').textContent());
        await expect(page.locator('.example-reading-meaning p')).toBeHidden();
    }
});

test('例文の読み方：開閉は回答・保存を増やさず音声は英文だけ', async ({ page }) => {
    const snapshot = () => page.evaluate(() => JSON.stringify({ states: gameState.wordStates, srs: gameState.srsData, counts: gameState.actionCounts, word: gameState.currentWord.word }));
    const before = await snapshot();
    await page.evaluate(() => { window.readingSaveCalls = 0; window.saveGame = () => { window.readingSaveCalls++; }; });
    await page.locator('#exampleReadingToggle').press('Space');
    await page.getByText('全体の意味', { exact: true }).press('Enter');
    await page.locator('#speakerBtn').click();
    expect(await page.evaluate(() => window.lastSpokenText)).toBe('I like apple pie.');
    expect(await snapshot()).toBe(before);
    expect(await page.evaluate(() => window.readingSaveCalls)).toBe(0);
});

test('例文の読み方：対象外・自作語・次の出題で前の補助を残さない', async ({ page }) => {
    await page.locator('#exampleReadingToggle').click();
    await page.evaluate(() => {
        gameState.currentLevel = 'daily';
        showWord(vocabularyDatabase.daily[0]);
    });
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    await page.evaluate(() => {
        gameState.currentLevel = 'junior';
        const word = vocabularyDatabase.junior.find(word => word.word === 'apple');
        renderWordExample({ ...word, __customWord: true });
    });
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await page.locator('#exampleReadingSample').selectOption('0');
    await page.locator('#exampleReadingToggle').click();
    await page.locator('#vocabCard').click();
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
});

test('例文の読み方：通常URLはA案で、試作用の選択バーとCSSは読み込まない', async ({ page }) => {
    const styles = [];
    page.on('request', request => { if (request.url().includes('example-reading-preview.css')) styles.push(request.url()); });
    await page.goto('/vocab_clicker_game.html');
    await expect(page.locator('#exampleReadingToggle')).toBeHidden();
    await expect(page.locator('#exampleReadingSample')).toHaveCount(0);
    await expect(page.locator('#exampleArea')).toHaveClass(/example-panel-titleless/);
    expect(await page.evaluate(() => typeof window.ExampleReading.render)).toBe('function');
    expect(styles).toEqual([]);
});

test('例文の読み方：操作バーは狭い幅でも本文を圧迫せず、開閉で動かない', async ({ page }) => {
    await page.locator('#exampleReadingSample').selectOption('7');
    for (const width of [280, 320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const measure = () => page.evaluate(() => {
            const area = document.getElementById('exampleArea');
            const style = getComputedStyle(area);
            const button = document.getElementById('exampleReadingToggle').getBoundingClientRect();
            return {
                textWidth: document.querySelector('.example-text').getBoundingClientRect().width,
                contentWidth: area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
                toggleTop: button.top - area.getBoundingClientRect().top,
                controls: [...area.querySelectorAll('.example-actions button')].map(element => {
                    const r = element.getBoundingClientRect();
                    return { width: r.width, height: r.height, left: r.left, right: r.right };
                }),
                left: area.getBoundingClientRect().left,
                right: area.getBoundingClientRect().right,
                backBorder: getComputedStyle(document.getElementById('undoBtn')).borderTopWidth,
                backShadow: getComputedStyle(document.getElementById('undoBtn')).boxShadow
            };
        });
        const before = await measure();
        expect(before.textWidth).toBeCloseTo(before.contentWidth, 0);
        expect(before.backBorder).toBe('0px');
        expect(before.backShadow).toBe('none');
        for (const control of before.controls) {
            expect(control.width).toBeGreaterThanOrEqual(44);
            expect(control.height).toBeGreaterThanOrEqual(44);
            expect(control.left).toBeGreaterThanOrEqual(before.left);
            expect(control.right).toBeLessThanOrEqual(before.right);
        }
        await page.locator('#exampleReadingToggle').click();
        expect((await measure()).toggleTop).toBeCloseTo(before.toggleTop, 0);
        await page.locator('#exampleReadingToggle').click();
        expect((await measure()).toggleTop).toBeCloseTo(before.toggleTop, 0);
    }
});

test('例文の読み方：移動した前の絵と戻るは回答を増やさず元の状態へ戻す', async ({ page }) => {
    const before = await page.evaluate(() => JSON.stringify({ word: gameState.currentWord.word, srs: gameState.srsData, counts: gameState.actionCounts }));
    await page.locator('#vocabCard').click();
    await page.evaluate(() => {
        WordIllustrations.rememberAnswer(vocabularyDatabase.junior.find(word => word.word === 'baby'), 'junior', vocabularyDatabase);
        showWord(vocabularyDatabase.junior.find(word => word.word === 'because'));
    });
    const counts = await page.evaluate(() => JSON.stringify(gameState.actionCounts));
    await expect(page.locator('#previousIllustrationBtn')).toBeVisible();
    await page.locator('#previousIllustrationBtn').click();
    await expect(page.locator('#wordIllustration')).toBeVisible();
    expect(await page.evaluate(() => JSON.stringify(gameState.actionCounts))).toBe(counts);
    await page.locator('#exampleReadingToggle').click();
    await page.locator('#undoBtn').click();
    await expect(page.locator('#exampleSentence')).toHaveText('I like apple pie.');
    await expect(page.locator('#exampleReadingPanel')).toBeHidden();
    expect(await page.evaluate(() => JSON.stringify({ word: gameState.currentWord.word, srs: gameState.srsData, counts: gameState.actionCounts }))).toBe(before);
});

test('例文の読み方：320・390・1280pxで長い例文と対応が画面内に収まる', async ({ page }, testInfo) => {
    const output = path.resolve('docs/experiments/example-reading-junior-complete-2026-11-06');
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.locator('#exampleReadingSample').selectOption('1322');
        await page.evaluate(() => document.fonts.ready);
        if (process.env.READING_CAPTURE === '1') await page.screenshot({ path: path.join(output, `${testInfo.project.name}-${width}-closed.png`), fullPage: true });
        await page.locator('#exampleReadingToggle').click();
        const layout = await page.evaluate(() => {
            const chunkOverflow = [...document.querySelectorAll('.example-reading-chunk')].some(element => element.scrollWidth > element.clientWidth + 1);
            return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, chunkOverflow,
                appWidth: document.querySelector('.container').getBoundingClientRect().width };
        });
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
        expect(layout.chunkOverflow).toBe(false);
        expect(layout.appWidth).toBeGreaterThanOrEqual(Math.min(width - 40, 600));
        if (process.env.READING_CAPTURE === '1') await page.screenshot({ path: path.join(output, `${testInfo.project.name}-${width}-reading.png`), fullPage: true });
        await page.getByText('全体の意味', { exact: true }).click();
        if (process.env.READING_CAPTURE === '1') await page.screenshot({ path: path.join(output, `${testInfo.project.name}-${width}-meaning.png`), fullPage: true });
    }
});
