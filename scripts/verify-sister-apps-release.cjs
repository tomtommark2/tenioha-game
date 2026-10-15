const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium, webkit, expect } = require('@playwright/test');

const base = process.env.TENIOHA_RELEASE_URL || 'https://tomtommark2.github.io/tenioha-game/';
const version = fs.readFileSync('js/version.js', 'utf8').match(/GAME_VERSION\s*=\s*["']([^"']+)/)[1];
const folder = 'docs/experiments/sister-apps-release-2026-10-15';
const shots = 'screenshots/sister-apps-release-20261015';
const files = ['index.html', 'vocab_clicker_game.html', 'js/version.js', 'js/game_logic.js',
    'js/ui_manager.js', 'js/sister_apps.js', 'sister-apps.css', 'service_worker.js',
    'assets/ui/grid-view-rounded.svg', 'assets/ui/open-in-new-rounded.svg',
    ...['dictionary-icon.png', 'sentence-icon.png', 'dictionary-promo-v3.mp4',
        'sentence-promo-v1.mp4', 'dictionary-promo-poster-v3.jpg',
        'sentence-promo-poster-v1.jpg'].map(file => 'assets/sister-apps/' + file)];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { base, version, files: [], cases: [] };

async function visiblePixels(page, video) {
    const rect = await video.boundingBox();
    return digest(await page.screenshot({ clip: { x: rect.x + 8, y: rect.y + rect.height * .34,
        width: rect.width - 16, height: rect.height * .6 } }));
}

(async () => {
    fs.mkdirSync(folder, { recursive: true });
    fs.mkdirSync(shots, { recursive: true });
    for (const file of files) {
        const response = await fetch(new URL(file + '?verify=' + version, base));
        assert.equal(response.status, 200, file);
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(digest(bytes), digest(fs.readFileSync(file)), file + ' deployed bytes');
        report.files.push({ file, sha256: digest(bytes) });
    }
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await engine.launch();
        try {
            for (const width of [320, 390, 1280]) {
                const context = await browser.newContext({ viewport: { width, height: 900 },
                    serviceWorkers: 'block', hasTouch: width <= 768, isMobile: width <= 768 });
                await context.route('**/*', route => {
                    const request = route.request(), url = new URL(request.url());
                    if (url.hostname === 'us-central1-tenioha-game.cloudfunctions.net' && url.pathname === '/feedback') {
                        return route.fulfill({ json: { items: [], isAdmin: false },
                            headers: { 'Access-Control-Allow-Origin': '*' } });
                    }
                    return ['GET', 'HEAD'].includes(request.method()) && (url.origin === new URL(base).origin
                        || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname))
                        ? route.continue() : route.abort('blockedbyclient');
                });
                await context.addInitScript(() => {
                    localStorage.setItem('vocabGame_skipWelcome', 'true');
                    localStorage.setItem('vocabGame_skipLiveTutorial', 'true');
                    localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
                    localStorage.setItem('vocabGame_installGuideDismissed', 'true');
                    localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
                });
                const page = await context.newPage(), errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(base + '?appVersion=' + version);
                await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
                await page.evaluate(() => document.fonts.ready);
                const records = () => page.evaluate(() => JSON.stringify({ save: localStorage.getItem('vocabClickerSave'),
                    states: gameState.wordStates, score: gameState.reviewScore, questions: gameState.globalQuestionCount }));
                const before = await records();
                await page.getByRole('button', { name: 'ほかの学習アプリ', exact: true }).click();
                const panel = page.getByRole('dialog', { name: 'ほかの学習アプリ' });
                await expect(panel).toBeVisible();
                await expect(panel.locator('a')).toHaveCount(2);
                const card = panel.locator('.sister-apps-card').first(), video = card.locator('video');
                await expect.poll(() => video.evaluate(e => e.currentTime > .15 && e.currentTime < 2.4)).toBe(true);
                const up = await visiblePixels(page, video);
                await expect(card.locator('.sister-apps-example strong')).toHaveText('EVEN', { timeout: 7000 });
                await expect.poll(() => video.evaluate(e => e.currentTime > 3.1)).toBe(true);
                const even = await visiblePixels(page, video);
                assert.notEqual(up, even, name + '/' + width + ' actual diagram must change');
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
                await page.screenshot({ path: path.join(shots, name + '-' + width + '.png') });
                if (width <= 768) {
                    await panel.locator('.sister-apps-media').last().scrollIntoViewIfNeeded();
                    await expect.poll(() => panel.locator('video').last().evaluate(e => !e.paused && e.readyState >= 2)).toBe(true);
                }
                await page.getByRole('button', { name: '紹介を閉じる', exact: true }).click();
                await expect(panel).toBeHidden();
                await expect(page.getByRole('button', { name: 'ほかの学習アプリ', exact: true })).toBeFocused();
                assert.equal(await records(), before, 'Opening the promotion must not mutate learning data');
                assert.deepEqual(errors, []);
                report.cases.push({ browser: name, width, up, even, pageErrors: errors, learningUnchanged: true });
                await context.close();
            }
        } finally { await browser.close(); }
    }
    const output = path.join(folder, base.startsWith('https:') ? 'live-verification.json' : 'local-verification.json');
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ version, files: report.files.length, cases: report.cases.length, output }));
})().catch(error => { console.error(error); process.exitCode = 1; });
