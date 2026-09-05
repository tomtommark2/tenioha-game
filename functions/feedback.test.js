const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFeedbackHandler, validateText } = require('./feedback');

function fixture(user = null) {
    const data = new Map();
    let next = 0;
    const ref = path => ({ path });
    const snapshot = path => ({ exists: data.has(path), data: () => data.get(path) });
    const db = {
        collection: name => ({
            doc: id => ref(`${name}/${id || `p${++next}`}`),
            orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [...data].filter(([k]) => k.startsWith(`${name}/`)).map(([k, v]) => ({ id: k.split('/')[1], data: () => v })) }) }) })
        }),
        runTransaction: async fn => {
            const writes = [];
            await fn({ get: async r => snapshot(r.path),
                create: (r, v) => writes.push(() => data.set(r.path, v)),
                set: (r, v) => writes.push(() => data.set(r.path, v)),
                update: (r, v) => writes.push(() => data.set(r.path, { ...data.get(r.path), ...v })),
                delete: r => writes.push(() => data.delete(r.path)) });
            writes.forEach(fn => fn());
        }
    };
    const handler = createFeedbackHandler({ db, verifyUser: async () => user, rejectNonPost: () => false });
    async function call(body) {
        const response = { code: 200, set() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; } };
        await handler({ headers: user ? { authorization: 'Bearer test' } : {}, body }, response);
        return response;
    }
    return { data, call, setUser: value => { user = value; } };
}
const member = { uid: 'member', firebase: { sign_in_provider: 'google.com' } };
test('停止中アカウントと1日上限をサーバーで拒否', async () => {
    const f = fixture(member);
    f.data.set('feedback_limits/member', { blocked: true });
    assert.equal((await f.call({ action: 'create', text: 'test' })).code, 403);
    f.data.set('feedback_limits/member', { count: 10, day: new Date().toISOString().slice(0, 10) });
    assert.equal((await f.call({ action: 'create', text: 'test' })).code, 429);
});
test('入力は文字数・型・空白を検証', () => {
    assert.equal(validateText(' hello ', 10), 'hello');
    for (const value of ['', '  ', {}, 'a'.repeat(501)]) assert.throws(() => validateText(value, 500));
});
test('匿名・未ログインは投稿不可、閲覧では非公開投稿とUIDを返さない', async () => {
    for (const user of [null, { uid: 'guest', firebase: { sign_in_provider: 'anonymous' } }]) {
        const f = fixture(user);
        assert.equal((await f.call({ action: 'create', text: 'test' })).code, 401);
        f.data.set('feedback_posts/a', { authorUid: 'private', text: 'test', nickname: '学習者', createdAt: 1, hidden: false });
        f.data.set('feedback_posts/b', { text: 'hidden', hidden: true });
        const result = (await f.call({ action: 'list' })).body;
        assert.equal(result.items.length, 1);
        assert.equal(JSON.stringify(result).includes('private'), false);
    }
});
test('本文のみで投稿でき、連投・なりすまし返信・他人の削除を拒否', async () => {
    const f = fixture(member);
    assert.equal((await f.call({ action: 'create', text: '欲しい機能', authorUid: 'forged', reply: 'forged' })).code, 200);
    const saved = f.data.get('feedback_posts/p1');
    assert.equal(saved.nickname, '学習者'); assert.equal(saved.authorUid, 'member'); assert.equal(saved.reply, '');
    assert.equal((await f.call({ action: 'create', text: 'again' })).code, 429);
    assert.equal((await f.call({ action: 'reply', id: 'p1', text: 'fake' })).code, 403);
    f.data.delete('feedback_limits/member');
    f.data.set('feedback_posts/other', { authorUid: 'other' });
    assert.equal((await f.call({ action: 'delete', id: 'other' })).code, 403);
    assert.equal((await f.call({ action: 'delete', id: 'p1' })).code, 200);
});
test('運営返信・非公開化、通報の重複防止', async () => {
    const f = fixture({ ...member, feedbackAdmin: true });
    f.data.set('feedback_posts/a', { authorUid: 'other', text: 'test', hidden: false });
    assert.equal((await f.call({ action: 'reply', id: 'a', text: '確認します' })).code, 200);
    assert.equal(f.data.get('feedback_posts/a').reply, '確認します');
    f.data.delete('feedback_limits/member');
    await f.call({ action: 'report', id: 'a' });
    f.data.delete('feedback_limits/member');
    await f.call({ action: 'report', id: 'a' });
    assert.equal(f.data.get('feedback_posts/a').reports, 1);
    f.data.delete('feedback_limits/member');
    await f.call({ action: 'hide', id: 'a' });
    assert.equal(f.data.get('feedback_posts/a').hidden, true);
});

test('NOTE型の往復を追記し、旧返信・役割・対応状況を保持する', async () => {
    const f = fixture({ ...member, feedbackAdmin: true });
    f.data.set('feedback_posts/a', { authorUid: 'owner', nickname: '利用者', text: '要望', reply: '最初の返信', repliedAt: 1 });
    await f.call({ action: 'reply', id: 'a', text: '実装しました', role: 'author' });
    f.data.delete('feedback_limits/member');
    await f.call({ action: 'status', id: 'a', status: 'done' });
    f.setUser({ ...member, uid: 'owner' });
    assert.equal((await f.call({ action: 'comment', id: 'a', text: 'ありがとう', role: 'operator', status: 'planned' })).code, 200);
    const post = f.data.get('feedback_posts/a');
    assert.deepEqual(post.thread.map(e => e.role), ['operator', 'operator', 'status', 'author']);
    assert.deepEqual(post.thread.filter(e => e.text).map(e => e.text), ['最初の返信', '実装しました', 'ありがとう']);
    assert.equal(post.status, 'done');
    assert.equal(post.reply, '実装しました');
    const publicData = (await f.call({ action: 'list' })).body;
    assert.equal(JSON.stringify(publicData).includes('authorUid'), false);
    assert.equal(publicData.items[0].thread.length, 4);
});

test('第三者・匿名の追加コメント、非公開への追記、状態偽装を拒否', async () => {
    const f = fixture(member);
    f.data.set('feedback_posts/a', { authorUid: 'owner', hidden: false });
    assert.equal((await f.call({ action: 'comment', id: 'a', text: '乗っ取り' })).code, 403);
    assert.equal((await f.call({ action: 'status', id: 'a', status: 'done' })).code, 403);
    f.setUser({ ...member, uid: 'owner' });
    f.data.set('feedback_posts/a', { authorUid: 'owner', hidden: true });
    assert.equal((await f.call({ action: 'comment', id: 'a', text: 'hidden' })).code, 403);
    f.setUser(null);
    assert.equal((await f.call({ action: 'comment', id: 'a', text: '匿名' })).code, 401);
    f.setUser({ ...member, feedbackAdmin: true });
    assert.equal((await f.call({ action: 'status', id: 'a', status: '<script>' })).code, 400);
});

test('履歴上限・連投制限・日次上限で履歴を上書きしない', async () => {
    const f = fixture(member);
    f.data.set('feedback_posts/a', { authorUid: 'member', thread: Array.from({ length: 40 }, (_, i) => ({ id: String(i), role: 'author', text: '既存', createdAt: 1 })) });
    assert.equal((await f.call({ action: 'comment', id: 'a', text: '超過' })).code, 409);
    assert.equal(f.data.get('feedback_posts/a').thread.length, 40);
    f.data.set('feedback_posts/a', { authorUid: 'member', thread: [] });
    assert.equal((await f.call({ action: 'comment', id: 'a', text: '補足' })).code, 200);
    assert.equal((await f.call({ action: 'comment', id: 'a', text: '連投' })).code, 429);
    f.data.set('feedback_limits/member', { day: new Date().toISOString().slice(0, 10), count: 10 });
    assert.equal((await f.call({ action: 'comment', id: 'a', text: '上限' })).code, 429);
    assert.equal(f.data.get('feedback_posts/a').thread.length, 1);
});
