const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../js/firebase_app_v2.js'), 'utf8');
const source = code.slice(code.indexOf('const REVIEW_FUNCTION_BASE'), code.indexOf('// 3. Auth Functions'));
const week = '2026-10-19';
const response = data => ({ ok: true, status: 200, json: async () => data });
const list = (score = 3) => ({ weekKey: week, todayKey: '2026-10-21', todayPoints: score,
    results: [{ name: 'テスト', score, rank: 1, isMe: true }], me: { name: 'テスト', score, rank: 1 } });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function load(fetcher) {
    const requests = [], applied = [], timers = [], saved = [];
    const auth = { currentUser: { uid: 'A', isAnonymous: true, getIdToken: async () => 'token-A' } };
    const state = { reviewScore: { pendingEvents: [] } };
    const context = { auth, gameState: state, isLocalDevelopment: true, URLSearchParams,
        AbortController, Date, console: { warn() {} },
        setTimeout(fn, ms) { timers.push(ms); return setTimeout(fn, Math.min(ms, 20)); }, clearTimeout,
        getReviewWeekKey: () => week, saveGame: () => saved.push(true),
        localStorage: { getItem() { return null; } },
        fetch: async (url, options) => { requests.push({ url, ...options }); return fetcher(url, options); },
        window: { applyServerReviewScore: data => applied.push(data) } };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { context, auth, state, requests, applied, timers, saved,
        run: text => vm.runInContext(text, context) };
}

test('ランキング通信：未送信ポイントを待たず一覧を取得し、個人得点を上書きしない', async () => {
    const env = load(async () => response(list()));
    env.state.reviewScore.pendingEvents.push({ eventId: 'pending' });
    env.context.window.syncPendingReviewScores = () => new Promise(() => {});
    const data = await env.context.window.fetchReviewLeaderboard();
    expect(data.results).toHaveLength(1);
    expect(data.useLocalScore).toBe(true);
    expect(env.requests).toHaveLength(1);
    expect(env.applied).toEqual([]);
    expect(env.state.reviewScore.pendingEvents[0].eventId).toBe('pending');
});

test('ランキング通信：認証待ちの時間切れは公開一覧へ切り替え、遅いトークンでは送信しない', async () => {
    const token = deferred(), env = load(async () => response({ ...list(), me: null, results: [] }));
    env.auth.currentUser.getIdToken = () => token.promise;
    const data = await env.context.window.fetchReviewLeaderboard();
    expect(data.publicOnly).toBe(true);
    expect(env.requests).toHaveLength(1);
    expect(env.requests[0].headers.Authorization).toBeUndefined();
    expect(env.applied).toEqual([]);
    expect(env.timers).toContain(6000);
    token.resolve('late-token');
    await new Promise(resolve => setImmediate(resolve));
    expect(env.requests).toHaveLength(1);
});

test('ランキング通信：認証エラーでも公開一覧を読める', async () => {
    const env = load(async (url, options) => options.headers.Authorization
        ? { ok: false, status: 401, json: async () => ({ error: 'expired' }) }
        : response({ ...list(), me: null }));
    expect((await env.context.window.fetchReviewLeaderboard()).publicOnly).toBe(true);
    expect(env.requests.map(r => Boolean(r.headers.Authorization))).toEqual([true, false]);
    expect(env.applied).toEqual([]);
});

test('ランキング通信：公開一覧も時間切れならエラーを返し通信を中断する', async () => {
    const env = load(() => new Promise(() => {}));
    env.auth.currentUser = null;
    expect((await env.context.window.fetchReviewLeaderboard()).error).toContain('時間');
    expect(env.requests[0].signal.aborted).toBe(true);
});

test('ランキング通信：同じ週・利用者の前回一覧を失敗時に返し、週やアカウントを混ぜない', async () => {
    let fail = false;
    const env = load(async () => { if (fail) throw new Error('offline'); return response(list()); });
    await env.context.window.fetchReviewLeaderboard();
    fail = true;
    const stale = await env.context.window.fetchReviewLeaderboard(true);
    expect(stale.stale).toBe(true);
    expect(stale.cachedAt).toBeGreaterThan(0);
    expect(stale.me.name).toBe('テスト');
    expect(stale.error).toBe('offline');
    expect(env.applied).toHaveLength(1);
    env.auth.currentUser = { uid: 'B', getIdToken: async () => 'token-B' };
    expect(env.context.window.getCachedReviewLeaderboard()).toBeNull();
    expect((await env.context.window.fetchReviewLeaderboard()).stale).toBeUndefined();
    env.auth.currentUser.uid = 'A';
    env.context.getReviewWeekKey = () => '2026-10-26';
    expect(env.context.window.getCachedReviewLeaderboard()).toBeNull();
});

test('ランキング通信：同時取得は一本化し、強制更新は新しい一覧を取得する', async () => {
    const pending = deferred(), env = load(() => pending.promise);
    const first = env.context.window.fetchReviewLeaderboard(), second = env.context.window.fetchReviewLeaderboard();
    await new Promise(resolve => setImmediate(resolve));
    expect(env.requests).toHaveLength(1);
    pending.resolve(response(list()));
    await Promise.all([first, second]);
    await env.context.window.fetchReviewLeaderboard();
    expect(env.requests).toHaveLength(1);
    await env.context.window.fetchReviewLeaderboard(true);
    expect(env.requests).toHaveLength(2);
});

test('ランキング通信：取得中の利用者変更は旧データの適用・キャッシュを防ぐ', async () => {
    const pending = deferred(), env = load(() => pending.promise);
    const reading = env.context.window.fetchReviewLeaderboard();
    await new Promise(resolve => setImmediate(resolve));
    env.auth.currentUser.uid = 'B';
    pending.resolve(response(list()));
    expect((await reading).error).toContain('変わりました');
    expect(env.applied).toEqual([]);
    expect(env.context.window.getCachedReviewLeaderboard()).toBeNull();
});

test('ランキング通信：同期中に読んだ古い得点は送信確定後の得点を巻き戻さない', async () => {
    const reading = deferred(), env = load(async url => url.endsWith('submitReviewScore')
        ? response({ todayKey: '2026-10-21', weekKey: week, todayPoints: 3, weekPoints: 3 }) : reading.promise);
    const pending = env.context.window.fetchReviewLeaderboard();
    await new Promise(resolve => setImmediate(resolve));
    env.state.reviewScore.pendingEvents.push({ eventId: 'one' });
    await env.context.window.syncPendingReviewScores();
    reading.resolve(response(list(0)));
    const data = await pending;
    expect(data.useLocalScore).toBe(true);
    expect(env.applied.map(p => p.weekPoints)).toEqual([3]);
    expect(env.context.window.getCachedReviewLeaderboard()).toBeNull();
});

test('ランキング通信：キャッシュが新しくても未送信分はローカル得点を使う', async () => {
    const env = load(async () => response(list()));
    await env.context.window.fetchReviewLeaderboard();
    env.state.reviewScore.pendingEvents.push({ eventId: 'pending' });
    env.context.window.syncPendingReviewScores = () => new Promise(() => {});
    expect((await env.context.window.fetchReviewLeaderboard()).useLocalScore).toBe(true);
    expect(env.requests).toHaveLength(1);
});

test('ランキング通信：送信時間切れはeventIdを残し、同じイベントの再送で二重加点しない', async () => {
    const accepted = new Set(); let first = true, points = 0;
    const env = load(async (url, options) => {
        const event = JSON.parse(options.body);
        if (!accepted.has(event.eventId)) { accepted.add(event.eventId); points += 3; }
        if (first) { first = false; return new Promise(() => {}); }
        return response({ todayKey: '2026-10-21', weekKey: week, todayPoints: points, weekPoints: points });
    });
    const event = { eventId: 'stable-event', points: 3 };
    env.state.reviewScore.pendingEvents.push(event);
    await env.context.window.syncPendingReviewScores();
    expect(env.state.reviewScore.pendingEvents).toEqual([event]);
    expect(env.applied).toEqual([]);
    expect(env.saved).toEqual([]);
    expect(env.requests[0].signal.aborted).toBe(true);
    expect(env.timers).toContain(12000);
    await env.context.window.syncPendingReviewScores();
    expect(env.requests.map(r => JSON.parse(r.body).eventId)).toEqual(['stable-event', 'stable-event']);
    expect(points).toBe(3);
    expect(env.state.reviewScore.pendingEvents).toEqual([]);
    expect(env.applied.map(data => data.weekPoints)).toEqual([3]);
    expect(env.saved).toHaveLength(1);
});

test('ランキング通信：不正な応答はイベントを消さず、失敗後も同期できる', async () => {
    const env = load(async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }));
    env.state.reviewScore.pendingEvents.push({ eventId: 'keep' });
    await env.context.window.syncPendingReviewScores();
    expect(env.state.reviewScore.pendingEvents[0].eventId).toBe('keep');
    expect(env.applied).toEqual([]);
    expect(env.run('reviewScoreSyncPromise')).toBeNull();
});

test('ランキング通信：送信中のアカウント変更で別アカウントのキューや得点を変更しない', async () => {
    const pending = deferred(), env = load(() => pending.promise);
    env.state.reviewScore.pendingEvents.push({ eventId: 'A-event' });
    const syncing = env.context.window.syncPendingReviewScores();
    await new Promise(resolve => setImmediate(resolve));
    env.auth.currentUser = { uid: 'B', getIdToken: async () => 'token-B' };
    env.state.reviewScore = { pendingEvents: [{ eventId: 'B-event' }] };
    pending.resolve(response({ todayKey: '2026-10-21', weekKey: week, todayPoints: 3, weekPoints: 3 }));
    await syncing;
    expect(env.state.reviewScore.pendingEvents).toEqual([{ eventId: 'B-event' }]);
    expect(env.applied).toEqual([]);
    expect(env.saved).toEqual([]);
});

test('ランキング通信：アカウント統合とプロフィール保存の通信仕様は変えない', async () => {
    const env = load(async () => response({ success: true }));
    await env.run("postReviewFunction('mergeGuestReviewScore', {}, true)");
    await env.context.window.updateReviewRankingProfile('名前', 'hero');
    expect(env.timers).toEqual([]);
    expect(env.requests.map(r => Boolean(r.headers.Authorization))).toEqual([true, true]);
});

test('ランキング通信：成功扱いでも壊れた得点応答・一覧を採用しない', async () => {
    for (const data of [{}, { error: 'bad' }, { todayKey: '2026-10-21', weekKey: week, todayPoints: 0, weekPoints: -1 }]) {
        const env = load(async () => response(data));
        env.state.reviewScore.pendingEvents.push({ eventId: 'keep' });
        await env.context.window.syncPendingReviewScores();
        expect(env.state.reviewScore.pendingEvents[0].eventId).toBe('keep');
        expect(env.applied).toEqual([]);
    }
    const env = load(async () => response({ ...list(), results: [null] }));
    expect((await env.context.window.fetchReviewLeaderboard()).error).toBeTruthy();
    expect(env.context.window.getCachedReviewLeaderboard()).toBeNull();
});

test('ランキング通信：プロフィール更新前の遅い一覧で新しいプロフィールを巻き戻さない', async () => {
    const old = deferred(); let reads = 0;
    const env = load(async url => {
        if (url.endsWith('updateReviewProfile')) return response({ success: true });
        return ++reads === 1 ? old.promise : response({ ...list(), me: { ...list().me, name: '新しい名前' } });
    });
    const first = env.context.window.fetchReviewLeaderboard();
    await new Promise(resolve => setImmediate(resolve));
    await env.context.window.updateReviewRankingProfile('新しい名前', 'cat');
    const second = await env.context.window.fetchReviewLeaderboard();
    expect(second.me.name).toBe('新しい名前');
    old.resolve(response(list()));
    await first;
    expect(env.context.window.getCachedReviewLeaderboard().me.name).toBe('新しい名前');
});
