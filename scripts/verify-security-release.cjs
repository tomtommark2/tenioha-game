const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium, webkit, expect } = require('@playwright/test');

const base = process.env.TENIOHA_RELEASE_URL || 'https://tomtommark2.github.io/tenioha-game/';
const version = fs.readFileSync('js/version.js', 'utf8').match(/GAME_VERSION\s*=\s*["']([^"']+)/)[1];
const files = ['index.html', 'vocab_clicker_game.html', 'js/version.js', 'js/app_check_client.js',
    'js/firebase_app_v2.js', 'js/ui_manager.js', 'js/feedback.js', 'service_worker.js'];
const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
const api = source.slice(source.indexOf('const REVIEW_FUNCTION_BASE'), source.indexOf('// 3. Auth Functions'));
const moduleBody = `const auth = window.firebaseAuth = { currentUser: null }; const isLocalDevelopment = true; ${api}`;
const report = { version, base, files: [], cases: [], uiNetwork: 'isolated API fixtures; no production identity, purchase, posting, or learning writes' };

(async () => {
    for (const file of files) {
        const response = await fetch(new URL(file + '?verify=' + version, base), { signal: AbortSignal.timeout(20000) });
        assert.equal(response.status, 200, file);
        const digest = value => crypto.createHash('sha256').update(value).digest('hex');
        const actual = digest(Buffer.from(await response.arrayBuffer()));
        assert.equal(actual, digest(fs.readFileSync(file)), file + ' deployed bytes');
        report.files.push({ file, sha256: actual });
    }
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await engine.launch();
        try {
            for (const width of [320, 1280]) {
                const context = await browser.newContext({ viewport: { width, height: 900 },
                    serviceWorkers: 'block', hasTouch: width < 768, isMobile: width < 768 });
                let providerRequests = 0, checkoutRequests = 0;
                await context.route('**/*', route => {
                    const req = route.request(), url = new URL(req.url());
                    if (/recaptcha|firebase-app-check/.test(url.href)) providerRequests++;
                    if (url.pathname.endsWith('/js/firebase_app_v2.js')) return route.fulfill({ contentType: 'application/javascript', body: moduleBody });
                    if (url.pathname.endsWith('/getReviewLeaderboard')) return route.fulfill({ json: {
                        todayKey: '2026-10-22', weekKey: '2026-10-19', todayPoints: 0, me: null,
                        results: [{ rank: 1, name: '表示確認', score: 30, avatarId: 'hero' }] } });
                    if (url.pathname.endsWith('/feedback')) return route.fulfill({ json: { items: [], isAdmin: false } });
                    if (url.pathname.endsWith('/createStripeCheckoutSession')) {
                        checkoutRequests++;
                        assert.equal(req.headers()['x-firebase-appcheck'], undefined);
                        return route.fulfill({ status: 403, json: { error: '時間をおいてお試しください。' } });
                    }
                    return ['GET', 'HEAD'].includes(req.method()) && (url.origin === new URL(base).origin
                        || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname))
                        ? route.continue() : route.abort('blockedbyclient');
                });
                await context.addInitScript(() => {
                    for (const key of ['skipWelcome', 'skipLiveTutorial', 'disableAutoUpdate', 'installGuideDismissed']) localStorage.setItem('vocabGame_' + key, 'true');
                    localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
                });
                const page = await context.newPage(), errors = [], messages = [];
                page.on('pageerror', error => errors.push(error.message));
                page.on('dialog', async dialog => { messages.push(dialog.message()); await dialog.accept(); });
                const entry = width === 320 ? 'vocab_clicker_game.html' : 'index.html';
                await page.goto(new URL(entry + '?appVersion=' + version, base).href);
                await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
                await expect.poll(() => page.evaluate(() => typeof window.fetchReviewLeaderboard)).toBe('function');
                if (await page.evaluate(() => shouldAutoOpenFeaturedAnnouncement(getFeaturedAnnouncement()))) {
                    await expect(page.locator('#announcementModal')).toBeVisible();
                    await page.locator('#announcementModal').getByRole('button', { name: 'あとで', exact: true }).click();
                }
                const records = () => page.evaluate(() => JSON.stringify({ save: localStorage.getItem('vocabClickerSave'),
                    words: gameState.wordStates, score: gameState.reviewScore, srs: gameState.srsData }));
                const before = await records();
                assert.deepEqual(await page.evaluate(() => window.teniohaAppCheckClient.headers()), {});
                await page.evaluate(() => openLeaderboard());
                await expect(page.locator('#lb-list-top')).toContainText('表示確認');
                await page.keyboard.press('Escape');
                await expect(page.locator('#leaderboardModal')).toBeHidden();
                await page.evaluate(() => {
                    window.firebaseAuth.currentUser = { uid: 'fixture-member', isAnonymous: false, getIdToken: async () => 'fixture-token' };
                    window.isRegisteredFirebaseUser = () => true;
                    window.openPurchaseModal();
                });
                await expect(page.locator('#purchaseModal')).toBeVisible();
                const beforeUrl = page.url();
                await page.locator('#stripePurchaseLink').click();
                await expect.poll(() => messages.length).toBe(1);
                assert.equal(checkoutRequests, 1);
                assert.equal(page.url(), beforeUrl);
                assert.equal(providerRequests, 0, 'Deferred App Check must not load attestation scripts');
                assert.equal(await records(), before, 'Learning records must not change');
                assert.deepEqual(errors, []);
                report.cases.push({ browser: name, width, entry, ranking: true, checkoutDenialNoFallback: true,
                    providerRequests, learningUnchanged: true, pageErrors: errors });
                await context.close();
            }
        } finally { await browser.close(); }
    }
    const folder = 'docs/experiments/security-release-2026-10-22';
    fs.mkdirSync(folder, { recursive: true });
    const output = folder + (base.startsWith('https:') ? '/live-verification.json' : '/local-verification.json');
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ version, files: report.files.length, cases: report.cases.length, output }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
