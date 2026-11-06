const { test, expect } = require('@playwright/test');
const path = require('node:path');
const output = path.resolve('docs/experiments/example-panel-variants-2026-11-06');

test.beforeEach(async ({ page, baseURL }) => {
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

for (const layout of ['titleless', 'header']) {
    test(`例文2案：${layout} は見出しだけの段を作らず、同じ例文で比較できる`, async ({ page }, testInfo) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`/index.html?exampleReadingPreview=1&examplePanelLayout=${layout}`);
        await expect(page.locator('#exampleReadingSample')).toBeVisible();
        await page.locator('#vocabCard').click();
        await page.evaluate(() => {
            WordIllustrations.rememberAnswer(vocabularyDatabase.junior.find(word => word.word === 'baby'), 'junior', vocabularyDatabase);
            showWord(vocabularyDatabase.junior.find(word => word.word === 'because'));
        });
        for (const width of [280, 320, 390, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await page.evaluate(async () => {
                await document.fonts.ready;
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            });
            await expect(page.getByRole('region', { name: '例文', exact: true })).toBeVisible();
            await expect(page.locator('#exampleSentence')).toHaveText('I stayed home because I was sick.');
            if (layout === 'titleless') {
                await expect(page.locator('.example-reading-heading')).toBeHidden();
                expect(await page.locator('#exampleSentence').evaluate(element => getComputedStyle(element, '::before').maskImage || getComputedStyle(element, '::before').webkitMaskImage)).toContain('quote.svg');
            } else {
                await expect(page.locator('.example-reading-heading .example-actions')).toBeVisible();
                const row = await page.evaluate(() => {
                    const label = document.querySelector('.example-label').getBoundingClientRect();
                    const speaker = document.getElementById('speakerBtn').getBoundingClientRect();
                    return { labelCenter: label.y + label.height / 2, speakerTop: speaker.top, speakerBottom: speaker.bottom };
                });
                expect(row.labelCenter).toBeGreaterThanOrEqual(row.speakerTop);
                expect(row.labelCenter).toBeLessThanOrEqual(row.speakerBottom);
            }
            const metrics = await page.evaluate(() => {
                const area = document.getElementById('exampleArea').getBoundingClientRect();
                const toggle = document.getElementById('exampleReadingToggle').getBoundingClientRect();
                const buttons = [...document.querySelectorAll('#exampleArea .example-actions button')].map(button => {
                    const r = button.getBoundingClientRect();
                    return { width: r.width, height: r.height, left: r.left, right: r.right };
                });
                return { left: area.left, right: area.right, toggleTop: toggle.top - area.top, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, buttons };
            });
            expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
            for (const button of metrics.buttons) {
                expect(button.width).toBeGreaterThanOrEqual(44);
                expect(button.height).toBeGreaterThanOrEqual(44);
                expect(button.left).toBeGreaterThanOrEqual(metrics.left);
                expect(button.right).toBeLessThanOrEqual(metrics.right);
            }
            if (width !== 280 && testInfo.project.name === 'reading-desktop') {
                await page.mouse.move(0, 0);
                await page.locator('#exampleArea').screenshot({ path: path.join(output, `${layout}-${width}-closed.png`), scale: 'css' });
                await page.screenshot({ path: path.join(output, `${layout}-${width}-page.png`), fullPage: true, scale: 'css' });
            }
            const counts = await page.evaluate(() => JSON.stringify(gameState.actionCounts));
            await page.locator('#exampleReadingToggle').click();
            await expect(page.locator('#exampleReadingPanel')).toBeVisible();
            const top = await page.locator('#exampleReadingToggle').evaluate(element => element.getBoundingClientRect().top - document.getElementById('exampleArea').getBoundingClientRect().top);
            expect(top).toBeCloseTo(metrics.toggleTop, 0);
            if (width !== 280 && testInfo.project.name === 'reading-desktop') {
                await page.mouse.move(0, 0);
                await page.locator('#exampleArea').screenshot({ path: path.join(output, `${layout}-${width}-open.png`), scale: 'css' });
            }
            await page.locator('#exampleReadingToggle').click();
            expect(await page.evaluate(() => JSON.stringify(gameState.actionCounts))).toBe(counts);
        }
        await page.locator('#previousIllustrationBtn').click();
        await expect(page.locator('#wordIllustration')).toBeVisible();
        await page.locator('#undoBtn').click();
        await expect(page.locator('#exampleSentence')).toHaveText('I like apple pie.');
        expect(errors).toEqual([]);
    });
}

test('例文2案：指定がないプレビューも採用したA案になる', async ({ page }) => {
    await page.goto('/index.html?exampleReadingPreview=1');
    await expect(page.locator('#exampleReadingSample')).toBeVisible();
    await expect(page.locator('.example-reading-heading .example-label')).toHaveCount(0);
    await expect(page.locator('#exampleArea > .example-actions')).toBeVisible();
    await expect(page.locator('.example-panel-titleless')).toHaveCount(1);
    await expect(page.locator('.example-panel-header')).toHaveCount(0);
});
