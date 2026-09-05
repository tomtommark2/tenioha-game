// Public comments use a dedicated API; never publish Auth displayName/email.
(() => {
    const modal = document.getElementById('feedbackModal');
    const list = document.getElementById('feedbackList');
    const message = document.getElementById('feedbackMessage');
    const form = document.getElementById('feedbackForm');
    const submit = document.getElementById('feedbackSubmit');
    let loading = 0;
    let busy = false;
    const drafts = new Map();
    const statusDrafts = new Map();
    const statuses = { received: '受付済み', reviewing: '確認中', planned: '対応予定', done: '対応済み' };
    const statusLabel = status => statuses[status] || statuses.received;
    const dateLabel = time => time ? new Date(time).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const registered = () => !!window.firebaseAuth?.currentUser && !window.firebaseAuth.currentUser.isAnonymous;
    function authUI() {
        document.getElementById('feedbackLogin').hidden = registered();
        form.hidden = !registered();
    }
    async function api(action, data = {}) {
        const user = window.firebaseAuth?.currentUser;
        const headers = { 'Content-Type': 'application/json' };
        if (user && !user.isAnonymous) headers.Authorization = `Bearer ${await user.getIdToken()}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch('https://us-central1-tenioha-game.cloudfunctions.net/feedback', {
                method: 'POST', headers, body: JSON.stringify({ action, ...data }), signal: controller.signal
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'まだ利用できないか、接続に失敗しました。');
            return result;
        } catch (error) {
            if (error instanceof TypeError || error.name === 'AbortError') throw new Error('接続できませんでした。入力を残しています。時間をおいて再度お試しください。');
            throw error;
        } finally { clearTimeout(timer); }
    }
    function node(tag, text, className) {
        const element = document.createElement(tag);
        if (text != null) element.textContent = text;
        if (className) element.className = className;
        return element;
    }
    function button(label, action) {
        const el = node('button', label); el.type = 'button';
        el.addEventListener('click', action); return el;
    }
    async function mutate(action, data, onSuccess) {
        if (busy) return false;
        busy = true; submit.disabled = true;
        list.inert = true;
        try {
            await api(action, data);
            if (onSuccess) onSuccess();
            message.textContent = action === 'report' ? '通報を受け付けました。運営が確認します。' : '反映しました。';
            await refresh(false);
            return true;
        } catch (error) { message.textContent = error.message; return false; }
        finally { busy = false; submit.disabled = false; list.inert = false; }
    }
    function render(items, isAdmin) {
        list.replaceChildren();
        if (!items.length) { list.append(node('p', 'まだ投稿はありません。「ここが使いにくい」など、一言からどうぞ。', 'feedback-empty')); return; }
        for (const post of items) {
            const card = node('article', null, 'feedback-post');
            const header = node('div', null, 'feedback-post-heading');
            header.append(node('strong', post.nickname), node('small', new Date(post.createdAt).toLocaleDateString('ja-JP')));
            const status = Object.hasOwn(statuses, post.status) ? post.status : 'received';
            card.append(header, node('span', statusLabel(status), `feedback-status feedback-status-${status}`), node('p', post.text, 'feedback-text'));
            if (post.hidden) card.append(node('small', '非公開'));
            const thread = Array.isArray(post.thread) ? post.thread : post.reply ? [{ role: 'operator', text: post.reply, createdAt: post.repliedAt }] : [];
            if (thread.length) {
                const conversation = node('ol', null, 'feedback-thread');
                conversation.setAttribute('aria-label', `${post.nickname}さんの投稿のやりとり`);
                for (const entry of thread) {
                    if (entry.role === 'status') {
                        const change = node('li', null, 'feedback-status-event');
                        change.append(node('span', `運営が「${statusLabel(entry.status)}」に変更`), node('small', dateLabel(entry.createdAt)));
                        conversation.append(change);
                        continue;
                    }
                    const operator = entry.role === 'operator';
                    const reply = node('li', null, operator ? 'feedback-reply' : 'feedback-author-reply');
                    const heading = node('div', null, 'feedback-post-heading');
                    heading.append(node('strong', operator ? '運営からの返信' : `${post.nickname}（投稿者）`), node('small', dateLabel(entry.createdAt)));
                    reply.append(heading, node('p', entry.text, 'feedback-text'));
                    conversation.append(reply);
                }
                card.append(conversation);
            }
            const actions = node('div', null, 'feedback-actions');
            if (post.mine || isAdmin) actions.append(button('削除', () => {
                if (confirm('この投稿と、返信・追加コメントをすべて削除しますか？元に戻せません。')) mutate('delete', { id: post.id }, () => drafts.delete(post.id));
            }));
            if (registered() && !post.mine) actions.append(button('通報', () => {
                if (confirm('個人情報・迷惑投稿などとして運営に知らせますか？')) mutate('report', { id: post.id });
            }));
            if (isAdmin) {
                actions.append(node('small', `通報 ${post.reports || 0}件`), button(post.hidden ? '公開に戻す' : '非公開にする', () => mutate('hide', { id: post.id })));
                if (thread.length < 40) {
                    const tools = node('div', null, 'feedback-status-tools');
                    const select = node('select'); select.setAttribute('aria-label', `${post.nickname}さんの投稿の対応状況`);
                    for (const [value, label] of Object.entries(statuses)) { const option = node('option', label); option.value = value; select.append(option); }
                    select.value = statusDrafts.get(post.id) || status;
                    const update = button('対応状況を変更', () => mutate('status', { id: post.id, status: select.value }, () => statusDrafts.delete(post.id)));
                    update.disabled = select.value === status;
                    select.addEventListener('change', () => { statusDrafts.set(post.id, select.value); update.disabled = select.value === status; });
                    tools.append(select, update); card.append(tools);
                }
            }
            if ((isAdmin || post.mine) && (!post.hidden || isAdmin) && thread.length < 40) {
                const editor = node('details', null, 'feedback-thread-editor');
                editor.open = drafts.has(post.id);
                editor.append(node('summary', isAdmin ? '運営として返信する' : '追加でひとこと返す'));
                const replyForm = node('form');
                const field = node('textarea'); field.maxLength = isAdmin ? 1000 : 500; field.required = true;
                field.value = drafts.get(post.id) || '';
                field.placeholder = isAdmin ? '確認したことや、対応した内容など' : '補足や、使ってみた感想など';
                field.setAttribute('aria-label', `${post.nickname}さんの投稿への${isAdmin ? '運営返信' : '追加コメント'}`);
                field.addEventListener('input', () => drafts.set(post.id, field.value));
                const send = node('button', '公開で返信する'); send.type = 'submit';
                replyForm.addEventListener('submit', async event => {
                    event.preventDefault();
                    if (!field.value.trim()) { field.setCustomValidity('ひとこと入力してください。'); field.reportValidity(); return; }
                    await mutate(isAdmin ? 'reply' : 'comment', { id: post.id, text: field.value }, () => drafts.delete(post.id));
                });
                field.addEventListener('input', () => field.setCustomValidity(''));
                replyForm.append(field, node('small', 'この返信も、みんなに公開されます。'), send);
                editor.append(replyForm); card.append(editor);
            } else if (thread.length >= 40 && (post.mine || isAdmin)) {
                card.append(node('small', 'この投稿のやりとりは上限（40件）に達しました。'));
            }
            card.append(actions); list.append(card);
        }
    }
    async function refresh(showStatus = true) {
        const generation = ++loading;
        authUI();
        if (showStatus) message.textContent = '読み込み中…';
        try {
            const result = await api('list');
            if (generation !== loading) return;
            render(result.items || [], result.isAdmin === true);
            if (showStatus) message.textContent = '';
        } catch (error) { if (generation === loading) message.textContent = error.message; }
    }
    window.openFeedback = () => {
        document.getElementById('helpModal').style.display = 'none';
        modal.style.display = 'flex'; refresh();
    };
    document.getElementById('feedbackClose').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('feedbackRefresh').onclick = () => refresh();
    document.getElementById('feedbackLogin').onclick = async () => {
        if (!window.loginWithGoogle) { message.textContent = 'ログイン機能を読み込めませんでした。再読み込みしてください。'; return; }
        await window.loginWithGoogle(); refresh();
    };
    window.addEventListener('feedback-auth-changed', () => {
        drafts.clear();
        statusDrafts.clear();
        authUI(); list.replaceChildren();
        if (modal.style.display === 'flex') refresh();
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const text = document.getElementById('feedbackText');
        const nickname = document.getElementById('feedbackNickname');
        if (!text.value.trim()) { message.textContent = 'ひとこと入力してください。'; text.focus(); return; }
        if (await mutate('create', { text: text.value, nickname: nickname.value.trim() || '学習者' })) text.value = '';
    });
})();
