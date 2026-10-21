const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium, webkit, expect } = require('@playwright/test');

const base = process.env.TENIOHA_RELEASE_URL || 'https://tomtommark2.github.io/tenioha-game/';
const version = fs.readFileSync('js/version.js', 'utf8').match(/GAME_VERSION\s*=\s*["']([^"']+)/)[1];
const folder = 'docs/experiments/review-leaderboard-release-2026-10-21';
const files = ['index.html', 'vocab_clicker_game.html', 'js/version.js', 'js/firebase_app_v2.js',
    'js/game_logic.js', 'js/ui_manager.js', 'style.css'];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
const api = source.slice(source.indexOf('const REVIEW_FUNCTION_BASE'), source.indexOf('// 3. Auth Functions'));
const moduleBody = `const auth = window.firebaseAuth = { currentUser: null };
const isLocalDevelopment = true;
${api}`;
const report = { base, version, files: [], cases: [], uiNetwork: 'isolated fixtures using actual ranking API code' };

(async () => {
    fs.mkdirSync(folder, { recursive: true });
    fs.mkdirSync('screenshots/ranking-release-20261021', { recursive: true });
    for (const file of files) {
        const response = await fetch(new URL(file + '?verify=' + version, base), { signal: AbortSignal.timeout(20000) });
        assert.equal(response.status, 200, file);
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(digest(bytes), digest(fs.readFileSync(file)), file + ' deployed bytes');
        report.files.push({ file, sha256: digest(bytes) });
    }
    if (base.startsWith('https:')) {
        const started = Date.now();
        const response = await fetch('https://us-central1-tenioha-game.cloudfunctions.net/getReviewLeaderboard', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
            signal: AbortSignal.timeout(15000)
        });
        const data = await response.json();
        assert.equal(response.status, 200);
        assert.ok(Array.isArray(data.results));
        report.publicApi = { status: response.status, entries: data.results.length, elapsedMs: Date.now() - started };
    }
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await engine.launch();
        try {
            for (const width of [320, 390, 1280]) {
                const context = await browser.newContext({ viewport: { width, height: 900 },
                    serviceWorkers: 'block', hasTouch: width <= 768, isMobile: width <= 768 });
                await context.route('**/*', route => {
                    const request = route.request(), url = new URL(request.url());
                    if (url.pathname.endsWith('/js/firebase_app_v2.js')) {
                        return route.fulfill({ contentType: 'application/javascript', body: moduleBody });
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
                    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
                    const originalFetch = window.fetch.bind(window);
                    window.rankingReleaseOffline = false;
                    window.fetch = (input, options) => {
                        const url = String(input);
                        if (url.endsWith('/feedback')) return Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false })));
                        if (url.endsWith('/getReviewLeaderboard')) {
                            if (window.rankingReleaseOffline) return Promise.reject(new TypeError('offline'));
                            return Promise.resolve(new Response(JSON.stringify({ todayKey: getLocalDateKey(), weekKey: getReviewWeekKey(),
                                todayPoints: 0, me: null, results: [{ rank: 1, name: '表示確認', score: 30, avatarId: 'hero' }] })));
                        }
                        return originalFetch(input, options);
                    };
                });
                const page = await context.newPage(), errors = [];
                page.on('pageerror', error => errors.push(error.message));
                const entry = width === 320 ? 'vocab_clicker_game.html' : 'index.html';
                await page.goto(new URL(entry + '?appVersion=' + version, base).href);
                await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
                await expect.poll(() => page.evaluate(() => typeof window.fetchReviewLeaderboard)).toBe('function');
                if (await page.evaluate(() => shouldAutoOpenFeaturedAnnouncement(getFeaturedAnnouncement()))) {
                    await expect(page.locator('#announcementModal')).toBeVisible();
                    await page.locator('#announcementModal').getByRole('button', { name: 'あとで', exact: true }).click();
                    await expect(page.locator('#announcementModal')).toBeHidden();
                }
                const records = () => page.evaluate(() => JSON.stringify({ save: localStorage.getItem('vocabClickerSave'),
                    states: gameState.wordStates, score: gameState.reviewScore, questions: gameState.globalQuestionCount }));
                const before = await records();
                await page.evaluate(() => {
                    window.checkForceUpdate = () => new Promise(() => {});
                    window.ensureRankingIdentity = () => new Promise(() => {});
                });
                const trigger = page.getByRole('button', { name: '復習ランキングを開く', exact: true });
                await trigger.focus();
                await trigger.press('Enter');
                await expect(page.locator('#lb-list-top')).toContainText('表示確認');
                await expect(page.locator('#lb-loading')).toBeHidden();
                await expect(page.locator('#loginRequiredMessage')).toBeHidden();
                await page.evaluate(() => { window.rankingReleaseOffline = true; });
                await page.locator('#reviewRankingRetry').click();
                await expect(page.locator('#reviewRankingStatus')).toContainText('前回の表示');
                await expect(page.locator('#reviewRankingRetry')).toHaveText('再試行');
                await expect(page.locator('#lb-list-top')).toContainText('表示確認');
                const bounds = await page.locator('#reviewRankingRetry').evaluate(button => {
                    const rect = button.getBoundingClientRect(), row = button.parentElement.getBoundingClientRect();
                    return { height: rect.height, inside: rect.left >= row.left && rect.right <= row.right + 1
                        && rect.top >= row.top && rect.bottom <= row.bottom + 1 };
                });
                assert.ok(bounds.height >= 44 && bounds.inside);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
                await page.locator('#leaderboardModal').screenshot({
                    path: `screenshots/ranking-release-20261021/${name}-${width}.png`
                });
                await page.evaluate(() => { window.rankingReleaseOffline = false; });
                await page.locator('#reviewRankingRetry').click();
                await expect(page.locator('#reviewRankingStatus')).toBeEmpty();
                await expect(page.locator('#reviewRankingRetry')).toHaveText('更新');
                await page.clock.install();
                await page.evaluate(() => { window.fetchReviewLeaderboard = () => new Promise(() => {}); });
                await page.locator('#reviewRankingRetry').click();
                await page.clock.runFor(14010);
                await expect(page.locator('#lb-loading')).toBeHidden();
                await expect(page.locator('#reviewRankingRetry')).toHaveText('再試行');
                await expect(page.locator('#reviewRankingRetry')).toBeEnabled();
                await page.keyboard.press('Escape');
                await expect(page.locator('#leaderboardModal')).toBeHidden();
                await expect(trigger).toBeFocused();
                assert.equal(await records(), before, 'No learning data mutation');
                assert.deepEqual(errors, []);
                report.cases.push({ browser: name, width, entry, nonBlockingList: true, staleFallback: true,
                    retryRecovery: true, uiDeadline: true, learningUnchanged: true, retryBounds: bounds, pageErrors: errors });
                await context.close();
            }
        } finally { await browser.close(); }
    }
    const output = path.join(folder, base.startsWith('https:') ? 'live-verification.json' : 'local-verification.json');
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ version, files: report.files.length, cases: report.cases.length, publicApi: report.publicApi, output }));
})().catch(error => { console.error(error); process.exitCode = 1; });
