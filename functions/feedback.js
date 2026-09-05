const { onRequest } = require('firebase-functions/v2/https');
const crypto = require('node:crypto');
const FEEDBACK_STATUSES = new Set(['received', 'reviewing', 'planned', 'done']);
const MAX_THREAD_ENTRIES = 40;

// Preserve the initial single-reply format without inventing a reply date.
function feedbackThread(post) {
    if (Array.isArray(post.thread)) return post.thread;
    return post.reply ? [{ id: 'legacy-reply', role: 'operator', text: post.reply, createdAt: post.repliedAt || null }] : [];
}

function publicThread(post) {
    return feedbackThread(post).map(entry => ({
        id: entry.id, role: entry.role, text: entry.text || '', createdAt: entry.createdAt || null,
        ...(entry.role === 'status' ? { status: entry.status } : {})
    }));
}

function validateText(value, max, fallback = '') {
    if (value == null) value = fallback;
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
        throw Object.assign(new Error(`1〜${max}文字で入力してください。`), { status: 400 });
    }
    return value.trim();
}

function createFeedbackHandler({ db, verifyUser, rejectNonPost }) {
    return async (req, res) => {
        if (rejectNonPost(req, res)) return;
        res.set('Cache-Control', 'no-store');
        try {
            const body = req.body || {};
            const action = body.action;
            let user = null;
            if (req.headers.authorization) {
                try { user = await verifyUser(req); }
                catch { throw Object.assign(new Error('ログインをやり直してください。'), { status: 401 }); }
            }
            const isAdmin = user?.feedbackAdmin === true;
            const posts = db.collection('feedback_posts');
            if (action === 'list') {
                const snapshot = await posts.orderBy('createdAt', 'desc').limit(100).get();
                const items = snapshot.docs.filter(doc => !doc.data().hidden || isAdmin).slice(0, 50).map(doc => {
                    const p = doc.data();
                    return { id: doc.id, text: p.text, nickname: p.nickname, createdAt: p.createdAt,
                        reply: p.reply || '', repliedAt: p.repliedAt || null, hidden: !!p.hidden,
                        status: FEEDBACK_STATUSES.has(p.status) ? p.status : 'received', thread: publicThread(p),
                        mine: !!user && p.authorUid === user.uid, reports: isAdmin ? (p.reports || 0) : undefined };
                });
                return res.json({ items, isAdmin });
            }
            if (!user || user.firebase?.sign_in_provider === 'anonymous') {
                throw Object.assign(new Error('投稿にはGoogleログインが必要です。'), { status: 401 });
            }
            if (!['create', 'delete', 'report', 'reply', 'comment', 'status', 'hide'].includes(action)) {
                throw Object.assign(new Error('操作が不正です。'), { status: 400 });
            }
            if (['reply', 'status', 'hide'].includes(action) && !isAdmin) {
                throw Object.assign(new Error('運営権限が必要です。'), { status: 403 });
            }
            const id = body.id;
            if (action !== 'create' && (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) {
                throw Object.assign(new Error('投稿が不正です。'), { status: 400 });
            }
            if (action === 'status' && !FEEDBACK_STATUSES.has(body.status)) {
                throw Object.assign(new Error('対応状況が不正です。'), { status: 400 });
            }
            const text = ['create', 'reply', 'comment'].includes(action) ? validateText(body.text, action === 'reply' ? 1000 : 500) : '';
            const nickname = action === 'create' ? validateText(body.nickname || '学習者', 16) : '';
            const ref = action === 'create' ? posts.doc() : posts.doc(id);
            const gate = db.collection('feedback_limits').doc(user.uid);
            const now = Date.now();
            const entryId = crypto.randomUUID();
            const isUserMessage = ['create', 'comment'].includes(action);
            await db.runTransaction(async tx => {
                const gateSnap = await tx.get(gate);
                const limits = gateSnap.data() || {};
                if (limits.blocked) throw Object.assign(new Error('現在投稿できません。'), { status: 403 });
                const delay = action === 'create' ? 60000 : action === 'comment' ? 30000 : 3000;
                if (now - (limits.lastAt || 0) < delay) throw Object.assign(new Error('少し時間をおいてからお試しください。'), { status: 429 });
                const day = new Date(now).toISOString().slice(0, 10);
                const count = limits.day === day ? (limits.count || 0) : 0;
                if (isUserMessage && count >= 10) throw Object.assign(new Error('本日の投稿上限（追加コメントを含め10件）に達しました。'), { status: 429 });
                if (action === 'create') {
                    tx.create(ref, { text, nickname, authorUid: user.uid, createdAt: now, hidden: false, reply: '', status: 'received', thread: [] });
                } else {
                    const snap = await tx.get(ref);
                    if (!snap.exists) throw Object.assign(new Error('投稿が見つかりません。'), { status: 404 });
                    const post = snap.data();
                    if (action === 'delete') {
                        if (post.authorUid !== user.uid && !isAdmin) throw Object.assign(new Error('削除できません。'), { status: 403 });
                        tx.delete(ref);
                    } else if (action === 'report') {
                        if (post.hidden) throw Object.assign(new Error('投稿が見つかりません。'), { status: 404 });
                        const key = crypto.createHash('sha256').update(`${id}:${user.uid}`).digest('hex');
                        const report = db.collection('feedback_reports').doc(key);
                        if (!(await tx.get(report)).exists) {
                            tx.create(report, { postId: id, reporterUid: user.uid, createdAt: now });
                            tx.update(ref, { reports: (post.reports || 0) + 1 });
                        }
                    } else if (['reply', 'comment', 'status'].includes(action)) {
                        if (action === 'comment' && (post.authorUid !== user.uid || post.hidden)) {
                            throw Object.assign(new Error('この投稿に追加コメントはできません。'), { status: 403 });
                        }
                        const thread = feedbackThread(post);
                        if (thread.length >= MAX_THREAD_ENTRIES) throw Object.assign(new Error('この投稿のやりとりは上限（40件）に達しました。'), { status: 409 });
                        const entry = { id: entryId, role: action === 'reply' ? 'operator' : action === 'comment' ? 'author' : 'status', createdAt: now };
                        if (action === 'status') {
                            if (body.status === (post.status || 'received')) throw Object.assign(new Error('対応状況は変更されていません。'), { status: 409 });
                            entry.status = body.status;
                        } else entry.text = text;
                        const update = { thread: [...thread, entry] };
                        // Keep latest reply for compatibility with an older frontend.
                        if (action === 'reply') Object.assign(update, { reply: text, repliedAt: now });
                        if (action === 'status') update.status = body.status;
                        tx.update(ref, update);
                    } else tx.update(ref, { hidden: !post.hidden });
                }
                tx.set(gate, { ...limits, lastAt: now, day, count: count + (isUserMessage ? 1 : 0) });
            });
            res.json({ ok: true });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.status ? error.message : '現在利用できません。時間をおいてお試しください。' });
        }
    };
}

module.exports = { validateText, createFeedbackHandler, buildFeedbackFunction: deps => onRequest({ region: 'us-central1', maxInstances: 3 }, createFeedbackHandler(deps)) };
