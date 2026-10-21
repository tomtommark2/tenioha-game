const test = require('node:test');
const assert = require('node:assert/strict');
const { createAccountGuard, validBlocklist } = require('./account-security');
const { createAppCheckGuard, EXPECTED_APP_ID } = require('./app-check-security');
const { legacyBlocklist, unpack } = require('../scripts/security-config.cjs');
const policy = () => ({ schemaVersion: 1, blockedUids: ['blocked-fixture'], blockedEmails: ['blocked@invalid.example'] });
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; } });

test('非公開停止情報：UIDとメールを同じ管理文書で判定し、値をエラーへ出さない', async () => {
    const data = policy();
    const guard = createAccountGuard({ db: { doc: path => {
        assert.equal(path, 'security_private/blocklist');
        return { get: async () => ({ exists: true, data: () => data }) };
    } } });
    for (const user of [{ uid: 'blocked-fixture' }, { uid: 'different', email: 'blocked@invalid.example' }]) {
        await assert.rejects(guard(user), error => error.status === 403 && !error.message.includes(user.uid) && !error.message.includes('@'));
    }
    assert.equal((await guard({ uid: 'allowed' })).uid, 'allowed');
    assert.equal((await guard({ uid: 'guest', firebase: { sign_in_provider: 'anonymous' } })).uid, 'guest');
});

test('非公開停止情報：文書欠落・不正形式・通信失敗は503で停止する', async () => {
    for (const data of [null, {}, { ...policy(), schemaVersion: 2 }, { ...policy(), blockedEmails: {} }, { ...policy(), blockedUids: [42] }]) {
        const guard = createAccountGuard({ db: { doc: () => ({ get: async () => ({ exists: !!data, data: () => data }) }) } });
        await assert.rejects(guard({ uid: 'allowed' }), error => error.status === 503 && !error.message.includes('Blocklist'));
    }
    const guard = createAccountGuard({ db: { doc: () => ({ get: async () => { throw new Error('private detail'); } }) } });
    await assert.rejects(guard({ uid: 'allowed' }), error => error.status === 503 && !error.message.includes('private'));
});

test('非公開停止情報：同時読込をまとめ、30秒後に更新し、古い情報で障害を迂回しない', async () => {
    let now = 1000, reads = 0, failing = false, value = policy();
    const guard = createAccountGuard({ now: () => now, db: { doc: () => ({ get: async () => {
        reads++;
        if (failing) throw new Error('offline');
        return { exists: true, data: () => value };
    } }) } });
    await Promise.all([guard({ uid: 'A' }), guard({ uid: 'B' })]);
    assert.equal(reads, 1);
    now = 31000; value = { ...policy(), blockedUids: ['A'] };
    await assert.rejects(guard({ uid: 'A' }), error => error.status === 403);
    assert.equal(reads, 2);
    now = 61000; failing = true;
    await assert.rejects(guard({ uid: 'B' }), error => error.status === 503);
});

test('非公開停止情報：時間切れを終え、遅い取得結果をキャッシュに採用しない', async () => {
    let reply, reads = 0;
    const guard = createAccountGuard({ timeoutMs: 10, db: { doc: () => ({ get: () => ++reads === 1
        ? new Promise(resolve => { reply = resolve; }) : Promise.resolve({ exists: true, data: policy }) }) } });
    await assert.rejects(guard({ uid: 'A' }), error => error.status === 503);
    await guard({ uid: 'A' });
    reply({ exists: true, data: () => ({ ...policy(), blockedUids: ['A'] }) });
    await new Promise(resolve => setImmediate(resolve));
    await guard({ uid: 'A' });
    assert.equal(reads, 2);
});

test('App Check：監視段階は旧版・不正トークンも遮断せず、秘密をログに出さない', async () => {
    const reports = [], calls = [];
    const guard = createAppCheckGuard({ verifyToken: async token => { calls.push(token); throw new Error('private verification detail'); }, report: row => reports.push(row) });
    for (const token of [undefined, 'private-token', 'private-token']) {
        assert.equal(await guard({ headers: token ? { 'x-firebase-appcheck': token } : {} }, response()), true);
    }
    assert.equal(calls.length, 2);
    assert.equal(reports.length, 2);
    assert.equal(JSON.stringify(reports).includes('private'), false);
});

test('App Check：強制段階は対象アプリの正しいトークンだけを通す', async () => {
    const guard = createAppCheckGuard({ mode: () => 'enforce', verifyToken: async token => ({ appId: token === 'valid' ? EXPECTED_APP_ID : 'other-app' }) });
    assert.equal(await guard({ headers: { 'x-firebase-appcheck': 'valid' } }, response()), true);
    for (const token of [undefined, 'other', [], 'x'.repeat(8193)]) {
        const res = response();
        assert.equal(await guard({ headers: { 'x-firebase-appcheck': token } }, res), false);
        assert.equal(res.code, 403);
        assert.equal(res.body.retryable, true);
        assert.equal(res.body.code, 'app-check/invalid');
    }
});

test('App Check：停止・設定ミス・検証停止を区別し、無期限に待たない', async () => {
    let calls = 0;
    const verifyToken = () => { calls++; return new Promise(() => {}); };
    assert.equal(await createAppCheckGuard({ mode: () => 'off', verifyToken })({ headers: {} }, response()), true);
    const res = response();
    assert.equal(await createAppCheckGuard({ mode: () => 'typo', verifyToken })({ headers: {} }, res), false);
    assert.equal(res.code, 503);
    assert.equal(calls, 0);
    assert.equal(await createAppCheckGuard({ timeoutMs: 10, verifyToken })({ headers: { 'x-firebase-appcheck': 'test' } }, response()), true);
    assert.equal(await createAppCheckGuard({ timeoutMs: 10, mode: () => 'enforce', verifyToken })({ headers: { 'x-firebase-appcheck': 'test' } }, response()), false);
});

test('移行検査：旧停止情報は実行せず読取り、形式不明を空の許可リストにしない', () => {
    const source = "function isBanned() {return request.auth.uid in ['fixture-A'] || request.auth.token.email in ['a@invalid.example'];}";
    assert.deepEqual(legacyBlocklist(source), { schemaVersion: 1, blockedUids: ['fixture-A'], blockedEmails: ['a@invalid.example'] });
    assert.throws(() => legacyBlocklist(source.replace("'fixture-A'", 'arbitrary()')));
    assert.throws(() => legacyBlocklist('unexpected rules'));
    assert.equal(legacyBlocklist('get(/security_private/blocklist)'), null);
    assert.equal(validBlocklist(unpack({ fields: { schemaVersion: { integerValue: '1' }, blockedUids: { arrayValue: {} }, blockedEmails: { arrayValue: {} } } })), true);
});
