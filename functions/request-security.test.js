const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { enforceSensitiveActionLimit, respondToSensitiveActionLimit } = require('./request-security');

function memoryDatabase() {
    const data = new Map(), reads = [];
    let queue = Promise.resolve();
    function mergeValue(value, old) {
        if (value?.increment) return (old || 0) + value.increment;
        if (value?.union) return [...new Set([...(old || []), ...value.union])];
        return value;
    }
    const db = {
        collection: name => ({ doc: id => ({ path: `${name}/${id}`,
            get: async () => snapshot(`${name}/${id}`),
            set: async (value, options) => write(`${name}/${id}`, value, options) }) }),
        runTransaction: fn => {
            const work = queue.then(async () => {
                const writes = [];
                const result = await fn({ get: async ref => snapshot(ref.path),
                    set: (ref, value, options) => writes.push(() => write(ref.path, value, options)),
                    update: (ref, value) => writes.push(() => write(ref.path, value, { merge: true })) });
                writes.forEach(write => write());
                return result;
            });
            queue = work.catch(() => {});
            return work;
        }
    };
    function snapshot(path) { reads.push(path); return { exists: data.has(path), data: () => data.get(path) }; }
    function write(path, value, options) {
        const previous = data.get(path) || {};
        data.set(path, { ...(options?.merge ? previous : {}),
            ...Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mergeValue(item, previous[key])])) });
    }
    return { db, data, reads };
}
function response() {
    return { code: 200, headers: {}, set(name, value) { this.headers[name] = value; return this; },
        status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; },
        send(value) { this.body = value; return this; } };
}

test('機密操作：1分5回をトランザクションで制限し、再試行時刻を返す', async () => {
    const { db, data } = memoryDatabase();
    for (let i = 0; i < 5; i++) await enforceSensitiveActionLimit(db, 'promo', 'private-user', 1000);
    const res = response();
    await assert.rejects(enforceSensitiveActionLimit(db, 'promo', 'private-user', 2000), error => {
        assert.equal(respondToSensitiveActionLimit(error, res), true);
        return true;
    });
    assert.equal(res.code, 429);
    assert.equal(res.headers['Retry-After'], '59');
    assert.equal(data.size, 1);
    assert.equal([...data.values()][0].count, 5);
    assert.equal([...data.keys()][0].includes('private-user'), false);
});

test('機密操作：別ユーザー・別操作と分離し、60秒後は同じ記録を再利用する', async () => {
    const { db, data } = memoryDatabase();
    for (let i = 0; i < 5; i++) await enforceSensitiveActionLimit(db, 'promo', 'A', 1000);
    await enforceSensitiveActionLimit(db, 'checkout', 'A', 1000);
    await enforceSensitiveActionLimit(db, 'promo', 'B', 1000);
    await enforceSensitiveActionLimit(db, 'promo', 'A', 61000);
    assert.equal(data.size, 3);
    assert.equal([...data.values()].filter(value => value.startedAt === 61000)[0].count, 1);
});

test('機密操作：並列リクエストでも5回だけ通し、失敗した制限を握りつぶさない', async () => {
    const { db, data } = memoryDatabase();
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => enforceSensitiveActionLimit(db, 'checkout', 'A', 1000)));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 5);
    assert.equal(results.filter(result => result.status === 'rejected').length, 7);
    assert.equal(data.size, 1);
    await assert.rejects(enforceSensitiveActionLimit({ runTransaction: () => { throw new Error('offline'); }, collection: db.collection }, 'checkout', 'B', 1000), /offline/);
    assert.equal(respondToSensitiveActionLimit(new Error('internal detail'), response()), false);
    await assert.rejects(enforceSensitiveActionLimit(db, 'arbitrary', 'A', 1000));
    await assert.rejects(enforceSensitiveActionLimit(db, 'promo', '', 1000));
});

test('機密操作：遅い時計のリクエストでも利用中の窓をリセットしない', async () => {
    const { db } = memoryDatabase();
    for (let i = 0; i < 5; i++) await enforceSensitiveActionLimit(db, 'promo', 'A', () => 2000);
    await assert.rejects(enforceSensitiveActionLimit(db, 'promo', 'A', () => 1999));
    await enforceSensitiveActionLimit(db, 'promo', 'A', () => 62000);
});

// Execute the actual HTTP handlers with in-memory Firebase and Stripe doubles.
// No credentials, production authentication, payments, or network are involved.
function handlersFixture() {
    const store = memoryDatabase(), calls = { checkout: [], customer: 0, signatures: 0 };
    let blocklist = { schemaVersion: 1, blockedUids: [], blockedEmails: [] };
    store.db.doc = path => ({ get: async () => ({ exists: !!blocklist, data: () => blocklist }) });
    const tokens = { member: { uid: 'member', firebase: { sign_in_provider: 'google.com' } },
        guest: { uid: 'guest', firebase: { sign_in_provider: 'anonymous' } } };
    const firestore = () => store.db;
    firestore.FieldValue = { serverTimestamp: () => 'server-time', increment: increment => ({ increment }), arrayUnion: (...union) => ({ union }) };
    firestore.Timestamp = { fromMillis: value => ({ toMillis: () => value }), fromDate: value => ({ toMillis: () => value.getTime() }) };
    const stripe = {
        customers: { create: async () => { calls.customer++; return { id: 'cus_fixture' }; } },
        checkout: { sessions: { create: async value => { calls.checkout.push(value); return { id: 'cs_fixture', url: 'https://checkout.stripe.com/fixture' }; } } },
        webhooks: { constructEvent: (body, signature) => {
            calls.signatures++;
            if (signature !== 'fixture-valid') throw new Error('invalid signature');
            return JSON.parse(body.toString());
        } }
    };
    let now = 100000;
    const context = { exports: {}, Buffer, URL, Set, Date, Intl, console,
        process: { env: { STRIPE_SECRET_KEY: 'fixture-only', STRIPE_WEBHOOK_SECRET: 'fixture-only', TENIOHA_STRIPE_PRICE_ID: 'price_fixture' } },
        require: name => {
            if (name === 'firebase-functions') return { setGlobalOptions() {} };
            if (name === 'firebase-functions/v2/https') return { onRequest: (options, handler) => handler || options };
            if (name === 'firebase-functions/logger') return { info() {}, warn() {}, error() {} };
            if (name === 'firebase-admin') return { initializeApp() {}, firestore,
                auth: () => ({ verifyIdToken: async token => {
                    if (!tokens[token]) throw Object.assign(new Error('private auth detail'), { code: 'auth/argument-error' });
                    return tokens[token];
                }, getUser: async uid => ({ uid, displayName: 'テスト' }) }) };
            if (name === 'firebase-admin/app-check') return { getAppCheck: () => ({ verifyToken: async () => ({ appId: require('./app-check-security').EXPECTED_APP_ID }) }) };
            if (name === './account-security') return require('./account-security');
            if (name === './app-check-security') return require('./app-check-security');
            if (name === './request-security') return { respondToSensitiveActionLimit,
                enforceSensitiveActionLimit: (db, action, uid) => enforceSensitiveActionLimit(db, action, uid, now) };
            if (name === './feedback') return { buildFeedbackFunction() {} };
            if (name === 'stripe') return () => stripe;
            if (name === './review-score-policy') return require('./review-score-policy');
            if (name === './review_word_hashes.json') return require('./review_word_hashes.json');
            throw new Error(`Unexpected module ${name}`);
        } };
    vm.runInNewContext(fs.readFileSync(require.resolve('./index'), 'utf8'), context, { filename: 'functions/index.js' });
    async function call(name, token, body = {}, options = {}) {
        const res = response();
        const { headers, ...requestOptions } = options;
        await context.exports[name]({ method: 'POST', body, ...requestOptions, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}),
            origin: 'https://tomtommark2.github.io', ...headers } }, res);
        return res;
    }
    return { ...store, calls, call, env: context.process.env, setBlocklist: value => { blocklist = value; }, advance: ms => { now += ms; } };
}

test('購入・コードAPI：未認証・匿名は制限記録や購入・権限を書き込まない', async () => {
    for (const name of ['createStripeCheckoutSession', 'redeemTeniohaPromoCode']) {
        for (const token of [null, 'guest', 'invalid']) {
            const f = handlersFixture();
            const res = await f.call(name, token, { code: 'fake', uid: 'forged' });
            assert.ok([401, 403, 500].includes(res.code));
            assert.equal(f.data.size, 0);
            assert.equal(f.calls.checkout.length, 0);
            assert.equal(f.calls.customer, 0);
            assert.equal(JSON.stringify(res.body).includes('private auth detail'), false);
        }
    }
});

test('購入API：6回目はStripeへ送らず429、本人UIDと固定Priceを維持する', async () => {
    const f = handlersFixture();
    for (let i = 0; i < 5; i++) assert.equal((await f.call('createStripeCheckoutSession', 'member', { uid: 'forged', price: 'price_forged', returnUrl: 'https://evil.invalid/' })).code, 200);
    const denied = await f.call('createStripeCheckoutSession', 'member');
    assert.equal(denied.code, 429);
    assert.equal(denied.headers['Retry-After'], '60');
    assert.equal(f.calls.checkout.length, 5);
    for (const session of f.calls.checkout) {
        assert.equal(session.client_reference_id, 'member');
        assert.equal(session.line_items[0].price, 'price_fixture');
        assert.match(session.success_url, /^https:\/\/tomtommark2.github.io\/tenioha-game\//);
    }
    assert.equal(f.data.get('users/member').isPremium, undefined);
    f.advance(60000);
    assert.equal((await f.call('createStripeCheckoutSession', 'member')).code, 200);
});

test('コードAPI：失敗も数え、6回目はコード照会なしで429にする', async () => {
    const f = handlersFixture();
    for (let i = 0; i < 5; i++) assert.equal((await f.call('redeemTeniohaPromoCode', 'member', { code: `missing-${i}` })).code, 400);
    const readsBefore = f.reads.filter(path => path.startsWith('promocodes/')).length;
    assert.equal((await f.call('redeemTeniohaPromoCode', 'member', { code: 'other', uid: 'forged' })).code, 429);
    assert.equal(f.reads.filter(path => path.startsWith('promocodes/')).length, readsBefore);
    assert.equal(f.data.has('users/member'), false);
});

test('コードAPI：パスを拒否し、短い不正入力も制限の対象にする', async () => {
    const f = handlersFixture();
    for (const code of ['', '.', '..', 'a/b', 'x'.repeat(129)]) {
        assert.equal((await f.call('redeemTeniohaPromoCode', 'member', { code })).code, 400);
    }
    assert.equal(f.reads.some(path => path.startsWith('promocodes/')), false);
    assert.equal((await f.call('redeemTeniohaPromoCode', 'member', { code: 'sixth' })).code, 429);
});

test('コードAPI：正常付与・期限加算・同じコードの二重使用拒否は維持する', async () => {
    const f = handlersFixture();
    const future = Date.now() + 86400000;
    f.data.set('promocodes/fixture-code', { active: true, durationDays: 30, redemptionCount: 0 });
    f.data.set('users/member', { premiumExpiresAt: { toMillis: () => future } });
    const result = await f.call('redeemTeniohaPromoCode', 'member', { code: 'fixture-code' });
    assert.equal(result.code, 200);
    assert.equal(result.body.newExpiryTime, future + 30 * 86400000);
    assert.equal(f.data.get('users/member').premiumExpiresAt.toMillis(), result.body.newExpiryTime);
    assert.equal(f.data.get('promocodes/fixture-code').redemptionCount, 1);
    assert.equal((await f.call('redeemTeniohaPromoCode', 'member', { code: 'fixture-code' })).code, 400);
    assert.equal(f.data.get('promocodes/fixture-code').redemptionCount, 1);
});

test('機密操作API：制限記録に接続できなければ購入・コード付与を行わない', async () => {
    for (const name of ['createStripeCheckoutSession', 'redeemTeniohaPromoCode']) {
        const f = handlersFixture();
        f.db.runTransaction = async () => { throw new Error('database detail'); };
        const result = await f.call(name, 'member', { code: 'fixture-code' });
        assert.equal(result.code, 500);
        assert.equal(f.calls.checkout.length, 0);
        assert.equal(f.calls.customer, 0);
        assert.equal(f.data.size, 0);
        assert.equal(JSON.stringify(result.body).includes('database detail'), false);
    }
});

test('Webhook：署名不正・未入金・対象外はプレミアムを付与しない', async () => {
    const session = { id: 'cs_fixture', client_reference_id: 'member', payment_status: 'paid',
        metadata: { app: 'tenioha-game', purchaseType: 'tenioha_premium' } };
    for (const [signature, changes, expected] of [
        ['invalid', {}, false], ['fixture-valid', { payment_status: 'unpaid' }, false],
        ['fixture-valid', { metadata: { app: 'other' } }, false], ['fixture-valid', {}, true]
    ]) {
        const f = handlersFixture();
        f.env.TENIOHA_APP_CHECK_MODE = 'enforce';
        f.setBlocklist(null);
        await f.call('stripeWebhook', null, {}, { headers: { 'stripe-signature': signature },
            rawBody: Buffer.from(JSON.stringify({ type: 'checkout.session.completed', data: { object: { ...session, ...changes } } })) });
        assert.equal(f.calls.signatures, 1);
        assert.equal(f.data.get('users/member')?.isPremium === true, expected);
    }
});

test('機密操作API：停止中・管理文書欠落は認証後でも書き込まない', async () => {
    for (const name of ['createStripeCheckoutSession', 'redeemTeniohaPromoCode', 'submitReviewScore', 'updateReviewProfile', 'mergeGuestReviewScore']) {
        for (const [data, status] of [[{ schemaVersion: 1, blockedUids: ['member'], blockedEmails: [] }, 403], [null, 503]]) {
            const f = handlersFixture();
            f.setBlocklist(data);
            const result = await f.call(name, 'member', { code: 'fixture-code' });
            assert.equal(result.code, status, name);
            assert.equal(f.data.size, 0);
            assert.equal(f.calls.checkout.length, 0);
        }
    }
});

test('App Check：HTTPハンドラーは強制時に認証・業務処理前で拒否し、OPTIONSは通す', async () => {
    const f = handlersFixture();
    f.env.TENIOHA_APP_CHECK_MODE = 'enforce';
    for (const name of ['createStripeCheckoutSession', 'redeemTeniohaPromoCode', 'submitReviewScore', 'updateReviewProfile', 'mergeGuestReviewScore', 'getReviewLeaderboard']) {
        assert.equal((await f.call(name, 'member')).code, 403, name);
        const preflight = await f.call(name, null, {}, { method: 'OPTIONS' });
        assert.equal(preflight.code, 204);
        assert.match(preflight.headers['Access-Control-Allow-Headers'], /X-Firebase-AppCheck/);
    }
    assert.equal(f.data.size, 0);
    assert.equal(f.calls.checkout.length, 0);
    assert.equal((await f.call('createStripeCheckoutSession', 'member', {}, { headers: { 'x-firebase-appcheck': 'valid' } })).code, 200);
});
