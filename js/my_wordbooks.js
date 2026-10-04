/* Named collections reference existing learning keys, never copy learning history. */
(function () {
    const LEVELS = ['junior', 'basic', 'daily', 'exam1'];
    const LABELS = { junior: '中学', basic: '基礎', daily: '標準', exam1: '受験', 'my-custom': '自分で登録' };
    const POS_LABELS = { 名: '名詞', 動: '動詞', 形: '形容詞', 副: '副詞', 助: '助動詞', 前: '前置詞', 接: '接続詞', 代: '代名詞', other: 'その他' };
    const EMPTY_CUSTOM_WORDS = [];
    const STATES = { unlearned: '未学習', weak: '苦手', learned: '得意', perfect: '完璧' };
    const PAGE_SIZE = 60;
    let catalogDatabase = null, catalogCustomWords = null, catalog = null;
    let editingId = null, tab = 'members', pageIndex = 0;
    let customEditingId = null, noteEditingKey = null;
    let importResult = null, selection = new Set();
    const element = id => document.getElementById(id);
    const escape = value => window.GameUtils.escapeHtml(String(value));
    const normalizeText = value => String(value || '').normalize('NFKC').trim()
        .replace(/[’‘]/g, "'").replace(/\s+/g, ' ').toLowerCase();
    const newId = prefix => prefix + (globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2));
    const customKey = id => `word-v2:my-custom:${id}:custom`;
    const isCustomKey = key => String(key || '').startsWith('word-v2:my-custom:');
    const posLabel = word => [...new Set((word.senses || [word]).map(sense => POS_LABELS[sense.pos] || 'その他'))].join(' / ');
    const meaningLabel = word => (word.senses || [word]).map(sense => {
        const meaning = String(sense.meaning || '');
        return `${POS_LABELS[sense.pos] || 'その他'}：${word.__customWord ? meaning : meaning.replace(/^【[名動形副助接前代冠数間限定]】\s*/, '')}`;
    }).join('\n');

    function normalizeCustomWords(value) {
        if (!Array.isArray(value)) return [];
        const ids = new Set();
        return value.flatMap(word => {
            if (!word || typeof word.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(word.id)
                || ids.has(word.id) || typeof word.word !== 'string' || !word.word.trim()
                || word.word.trim().length > 120 || typeof word.meaning !== 'string' || !word.meaning.trim()
                || word.meaning.trim().length > 500 || !Object.hasOwn(POS_LABELS, word.pos)) return [];
            ids.add(word.id);
            return [{ id: word.id, word: word.word.trim().replace(/\s+/g, ' '), pos: word.pos, meaning: word.meaning.trim() }];
        });
    }

    function normalizeNotes(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return Object.fromEntries(Object.entries(value).flatMap(([key, note]) => {
            if (!key.startsWith('word-v2:') || key.length > 500 || !note || typeof note !== 'object'
                || Array.isArray(note)) return [];
            const meaning = typeof note.meaning === 'string' ? note.meaning.trim().slice(0, 500) : '';
            const memo = typeof note.memo === 'string' ? note.memo.trim().slice(0, 500) : '';
            return meaning || memo ? [[key, { meaning, memo }]] : [];
        }));
    }

    function normalizeBooks(value) {
        if (!Array.isArray(value)) return [];
        const ids = new Set();
        return value.flatMap(book => {
            if (!book || typeof book.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(book.id)
                || ids.has(book.id) || typeof book.name !== 'string' || !book.name.trim()) return [];
            ids.add(book.id);
            return [{ id: book.id, name: book.name.trim().slice(0, 60), wordKeys: [...new Set(
                (Array.isArray(book.wordKeys) ? book.wordKeys : []).filter(key =>
                    typeof key === 'string' && key.startsWith('word-v2:') && key.length <= 500)
            )], wordNotes: normalizeNotes(book.wordNotes) }];
        });
    }

    function getCatalog(database = window.vocabularyDatabase) {
        const customWords = window.gameState?.myCustomWords || EMPTY_CUSTOM_WORDS;
        if (catalog && catalogDatabase === database && catalogCustomWords === customWords) return catalog;
        const byKey = new Map(), byText = new Map();
        const add = (word, level) => {
            const key = window.GameUtils.getWordKey(word, level, database);
            if (byKey.has(key)) return;
            const item = { key, level, word: { ...word, __sourceLevel: level, __groupKey: key } };
            byKey.set(key, item);
            const text = normalizeText(word.word);
            const matches = byText.get(text) || [];
            matches.push(item);
            byText.set(text, matches);
        };
        LEVELS.forEach(level => (database[level] || []).forEach(word => add(word, level)));
        customWords.forEach(word => add({ word: word.word, meaning: word.meaning, pos: word.pos,
            __groupKey: customKey(word.id), __customWord: true, set: 1 }, 'my-custom'));
        catalogDatabase = database;
        catalogCustomWords = customWords;
        catalog = { byKey, byText };
        return catalog;
    }

    function matchInput(text, database = window.vocabularyDatabase) {
        const lookup = getCatalog(database);
        const inputs = [...new Set(String(text || '').split(/[\n\r,，、;；\t]+/)
            .map(normalizeText).filter(Boolean))];
        const keys = new Set(), missing = [], ambiguousKeys = [];
        inputs.forEach(input => {
            const matches = lookup.byText.get(input);
            if (!matches) missing.push(input);
            else {
                matches.forEach(item => keys.add(item.key));
                if (matches.length > 1) ambiguousKeys.push(...matches.map(item => item.key));
            }
        });
        return { keys: [...keys], missing, ambiguousKeys, inputCount: inputs.length };
    }

    function getSuggestions(query, database = window.vocabularyDatabase) {
        const prefix = normalizeText(query);
        const rank = item => item.level === 'my-custom' ? LEVELS.length : LEVELS.indexOf(item.level);
        return prefix ? [...getCatalog(database).byKey.values()]
            .filter(item => normalizeText(item.word.word).startsWith(prefix))
            .sort((a, b) => Number(normalizeText(b.word.word) === prefix) - Number(normalizeText(a.word.word) === prefix)
                || rank(a) - rank(b) || a.word.word.localeCompare(b.word.word, 'en') || posLabel(a.word).localeCompare(posLabel(b.word))) : [];
    }

    function getBook(id = window.gameState.activeMyWordbookId) {
        return (window.gameState.myWordbooks || []).find(book => book.id === id) || null;
    }

    function getNote(key, book = getBook()) {
        return book?.wordKeys.includes(key) ? book.wordNotes?.[key] || null : null;
    }

    function resolveWord(word) {
        return word?.__customWord ? getCatalog().byKey.get(word.__groupKey)?.word || word : word;
    }

    function studyNoteMarkup(word) {
        if (window.gameState.currentLevel !== 'my' || !window.WordIllustrations.canUseLevel('my')) return '';
        const key = window.GameUtils.getWordKey(word, 'my', window.vocabularyDatabase);
        const note = getNote(key);
        return note ? `<div class="my-study-note">${note.meaning ? `<section><strong>自分の訳</strong><div>${escape(note.meaning)}</div></section>` : ''}${note.memo ? `<section><strong>覚え方・メモ</strong><div>${escape(note.memo)}</div></section>` : ''}</div>` : '';
    }

    function refreshCurrentMeaning() {
        if (window.gameState.currentLevel !== 'my' || !window.gameState.currentWord) return;
        const word = resolveWord(window.gameState.currentWord);
        window.gameState.currentWord = word;
        element('meaningText').innerHTML = window.renderMeaningMarkup(word);
    }

    function refreshCollection() {
        const book = getBook();
        const lookup = getCatalog();
        window.vocabularyDatabase.my = (window.WordIllustrations.canUseLevel('my') ? book?.wordKeys || [] : []).flatMap(key => {
            const item = lookup.byKey.get(key);
            return item && window.WordIllustrations.canUseWord(item.word, item.level, window.vocabularyDatabase)
                ? [item.word] : [];
        });
    }

    function restore() {
        const state = window.gameState;
        state.myWordbooks = normalizeBooks(state.myWordbooks);
        state.myCustomWords = normalizeCustomWords(state.myCustomWords);
        if (!getBook()) state.activeMyWordbookId = null;
        refreshCollection();
        if (state.currentLevel === 'my' && !getBook()) state.currentLevel = 'basic';
        if (state.currentMode === 'all' && state.currentLevel !== 'my') state.currentMode = 'unlearned';
    }

    function status(message, error = false) {
        element('myWordbookStatus').textContent = message;
        element('myWordbookStatus').classList.toggle('is-error', error);
    }

    function requireAccess() {
        const allowed = window.WordIllustrations.requireLevel('my');
        if (!allowed) element('myWordbookModal').style.display = 'none';
        return allowed;
    }

    function refreshStudyUI() {
        const state = window.gameState;
        const book = getBook();
        const bar = element('myWordbookStudyBar');
        if (!bar) return;
        bar.hidden = state.currentLevel !== 'my' || !book;
        element('myWordbookStudyName').textContent = book?.name || '';
        element('myWordbookAllBtn').classList.toggle('active', state.currentMode === 'all');
        element('myWordbookAllBtn').setAttribute('aria-pressed', String(state.currentMode === 'all'));
        const available = window.WordIllustrations.canUseLevel('my');
        element('myWordbookPremiumBadge').textContent = available ? '利用可能' : 'プレミアム';
        if (!available && element('myWordbookModal').style.display !== 'none') element('myWordbookModal').style.display = 'none';
    }

    // Save first; failed local writes must not leave an apparently saved collection.
    function commit(books, activeId = window.gameState.activeMyWordbookId, customWords = window.gameState.myCustomWords) {
        if (!requireAccess()) return false;
        const state = window.gameState;
        const beforeBooks = state.myWordbooks, beforeId = state.activeMyWordbookId;
        const beforeCustomWords = state.myCustomWords;
        const beforeKeys = getBook()?.wordKeys.join('\n') || '';
        state.myWordbooks = normalizeBooks(books);
        state.activeMyWordbookId = activeId;
        state.myCustomWords = normalizeCustomWords(customWords);
        if (!window.saveGame()) {
            state.myWordbooks = beforeBooks;
            state.activeMyWordbookId = beforeId;
            state.myCustomWords = beforeCustomWords;
            status('保存できませんでした。内容は変更していません。', true);
            return false;
        }
        refreshCollection();
        const definitionsChanged = JSON.stringify(beforeCustomWords || []) !== JSON.stringify(state.myCustomWords);
        if (definitionsChanged) {
            window.invalidateReviewWordIndex();
            if (state.currentLevel === 'my' && beforeKeys === (getBook()?.wordKeys.join('\n') || '')) window.loadVocabularyForLevel();
        }
        if (state.currentLevel === 'my' && beforeKeys !== (getBook()?.wordKeys.join('\n') || '')) {
            gameStateHistory = [];
            updateUndoButton();
            state.decks = null;
            resetReviewQueueShuffleOrder();
            invalidateReviewWordIndex();
            loadVocabularyForLevel();
            initializeWordStates();
            if (state.currentWord && !window.vocabularyDatabase.my.some(word =>
                window.getWordKey(word, 'my') === window.getWordKey(state.currentWord, 'my'))) {
                state.currentWord = null;
                showNextWord();
            }
            updateDisplay();
        }
        // Definition/note edits are not answers. Preserve SRS, question and Undo.
        refreshCurrentMeaning();
        if (state.currentLevel === 'my') window.renderWordList();
        refreshStudyUI();
        updateLevelCurrentButton();
        return true;
    }

    function open(id = null) {
        if (!requireAccess()) return;
        editingId = getBook(id) ? id : null;
        tab = 'members';
        pageIndex = 0;
        importResult = null;
        selection.clear();
        element('myWordbookInput').value = '';
        element('myWordbookSearch').value = '';
        element('myWordbookSuggest').value = '';
        cancelWordEdit(false);
        window.closeLevelSelector();
        window.closeWordbookModal();
        element('myWordbookModal').style.display = 'flex';
        status('');
        render();
    }

    function openEditor(id) {
        if (!requireAccess()) return;
        editingId = id;
        tab = 'members';
        pageIndex = 0;
        importResult = null;
        selection.clear();
        element('myWordbookInput').value = '';
        element('myWordbookSearch').value = '';
        element('myWordbookSuggest').value = '';
        cancelWordEdit(false);
        status('');
        render();
        element('myWordbookEditorHeading').focus({ preventScroll: true });
    }

    function create(event) {
        event.preventDefault();
        const name = element('myWordbookNewName').value.trim();
        if (!name) { status('単語帳の名前を入力してください。', true); return; }
        const id = newId('book-');
        if (!commit([...(window.gameState.myWordbooks || []), { id, name, wordKeys: [] }])) return;
        element('myWordbookNewName').value = '';
        openEditor(id);
        changeTab('input');
        status('単語帳を作成しました。勉強したい語を追加しましょう。');
    }

    function rename(event) {
        event.preventDefault();
        const name = element('myWordbookName').value.trim();
        if (!name) { status('名前を入力してください。', true); return; }
        if (!commit(window.gameState.myWordbooks.map(book => book.id === editingId ? { ...book, name } : book))) return;
        render();
        status('名前を保存しました。');
    }

    function removeBook() {
        const book = getBook(editingId);
        if (!book || !confirm(`「${book.name}」を削除しますか？\nこの単語帳の自分用メモは削除します。\n単語の学習履歴・復習予定は消えません。`)) return;
        const active = book.id === window.gameState.activeMyWordbookId;
        if (!commit(window.gameState.myWordbooks.filter(item => item.id !== book.id), active ? null : window.gameState.activeMyWordbookId)) return;
        if (active && window.gameState.currentLevel === 'my') window.switchLevel('basic');
        editingId = null;
        render();
        status('単語帳を削除しました。学習履歴はそのままです。');
        element('myWordbookNewName').focus({ preventScroll: true });
    }

    function changeTab(value) {
        tab = value;
        pageIndex = 0;
        selection.clear();
        cancelWordEdit(false);
        status('');
        render();
    }

    function previewInput() {
        importResult = matchInput(element('myWordbookInput').value);
        const members = new Set(getBook(editingId).wordKeys);
        selection = new Set(importResult.keys.filter(key => !members.has(key) && !importResult.ambiguousKeys.includes(key)));
        pageIndex = 0;
        renderRows();
        const message = !importResult.inputCount ? '英単語を入力してください。'
            : !importResult.keys.length ? '一致する語がありません。綴りや区切りをご確認ください。'
            : importResult.ambiguousKeys.length ? '同じ綴りの別カードがあります。品詞と意味を確認して選んでください。'
            : !selection.size ? '一致した語はすべて追加済みです。'
            : '追加する語を確認し、「選択した語を追加」を押してください。';
        status(message, !importResult.keys.length);
    }

    function getRows() {
        const book = getBook(editingId);
        if (!book) return [];
        const lookup = getCatalog();
        const members = new Set(book.wordKeys);
        if (tab === 'input') return (importResult?.keys || []).map(key => lookup.byKey.get(key)).filter(Boolean);
        const query = normalizeText(element('myWordbookSearch').value);
        const filter = element('myWordbookSource').value;
        const dueKeys = tab === 'history' && filter === 'due'
            ? new Set(window.buildReviewQueueSnapshot().dueWords.map(word => window.getWordKeySafe(word, word.__sourceLevel))) : null;
        const rows = tab === 'members' ? book.wordKeys.map(key => lookup.byKey.get(key)).filter(Boolean) : [...lookup.byKey.values()].filter(item => {
            if (members.has(item.key)) return false;
            const state = window.gameState.wordStates[item.key] || 'unlearned';
            if (filter === 'due') return dueKeys.has(item.key);
            return state === filter;
        });
        return rows.filter(item => !query || normalizeText(item.word.word).startsWith(query)
            || (!/[a-z]/i.test(query) && [meaningLabel(item.word), getNote(item.key, book)?.meaning,
                getNote(item.key, book)?.memo].join('\n').includes(query))).sort((a, b) => a.word.word.localeCompare(b.word.word, 'en'));
    }

    function renderSuggestions() {
        const rows = getSuggestions(element('myWordbookSuggest').value);
        const book = getBook(editingId);
        const host = element('myWordbookSuggestions');
        host.replaceChildren();
        element('myWordbookSuggestSummary').textContent = !normalizeText(element('myWordbookSuggest').value) ? ''
            : rows.length ? `${rows.length}語の候補${rows.length > 12 ? '（先頭12件）' : ''}。品詞・意味を確認して追加できます。`
                : 'この綴りから始まる収録語はありません。未収録の語は意味を入力して登録できます。';
        rows.slice(0, 12).forEach(item => {
            const registered = book?.wordKeys.includes(item.key);
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = registered;
            button.className = 'my-wordbook-suggestion';
            const title = document.createElement('strong'), meaning = document.createElement('small');
            title.textContent = `${item.word.word}（${posLabel(item.word)}）${registered ? '・追加済み' : ''}`;
            meaning.textContent = meaningLabel(item.word);
            button.append(title, meaning);
            button.addEventListener('click', () => {
                const current = getBook(editingId);
                if (!current || current.wordKeys.includes(item.key)) return;
                if (!commit(window.gameState.myWordbooks.map(book => book.id === current.id
                    ? { ...book, wordKeys: [...book.wordKeys, item.key] } : book))) return;
                render();
                status(`${item.word.word}（${posLabel(item.word)}）を追加しました。`);
            });
            host.append(button);
        });
    }

    function openCustom(word = element('myWordbookSuggest').value) {
        if (!requireAccess() || !getBook(editingId)) return;
        cancelWordEdit(false);
        element('myWordbookCustomForm').reset();
        element('myWordbookCustomTitle').textContent = '未収録の語を登録';
        element('myWordbookCustomSave').textContent = '意味を保存して追加';
        element('myWordbookCustomHelp').textContent = '自分の単語帳にだけ保存します。復習・学習履歴は使えますが、復習スコア・ランキング加点は対象外です。';
        element('myWordbookCustomWord').readOnly = false;
        element('myWordbookCustomPos').disabled = false;
        element('myWordbookCustomWord').value = word.trim().slice(0, 120);
        element('myWordbookCustomForm').hidden = false;
        element('myWordbookCustomMeaning').focus({ preventScroll: true });
        status('未収録の語を、自分の意味・品詞で登録します。');
    }

    function cancelWordEdit(restoreFocus = true) {
        customEditingId = null;
        noteEditingKey = null;
        element('myWordbookCustomForm').hidden = true;
        element('myWordbookNoteForm').hidden = true;
        if (restoreFocus && getBook(editingId)) element('myWordbookEditorHeading').focus({ preventScroll: true });
    }

    function editCustom(key) {
        if (!requireAccess() || !getBook(editingId)?.wordKeys.includes(key)) return;
        const word = window.gameState.myCustomWords.find(item => customKey(item.id) === key);
        if (!word) return;
        cancelWordEdit(false);
        customEditingId = word.id;
        element('myWordbookCustomTitle').textContent = '自作語の意味を編集';
        element('myWordbookCustomWord').value = word.word;
        element('myWordbookCustomWord').readOnly = true;
        element('myWordbookCustomPos').value = word.pos;
        element('myWordbookCustomPos').disabled = true;
        element('myWordbookCustomMeaning').value = word.meaning;
        element('myWordbookCustomSave').textContent = '変更を保存';
        element('myWordbookCustomHelp').textContent = 'この語を使うすべてのマイ単語帳に反映します。綴り・品詞と学習履歴はそのままです。';
        element('myWordbookCustomForm').hidden = false;
        element('myWordbookCustomMeaning').focus();
        status('意味を修正できます。学習履歴・復習予定は変わりません。');
    }

    function editNote(key) {
        const book = getBook(editingId), item = getCatalog().byKey.get(key);
        if (!requireAccess() || !book?.wordKeys.includes(key) || !item) return;
        cancelWordEdit(false);
        noteEditingKey = key;
        const note = getNote(key, book);
        element('myWordbookNoteTitle').textContent = `${item.word.word}（${posLabel(item.word)}）の自分用メモ`;
        element('myWordbookNoteOriginal').textContent = meaningLabel(item.word);
        element('myWordbookNoteMeaning').value = note?.meaning || '';
        element('myWordbookNoteMemo').value = note?.memo || '';
        element('myWordbookNoteForm').hidden = false;
        element('myWordbookNoteMeaning').focus();
        status('この単語帳だけの訳・覚え方です。元の意味は変更しません。');
    }

    function saveNote(event) {
        event.preventDefault();
        const book = getBook(editingId), key = noteEditingKey;
        if (!requireAccess() || !book?.wordKeys.includes(key)) return;
        const meaning = element('myWordbookNoteMeaning').value.trim();
        const memo = element('myWordbookNoteMemo').value.trim();
        if (meaning.length > 500 || memo.length > 500) { status('自分の訳・メモはそれぞれ500字までです。', true); return; }
        const wordNotes = { ...book.wordNotes };
        if (meaning || memo) wordNotes[key] = { meaning, memo }; else delete wordNotes[key];
        if (!commit(window.gameState.myWordbooks.map(item => item.id === book.id ? { ...item, wordNotes } : item))) return;
        cancelWordEdit();
        render();
        status(meaning || memo ? '自分用メモを保存しました。元の意味・学習履歴はそのままです。' : '自分用メモを消しました。元の意味・学習履歴はそのままです。');
    }

    function addCustom(event) {
        event.preventDefault();
        const book = getBook(editingId);
        if (!book || !requireAccess()) return;
        if (customEditingId) {
            const original = window.gameState.myCustomWords.find(item => item.id === customEditingId);
            const meaning = element('myWordbookCustomMeaning').value.trim();
            if (!original || !book.wordKeys.includes(customKey(original.id))) return;
            if (!meaning || meaning.length > 500) { status('意味を入力してください（500字まで）。', true); return; }
            if (!commit(window.gameState.myWordbooks, window.gameState.activeMyWordbookId,
                window.gameState.myCustomWords.map(item => item.id === original.id ? { ...item, meaning } : item))) return;
            cancelWordEdit();
            render();
            status('自作語の意味を保存しました。ほかの単語帳にも反映し、学習履歴はそのままです。');
            return;
        }
        const word = element('myWordbookCustomWord').value.trim().replace(/\s+/g, ' ');
        const pos = element('myWordbookCustomPos').value;
        const meaning = element('myWordbookCustomMeaning').value.trim();
        if (!word || word.length > 120 || !meaning || meaning.length > 500 || !Object.hasOwn(POS_LABELS, pos)) {
            status('単語・品詞・意味を入力してください（単語120字、意味500字まで）。', true); return;
        }
        const matches = getCatalog().byText.get(normalizeText(word)) || [];
        if (matches.some(item => item.level !== 'my-custom')) {
            element('myWordbookSuggest').value = word;
            renderSuggestions();
            status('収録済みの語です。候補の品詞・意味を確認して追加してください。', true); return;
        }
        const existing = (window.gameState.myCustomWords || []).find(item => normalizeText(item.word) === normalizeText(word) && item.pos === pos);
        const custom = existing || { id: newId('custom-'), word, pos, meaning };
        const key = customKey(custom.id);
        if (book.wordKeys.includes(key)) { status('同じ単語・品詞はこの単語帳に追加済みです。', true); return; }
        const words = existing ? window.gameState.myCustomWords : [...(window.gameState.myCustomWords || []), custom];
        if (!commit(window.gameState.myWordbooks.map(item => item.id === book.id
            ? { ...item, wordKeys: [...item.wordKeys, key] } : item), window.gameState.activeMyWordbookId, words)) return;
        element('myWordbookCustomForm').hidden = true;
        if (importResult) importResult = matchInput(element('myWordbookInput').value);
        render();
        status(existing ? '登録済みの同じ単語・品詞を追加しました。保存済みの意味と学習履歴を使います。' : `${word}（${POS_LABELS[pos]}）を自分の意味で登録しました。`);
    }

    function renderRows() {
        const book = getBook(editingId);
        if (!book) return;
        const rows = getRows();
        pageIndex = Math.min(pageIndex, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1));
        const shown = rows.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
        const members = new Set(book.wordKeys);
        const host = element('myWordbookRows');
        host.replaceChildren();
        shown.forEach(item => {
            const registered = tab === 'input' && members.has(item.key);
            const label = document.createElement('label');
            label.className = 'my-wordbook-row';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item.key;
            checkbox.checked = selection.has(item.key);
            checkbox.disabled = registered;
            checkbox.setAttribute('aria-label', `${item.word.word}（${posLabel(item.word)}）を選択`);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) selection.add(item.key); else selection.delete(item.key);
                renderSelection();
            });
            const copy = document.createElement('span');
            const title = document.createElement('strong');
            title.textContent = `${item.word.word}（${posLabel(item.word)}）`;
            const meaning = document.createElement('small');
            meaning.textContent = meaningLabel(item.word);
            copy.append(title, meaning);
            const state = window.gameState.wordStates[item.key] || 'unlearned';
            const meta = document.createElement('span');
            meta.className = 'my-wordbook-row-meta';
            meta.textContent = registered ? '追加済み' : `${LABELS[item.level]}・${STATES[state] || '未学習'}`;
            label.append(checkbox, copy, meta);
            const entry = document.createElement('div');
            entry.className = 'my-wordbook-entry';
            entry.append(label);
            if (tab === 'members') {
                const note = getNote(item.key, book);
                if (note) {
                    const preview = document.createElement('small');
                    preview.className = 'my-wordbook-note-preview';
                    preview.textContent = [note.meaning ? `自分の訳：${note.meaning}` : '', note.memo ? `メモ：${note.memo}` : ''].filter(Boolean).join('\n');
                    entry.append(preview);
                }
                const actions = document.createElement('div');
                actions.className = 'my-wordbook-entry-actions';
                const noteButton = document.createElement('button');
                noteButton.type = 'button';
                noteButton.textContent = note ? 'メモを編集' : '自分用メモ';
                noteButton.setAttribute('aria-label', `${item.word.word}（${posLabel(item.word)}）の自分用メモを編集`);
                noteButton.addEventListener('click', () => editNote(item.key));
                actions.append(noteButton);
                if (item.word.__customWord) {
                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.textContent = '意味を編集';
                    editButton.setAttribute('aria-label', `${item.word.word}（${posLabel(item.word)}）の意味を編集`);
                    editButton.addEventListener('click', () => editCustom(item.key));
                    actions.append(editButton);
                }
                entry.append(actions);
            }
            host.append(entry);
        });
        if (!rows.length) {
            const empty = document.createElement('p');
            empty.className = 'my-wordbook-empty';
            empty.textContent = tab === 'input' ? (importResult ? '一致する語がありません。綴りをご確認ください。' : '英単語を入力して「照合する」を押してください。')
                : tab === 'members' ? 'まだ単語がありません。「入力して追加」から範囲の語を貼り付けられます。' : 'この条件の追加できる語はありません。';
            host.append(empty);
        }
        const unavailable = book.wordKeys.filter(key => !getCatalog().byKey.has(key)).length;
        element('myWordbookResults').textContent = tab === 'input' && importResult
            ? `${importResult.inputCount}件を照合：${rows.length}語一致（追加済み ${rows.filter(item => members.has(item.key)).length}語）`
            : `${rows.length}語${tab === 'members' && unavailable ? `・現在のデータにない語 ${unavailable}件（保存は保持）` : ''}`;
        element('myWordbookMissing').hidden = tab !== 'input' || !importResult?.missing.length;
        const missingHost = element('myWordbookMissing');
        missingHost.replaceChildren();
        if (importResult?.missing.length) {
            const title = document.createElement('p');
            title.textContent = '未収録の語：意味を入力して登録できます。';
            missingHost.append(title);
            importResult.missing.forEach(word => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = `${word} の意味を入力`;
                button.addEventListener('click', () => openCustom(word));
                missingHost.append(button);
            });
        }
        element('myWordbookPaging').hidden = rows.length <= PAGE_SIZE;
        element('myWordbookPageInfo').textContent = `${pageIndex + 1} / ${Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}`;
        element('myWordbookPrev').disabled = pageIndex === 0;
        element('myWordbookNext').disabled = (pageIndex + 1) * PAGE_SIZE >= rows.length;
        element('myWordbookSelectShown').disabled = !shown.some(item => tab === 'members' || !members.has(item.key));
        renderSelection();
    }

    function renderSelection() {
        const count = selection.size;
        element('myWordbookSelectionCount').textContent = `${count}語選択`;
        const action = element('myWordbookApply');
        action.disabled = count === 0;
        action.textContent = tab === 'members' ? '選択した語を外す' : '選択した語を追加';
    }

    function applySelection() {
        const book = getBook(editingId);
        if (!book || !selection.size) return;
        const members = new Set(book.wordKeys);
        let count = 0;
        selection.forEach(key => {
            if (tab === 'members') { if (members.delete(key)) count++; }
            else if (getCatalog().byKey.has(key) && !members.has(key)) { members.add(key); count++; }
        });
        if (tab === 'members' && !confirm(`選択した${count}語を単語帳から外しますか？\n学習履歴・復習予定は消えません。`)) return;
        if (!commit(window.gameState.myWordbooks.map(item => item.id === book.id ? { ...item, wordKeys: [...members] } : item))) return;
        selection.clear();
        render();
        status(tab === 'members' ? `${count}語を外しました。学習履歴はそのままです。` : `${count}語を追加しました。`);
    }

    function render() {
        const book = getBook(editingId);
        element('myWordbookLibrary').hidden = !!book;
        element('myWordbookEditor').hidden = !book;
        if (!book) {
            const host = element('myWordbookLibraryList');
            host.replaceChildren();
            (window.gameState.myWordbooks || []).forEach(item => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'wordbook-card my-wordbook-card';
                const counts = { unlearned: 0, weak: 0, learned: 0, perfect: 0 };
                item.wordKeys.forEach(key => { const state = window.gameState.wordStates[key] || 'unlearned'; if (state in counts) counts[state]++; });
                button.innerHTML = `<span class="wordbook-copy"><strong>${escape(item.name)}</strong><small>${item.wordKeys.length}語 ・ ${Object.entries(counts).map(([state, count]) => `${STATES[state]} ${count}`).join(' / ')}</small></span><span aria-hidden="true">›</span>`;
                button.addEventListener('click', () => openEditor(item.id));
                host.append(button);
            });
            element('myWordbookLibraryEmpty').hidden = !!(window.gameState.myWordbooks || []).length;
            return;
        }
        element('myWordbookEditorHeading').textContent = book.name;
        element('myWordbookName').value = book.name;
        element('myWordbookStart').disabled = !book.wordKeys.some(key => getCatalog().byKey.has(key));
        element('myWordbookInputPanel').hidden = tab !== 'input';
        element('myWordbookFilterPanel').hidden = tab === 'input';
        element('myWordbookSourceLabel').hidden = tab !== 'history';
        document.querySelectorAll('[data-my-wordbook-tab]').forEach(button => {
            const active = button.dataset.myWordbookTab === tab;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        renderRows();
        renderSuggestions();
    }

    function startStudy() {
        if (!requireAccess()) return;
        const book = getBook(editingId);
        if (!book?.wordKeys.some(key => getCatalog().byKey.has(key)) || !window.ensureTrialAccess()) return;
        const state = window.gameState;
        const previous = { currentLevel: state.currentLevel, currentMode: state.currentMode, activeMyWordbookId: state.activeMyWordbookId };
        state.activeMyWordbookId = book.id;
        state.currentLevel = 'my';
        state.currentMode = state.reviewMode === 'on' ? 'unlearned' : 'all';
        if (!window.saveGame()) { Object.assign(state, previous); status('保存できませんでした。学習範囲は変更していません。', true); return; }
        refreshCollection();
        gameStateHistory = [];
        updateUndoButton();
        window.activateLearningSessionUI();
        element('myWordbookModal').style.display = 'none';
        window.switchLevel('my');
    }

    function practiceAll() {
        if (window.gameState.currentLevel !== 'my' || !window.ensureTrialAccess()) return;
        window.activateLearningSessionUI();
        window.gameState.currentMode = 'all';
        window.setReviewMode('off', true);
    }

    document.addEventListener('DOMContentLoaded', () => {
        element('myWordbookCreateForm').addEventListener('submit', create);
        element('myWordbookRenameForm').addEventListener('submit', rename);
        element('myWordbookCustomForm').addEventListener('submit', addCustom);
        element('myWordbookNoteForm').addEventListener('submit', saveNote);
        element('myWordbookSuggest').addEventListener('input', renderSuggestions);
        element('myWordbookSearch').addEventListener('input', () => { pageIndex = 0; renderRows(); });
        element('myWordbookSource').addEventListener('change', () => { selection.clear(); pageIndex = 0; renderRows(); });
        element('myWordbookInput').addEventListener('input', () => {
            importResult = null; selection.clear(); pageIndex = 0; renderRows(); status('');
        });
    });

    window.MyWordbooks = Object.freeze({
        normalizeBooks, normalizeNotes, normalizeCustomWords, customKey, isCustomKey, matchInput, getSuggestions, getCatalog, getBook, getNote, resolveWord, studyNoteMarkup, restore, refreshCollection, refreshStudyUI,
        openCustom, addCustom, editCustom, editNote, saveNote, cancelWordEdit,
        open, openEditor, create, rename, removeBook, changeTab, previewInput, applySelection, startStudy, practiceAll,
        showLibrary() { cancelWordEdit(false); editingId = null; selection.clear(); status(''); render(); element('myWordbookNewName').focus({ preventScroll: true }); },
        page(delta) { pageIndex = Math.max(0, pageIndex + delta); renderRows(); },
        selectShown() { getRows().slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).forEach(item => {
            if (tab === 'members' || !getBook(editingId).wordKeys.includes(item.key)) selection.add(item.key);
        }); renderRows(); },
        clearSelection() { selection.clear(); renderRows(); }
    });
})();
