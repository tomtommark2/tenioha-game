const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
const api = source.slice(source.indexOf('const REVIEW_FUNCTION_BASE'), source.indexOf('// 3. Auth Functions'));
const moduleBody = `const auth = window.firebaseAuth = { currentUser: null };
const isLocalDevelopment = true;
${api}
window.rankingTestAuth = auth;`;
const errors = new WeakMap();
test.beforeEach(async ({ page, context }) => {
    errors.set(page, []);
    page.on('pageerror', error => errors.get(page).push(error.message));
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/js/firebase_app_v2.js')) return route.fulfill({ contentType: 'application/javascript', body: moduleBody });
        if (['localhost', '127.0.0.1'].includes(url.hostname)) return route.continue();
        return route.abort('blockedbyclient');
    });
    await page.addInitScript(() => {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
        localStorage.setItem('vocabGame_skipLiveTutorial', 'true');
        localStorage.setItem('vocabGame_disableAutoUpdate', 'true');
        localStorage.setItem('vocabGame_lastAutoShownAnnouncementId', '2026-10-04-noun-illustrations-complete');
        const originalFetch = window.fetch.bind(window);
        window.rankingTestCalls = [];
        window.rankingTestOffline = false;
        window.fetch = (input, options) => {
            const url = String(input);
            if (url.endsWith('/feedback')) return Promise.resolve(new Response(JSON.stringify({ items: [], isAdmin: false })));
            if (url.includes('cloudfunctions.net/')) {
                window.rankingTestCalls.push({ url, options });
                if (window.rankingTestOffline) return Promise.reject(new TypeError('offline'));
                return Promise.resolve(new Response(JSON.stringify({ todayKey: getLocalDateKey(), weekKey: getReviewWeekKey(),
                    todayPoints: 0, me: null, results: [{ rank: 1, name: 'テスト参加者', score: 30, avatarId: 'hero' }] })));
            }
            return originalFetch(input, options);
        };
    });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });
async function ready(page, entry = 'index.html') {
    await page.goto('/' + entry);
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await expect.poll(() => page.evaluate(() => Boolean(window.rankingTestAuth))).toBe(true);
}
const open = page => page.evaluate(() => openLeaderboard());
const saved = page => page.evaluate(() => JSON.stringify({ save: localStorage.getItem('vocabClickerSave'),
    states: gameState.wordStates, score: gameState.reviewScore, srs: gameState.srsData }));

for (const entry of ['index.html', 'vocab_clicker_game.html']) {
    test(`ランキング読込：${entry}は認証と更新確認が止まっても一覧を表示する`, async ({ page }) => {
        await ready(page, entry);
        const before = await saved(page);
        await page.evaluate(() => {
            window.checkForceUpdate = () => new Promise(() => {});
            window.ensureRankingIdentity = () => new Promise(() => {});
        });
        await open(page);
        await expect(page.locator('#lb-list-top')).toContainText('テスト参加者');
        await expect(page.locator('#lb-loading')).toBeHidden();
        await expect(page.locator('#loginRequiredMessage')).toBeHidden();
        await expect(page.locator('#reviewRankingRetry')).toBeEnabled();
        expect(await saved(page)).toBe(before);
    });
}

test('ランキング読込：未送信ポイントが詰まっても一覧とローカル得点を保持する', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
        rankingTestAuth.currentUser = { uid: 'test-guest', isAnonymous: true, getIdToken: () => new Promise(() => {}) };
        gameState.reviewScore.pendingEvents = [{ eventId: 'keep', points: 3 }];
        gameState.reviewScore.history[getLocalDateKey()] = { points: 3 };
        window.syncPendingReviewScores = () => new Promise(() => {});
        rankingTestAuth.currentUser.getIdToken = async () => 'test-token';
    });
    const before = await saved(page);
    await open(page);
    await expect(page.locator('#lb-list-top')).toContainText('テスト参加者');
    await expect(page.locator('#reviewRankingWeekPoints')).toHaveText('3pt');
    expect(await saved(page)).toBe(before);
});

test('ランキング読込：失敗時は前回一覧を残し、再試行で更新する', async ({ page }, testInfo) => {
    await ready(page);
    await open(page);
    await expect(page.locator('#lb-list-top')).toContainText('テスト参加者');
    await page.evaluate(() => { window.rankingTestOffline = true; });
    await page.locator('#reviewRankingRetry').click();
    await expect(page.locator('#reviewRankingStatus')).toContainText('前回の表示');
    await expect(page.locator('#reviewRankingRetry')).toHaveText('再試行');
    await expect(page.locator('#lb-list-top')).toContainText('テスト参加者');
    await expect(page.locator('#lb-loading')).toBeHidden();
    for (const width of testInfo.project.name.startsWith('mobile-') ? [320, 390] : [1280, 320]) {
        await page.setViewportSize({ width, height: 844 });
        const bounds = await page.locator('#reviewRankingRetry').evaluate(button => {
            const rect = button.getBoundingClientRect(), row = button.parentElement.getBoundingClientRect();
            return { height: rect.height, inside: rect.left >= row.left && rect.right <= row.right + 1
                && rect.top >= row.top && rect.bottom <= row.bottom + 1 };
        });
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.inside).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.locator('#leaderboardModal').screenshot({ path: testInfo.outputPath(`ranking-stale-${width}.png`) });
    }
    await page.evaluate(() => { window.rankingTestOffline = false; });
    await page.locator('#reviewRankingRetry').click();
    await expect(page.locator('#reviewRankingStatus')).toBeEmpty();
    await expect(page.locator('#reviewRankingRetry')).toHaveText('更新');
});

test('ランキング読込：時間切れは読み込みを終え、復旧後に再試行できる', async ({ page }) => {
    await page.clock.install();
    await ready(page);
    await page.evaluate(() => {
        window.fetchReviewLeaderboard = () => new Promise(() => {});
    });
    await open(page);
    await page.clock.runFor(14010);
    await expect(page.locator('#lb-loading')).toBeHidden();
    await expect(page.locator('#lb-list-top')).toContainText('取得できませんでした');
    await expect(page.locator('#reviewRankingRetry')).toHaveText('再試行');
    await page.evaluate(() => {
        window.fetchReviewLeaderboard = async () => ({ results: [{ name: '復旧', rank: 1, score: 1 }] });
    });
    await page.locator('#reviewRankingRetry').click();
    await expect(page.locator('#lb-list-top')).toContainText('復旧');
});

test('ランキング読込：認証トークンの時間切れは公開順位を表示し、本人得点をゼロにしない', async ({ page }) => {
    await page.clock.install();
    await ready(page);
    await page.evaluate(() => {
        rankingTestAuth.currentUser = { uid: 'token-stuck', isAnonymous: true, getIdToken: () => new Promise(() => {}) };
        applyServerReviewScore({ userId: 'token-stuck', todayKey: getLocalDateKey(), todayPoints: 5,
            weekKey: getReviewWeekKey(), weekPoints: 10 });
    });
    await open(page);
    await page.clock.runFor(6010);
    await expect(page.locator('#lb-list-top')).toContainText('テスト参加者');
    await expect(page.locator('#reviewRankingWeekPoints')).toHaveText('10pt');
    expect(await page.evaluate(() => rankingTestCalls.filter(c => c.options.headers.Authorization).length)).toBe(0);
});

test('ランキング読込：強制更新の制限画面を維持する', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
        window.checkForceUpdate = async () => {
            document.getElementById('forceUpdateModal').style.display = 'flex';
            return false;
        };
    });
    await open(page);
    await expect(page.locator('#forceUpdateModal')).toBeVisible();
    await expect(page.locator('#leaderboardModal')).toBeHidden();
});

test('ランキング読込：閉じた後や前のリクエストの遅い応答で一覧を巻き戻さない', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
        window.rankingReplies = [];
        window.fetchReviewLeaderboard = () => new Promise(resolve => rankingReplies.push(resolve));
    });
    await open(page);
    await page.evaluate(() => closeLeaderboard());
    await open(page);
    await page.evaluate(() => rankingReplies[1]({ results: [{ name: '新しい一覧', rank: 1, score: 2 }] }));
    await expect(page.locator('#lb-list-top')).toContainText('新しい一覧');
    await page.evaluate(() => rankingReplies[0]({ results: [{ name: '古い一覧', rank: 1, score: 1 }] }));
    await expect(page.locator('#lb-list-top')).not.toContainText('古い一覧');
    await page.getByRole('button', { name: 'ランキングを閉じる', exact: true }).click();
    await expect(page.locator('#leaderboardModal')).toBeHidden();
});

test('ランキング読込：名前・順位の表示はプレーンテキストで閉じると入口に戻る', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
        window.fetchReviewLeaderboard = async () => ({ results: [{ name: '<img src=x onerror=alert(1)>', rank: 1, score: 1 }] });
    });
    const trigger = page.getByRole('button', { name: '復習ランキングを開く', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(page.locator('#lb-list-top .rank-name')).toHaveText('<img src=x onerror=alert(1)>');
    await expect(page.locator('#lb-list-top .rank-name img')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#leaderboardModal')).toBeHidden();
    await expect(trigger).toBeFocused();
});

test('ランキング読込：通信機能の遅い読み込みは再試行でき、到着後は表示を回復する', async ({ page }) => {
    await page.route('**/js/firebase_app_v2.js*', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/index.html');
    await expect(page.locator('#vocabWord')).toHaveText('クリックしてスタート');
    await open(page);
    await expect(page.locator('#reviewRankingRetry')).toHaveText('再試行');
    await expect(page.locator('#lb-loading')).toBeHidden();
    await page.unroute('**/js/firebase_app_v2.js*');
    await page.evaluate(() => import('/js/firebase_app_v2.js?late-ranking-module=1'));
    await expect(page.locator('#lb-list-top')).toContainText('テスト参加者');
    await expect(page.locator('#reviewRankingRetry')).toBeEnabled();
});
