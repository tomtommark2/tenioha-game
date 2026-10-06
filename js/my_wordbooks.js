/* Named collections reference existing learning keys, never copy learning history. */
(function () {
    const LEVELS = ['junior', 'basic', 'daily', 'exam1'];
    const LABELS = { junior: '中学', basic: '基礎', daily: '標準', exam1: '受験', 'my-custom': '自分で登録' };
    const POS_LABELS = { 名: '名詞', 動: '動詞', 形: '形容詞', 副: '副詞', 助: '助動詞', 前: '前置詞', 接: '接続詞', 代: '代名詞', other: 'その他' };
    const EMPTY_CUSTOM_WORDS = [];
    const STATES = { unlearned: '未学習', weak: '苦手', learned: '得意', perfect: '完璧' };
    const PAGE_SIZE = 60;
    const MAX_IMPORT_ROWS = 500;
    let catalogDatabase = null, catalogCustomWords = null, catalog = null;
    let editingId = null, tab = 'members', pageIndex = 0;
    let customEditingId = null, noteEditingKey = null;
    let registrationKey = null, wordEditorOpen = false, wordEditReturnFocus = null, editorScrollTop = 0;
    let importResult = null, selection = new Set();
    let tableSource = null, bulkPage = 0;
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

    function importPos(value) {
        const text = normalizeText(value).replace(/[.。]/g, '');
        const aliases = { n: '名', noun: '名', v: '動', verb: '動', adj: '形', adjective: '形',
            adv: '副', adverb: '副', aux: '助', auxiliary: '助', prep: '前', preposition: '前',
            conj: '接', conjunction: '接', pron: '代', pronoun: '代', other: 'other', その他: 'other' };
        return Object.hasOwn(POS_LABELS, text) ? text : aliases[text]
            || Object.keys(POS_LABELS).find(key => POS_LABELS[key] === text) || '';
    }

    // Keep fields intact: commas, tabs and quoted newlines inside a meaning are not words.
    function parseImportTable(value, separator = 'auto') {
        let text = String(value || '').replace(/^\uFEFF/, '');
        if (text.length > 50000) throw new Error('一度に入力できるのは50,000文字までです。');
        const metadata = {};
        while (/^#[^\r\n]*(?:\r?\n|$)/.test(text)) {
            const line = text.match(/^#[^\r\n]*(?:\r?\n|$)/)[0];
            const match = line.trim().match(/^#(separator|columns):\s*(.*)$/i);
            if (match) metadata[match[1].toLowerCase()] = match[2];
            text = text.slice(line.length);
        }
        const delimiters = { tab: '\t', comma: ',', semicolon: ';' };
        const parse = delimiter => {
            const rows = [];
            let row = [], field = '', quoted = false, closed = false;
            const finishField = () => { row.push(field); field = ''; closed = false; };
            const finishRow = () => { finishField(); if (row.some(cell => cell.trim())) rows.push(row); row = []; };
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (quoted) {
                    if (char === '"') {
                        if (text[i + 1] === '"') { field += '"'; i++; }
                        else { quoted = false; closed = true; }
                    } else if (char === '\r' && text[i + 1] === '\n') { field += '\n'; i++; }
                    else field += char;
                } else if (char === delimiter) finishField();
                else if (char === '\n' || char === '\r') {
                    finishRow(); if (char === '\r' && text[i + 1] === '\n') i++;
                } else if (char === '"' && !field.trim() && !closed) { field = ''; quoted = true; }
                else if (closed && !/\s/.test(char)) throw new Error('引用符の後は区切りか改行にしてください。');
                else if (!closed) field += char;
            }
            if (quoted) throw new Error('引用符が閉じていません。入力をご確認ください。');
            finishRow();
            return rows;
        };
        if (separator === 'auto' && metadata.separator) {
            separator = Object.keys(delimiters).find(key => key === metadata.separator.toLowerCase()
                || delimiters[key] === metadata.separator) || 'auto';
        }
        let rows;
        if (separator === 'auto') {
            const errors = [];
            const candidates = Object.entries(delimiters).map(([name, delimiter]) => {
                try { return { name, rows: parse(delimiter) }; } catch (error) { errors.push(error); return null; }
            }).filter(candidate => candidate?.rows[0]?.length > 1);
            if (!candidates.length) throw errors[0] || new Error('単語と意味をカンマかタブで区切ってください。');
            // Tabs are the least ambiguous for spreadsheet/Anki text. Otherwise use the first record.
            const candidate = candidates.find(candidate => candidate.name === 'tab')
                || candidates.sort((a, b) => b.rows[0].length - a.rows[0].length)[0];
            separator = candidate.name; rows = candidate.rows;
        } else {
            if (!Object.hasOwn(delimiters, separator)) throw new Error('区切りを選んでください。');
            rows = parse(delimiters[separator]);
        }
        if (!rows.length) throw new Error('単語と意味を入力してください。');
        if (rows.length > MAX_IMPORT_ROWS + 1) throw new Error('一度に取り込めるのは500行までです。');
        const columnCount = Math.max(...rows.map(row => row.length));
        if (columnCount < 2 || columnCount > 32) throw new Error('表は2〜32列で入力してください。');
        const names = { word: ['単語', '英単語', '英単語・熟語', 'word', 'term', 'front', 'expression'],
            meaning: ['意味', '訳', '自分の訳', 'meaning', 'definition', 'translation', 'back'],
            pos: ['品詞', 'pos', 'part of speech'] };
        const first = rows[0].map(normalizeText);
        const index = (kind, cells) => cells.findIndex(cell => names[kind].includes(normalizeText(cell)));
        const header = index('word', first) >= 0 && index('meaning', first) >= 0;
        const headers = metadata.columns ? metadata.columns.split(delimiters[separator]) : header ? rows[0] : [];
        const data = header ? rows.slice(1) : rows;
        const word = index('word', headers), meaning = index('meaning', headers), pos = index('pos', headers);
        return { rows, separator, columnCount, header, headers,
            mapping: { word: word < 0 ? 0 : word, meaning: meaning < 0 ? 1 : meaning,
                pos: pos >= 0 ? pos : columnCount === 3 && data.some(row => row[2]?.trim())
                    && data.every(row => !row[2]?.trim() || importPos(row[2])) ? 2 : -1 } };
    }

    function mappedImportRows(source, mapping, skipHeader = source.header) {
        const columns = [mapping.word, mapping.meaning, mapping.pos].filter(column => column >= 0);
        if (mapping.word < 0 || mapping.meaning < 0 || new Set(columns).size !== columns.length)
            throw new Error('単語・意味・品詞には別々の列を指定してください。');
        const records = skipHeader ? source.rows.slice(1) : source.rows;
        if (records.length > MAX_IMPORT_ROWS) throw new Error('一度に取り込めるのは500行までです。');
        const unique = new Set();
        return records.flatMap((cells, i) => {
            const word = (cells[mapping.word] || '').trim().replace(/\s+/g, ' ');
            const meaning = (cells[mapping.meaning] || '').trim();
            const posText = mapping.pos < 0 ? '' : (cells[mapping.pos] || '').trim();
            if (!word || word.length > 120 || meaning.length > 500)
                throw new Error(`${i + 1}行目：単語は1〜120字、意味は500字までです。`);
            const identity = JSON.stringify([normalizeText(word), meaning, normalizeText(posText)]);
            if (unique.has(identity)) return [];
            unique.add(identity);
            return [{ word, meaning, pos: importPos(posText), posText }];
        });
    }

    function matchImportRows(records, database = window.vocabularyDatabase) {
        const lookup = getCatalog(database);
        const keys = new Set(), ambiguous = new Set();
        const sourceRows = records.map(record => {
            const all = lookup.byText.get(normalizeText(record.word)) || [];
            const filtered = record.pos ? all.filter(item => (item.word.senses || [item.word]).some(sense => sense.pos === record.pos)) : all;
            // A different/unknown POS must not silently create a second copy of a database word.
            const matches = filtered.length || !all.some(item => item.level !== 'my-custom') ? filtered : all;
            const needsChoice = matches.length > 1 || (!!record.posText && !record.pos) || (all.length > 0 && !filtered.length);
            matches.forEach(item => { keys.add(item.key); if (needsChoice) ambiguous.add(item.key); });
            return { ...record, matches: matches.map(item => item.key) };
        });
        const pendingRows = sourceRows.filter(row => !row.matches.length).map(row => ({ ...row, originalWord: row.word, selected: true, saved: false }));
        return { keys: [...keys], missing: pendingRows.map(row => row.word), ambiguousKeys: [...ambiguous],
            inputCount: records.length, sourceRows, pendingRows };
    }

    function importedMeaning(result, key) {
        const rows = (result?.sourceRows || []).filter(row => row.matches.includes(key) && row.meaning);
        const meanings = [...new Set(rows.map(row => row.meaning))];
        if (meanings.length < 2) return meanings[0] || '';
        if (rows.every(row => row.pos) && new Set(rows.map(row => row.pos)).size === rows.length) {
            const meaning = rows.map(row => `${POS_LABELS[row.pos]}：${row.meaning}`).join('\n');
            if (meaning.length > 500) throw new Error('同じカードの訳は合計500字までです。入力を短くしてください。');
            return meaning;
        }
        throw new Error('同じカードに異なる訳があります。入力を一つにまとめてください。');
    }

    // Prepare everything without touching saved objects. One failed row/save cancels the whole batch.
    function planBulkImport(book, records, database = window.vocabularyDatabase) {
        if (records.filter(row => row.selected && !row.saved).length > MAX_IMPORT_ROWS)
            throw new Error('一度に登録できるのは500語までです。選択数を減らしてください。');
        const customWords = [...(window.gameState?.myCustomWords || [])];
        const wordKeys = new Set(book.wordKeys), wordNotes = { ...book.wordNotes };
        const seen = new Map(), changed = new Set();
        const lookup = getCatalog(database);
        records.filter(row => row.selected && !row.saved).forEach((row, index) => {
            const word = row.word.trim().replace(/\s+/g, ' '), meaning = row.meaning.trim(), pos = row.pos;
            const fail = message => { throw Object.assign(new Error(`${index + 1}件目：${message}`), { row }); };
            if (!word || word.length > 120) fail('単語は1〜120字で入力してください。');
            if (!meaning || meaning.length > 500) fail('意味は1〜500字で入力してください。');
            if (!Object.hasOwn(POS_LABELS, pos)) fail('品詞を選んでください。');
            if ((lookup.byText.get(normalizeText(word)) || []).some(item => item.level !== 'my-custom'))
                fail('収録済みの語です。戻って照合し、元のカードを選んでください。');
            const identity = JSON.stringify([normalizeText(word), pos]);
            if (seen.has(identity) && seen.get(identity) !== meaning) fail('同じ単語・品詞に異なる意味があります。片方を選択解除するか、意味をまとめてください。');
            if (seen.has(identity)) return;
            seen.set(identity, meaning);
            let custom = customWords.find(item => normalizeText(item.word) === normalizeText(word) && item.pos === pos);
            if (!custom) { custom = { id: newId('custom-'), word, pos, meaning }; customWords.push(custom); }
            const key = customKey(custom.id);
            // Reusing a shared custom word never overwrites its definition in another book.
            if (custom.meaning !== meaning || wordNotes[key]?.meaning)
                wordNotes[key] = { ...wordNotes[key], meaning };
            wordKeys.add(key); changed.add(key);
        });
        return { book: { ...book, wordKeys: [...wordKeys], wordNotes }, customWords, count: changed.size };
    }

    function tableMapping() {
        return Object.fromEntries(['word', 'meaning', 'pos'].map(kind => [kind,
            Number(element(`myWordbookImport${kind[0].toUpperCase() + kind.slice(1)}Column`).value)]));
    }

    function renderTablePreview() {
        const host = element('myWordbookTablePreview');
        host.replaceChildren();
        if (!tableSource) return;
        try {
            const rows = mappedImportRows(tableSource, tableMapping(), element('myWordbookImportHeader').checked);
            const title = document.createElement('p'); title.textContent = `${rows.length}行・先頭3行を確認`;
            host.append(title);
            rows.slice(0, 3).forEach(row => {
                const line = document.createElement('div');
                [row.word, row.meaning || '（意味なし）', row.posText || '（品詞なし）'].forEach(value => {
                    const cell = document.createElement('span'); cell.textContent = value; line.append(cell);
                });
                host.append(line);
            });
        } catch (error) { host.textContent = error.message; }
    }

    function refreshTableOptions() {
        if (element('myWordbookImportFormat').value !== 'table') return;
        const host = element('myWordbookTablePreview');
        try {
            const source = parseImportTable(element('myWordbookInput').value, element('myWordbookImportSeparator').value);
            const preserve = tableSource?.columnCount === source.columnCount
                && JSON.stringify(tableSource.headers) === JSON.stringify(source.headers);
            const mapping = preserve ? tableMapping() : source.mapping;
            if (!preserve) element('myWordbookImportHeader').checked = source.header;
            tableSource = source;
            ['word', 'meaning', 'pos'].forEach(kind => {
                const select = element(`myWordbookImport${kind[0].toUpperCase() + kind.slice(1)}Column`);
                select.replaceChildren();
                const option = (value, label) => { const el = document.createElement('option'); el.value = value; el.textContent = label; select.append(el); };
                if (kind === 'pos') option(-1, '使用しない');
                for (let i = 0; i < source.columnCount; i++)
                    option(i, `${i + 1}列目：${(source.headers[i] || source.rows[0][i] || '').slice(0, 32)}`);
                select.value = String(mapping[kind]);
            });
            renderTablePreview();
        } catch (error) { tableSource = null; host.textContent = element('myWordbookInput').value ? error.message : ''; }
    }

    function refreshImportMode() {
        const table = element('myWordbookImportFormat').value === 'table';
        element('myWordbookTableOptions').hidden = !table;
        element('myWordbookInput').placeholder = table ? 'apple,りんご,名詞\nlook after,世話をする,動詞' : 'apple\nschool\nhigh school';
        element('myWordbookInputHelp').textContent = table
            ? '1行に1語。単語・意味・品詞の列を確認してください（500行まで）。収録語の訳はこの単語帳だけに保存します。'
            : '改行・カンマ・タブでまとめて照合できます。熟語は1行に1つ。大小文字は区別しません。同じ綴りは品詞・意味を確認してください。統合カードは全用法をまとめて登録します。';
        refreshTableOptions();
    }

    function clearImportPreview() {
        importResult = null; selection.clear(); pageIndex = 0;
        refreshImportMode(); renderRows(); status('');
    }

    function refreshImportResult() {
        if (!importResult) return;
        const pendingRows = importResult.pendingRows;
        importResult = importResult.sourceRows ? matchImportRows(importResult.sourceRows) : matchInput(element('myWordbookInput').value);
        importResult.pendingRows = pendingRows;
    }

    function pendingImportRows() {
        const book = getBook(editingId), lookup = getCatalog();
        return (importResult?.pendingRows || []).filter(row => !row.saved && !(lookup.byText.get(normalizeText(row.originalWord || row.word)) || [])
            .some(item => book?.wordKeys.includes(item.key) && (!row.pos || (item.word.senses || [item.word]).some(sense => sense.pos === row.pos))));
    }

    function openBulk(opener = document.activeElement) {
        if (!requireAccess() || !getBook(editingId) || !pendingImportRows().length) return;
        cancelWordEdit(false);
        bulkPage = 0; renderBulkRows(); status('');
        showWordEditor('myWordbookBulkForm', 'myWordbookBulkTitle', opener);
    }

    function renderBulkCount() {
        const count = pendingImportRows().filter(row => row.selected).length;
        element('myWordbookBulkCount').textContent = `${count}語選択`;
        element('myWordbookBulkSave').disabled = count === 0;
    }

    function renderBulkRows() {
        const rows = pendingImportRows();
        bulkPage = Math.min(bulkPage, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1));
        const host = element('myWordbookBulkRows'); host.replaceChildren();
        rows.slice(bulkPage * PAGE_SIZE, (bulkPage + 1) * PAGE_SIZE).forEach((row, i) => {
            const index = bulkPage * PAGE_SIZE + i;
            const entry = document.createElement('article'); entry.className = 'my-wordbook-bulk-row';
            const heading = document.createElement('label'), check = document.createElement('input');
            check.type = 'checkbox'; check.checked = row.selected; check.setAttribute('aria-label', `${index + 1}行目を登録`);
            check.addEventListener('change', () => { row.selected = check.checked; renderBulkCount(); });
            heading.append(check, document.createTextNode(`${index + 1}行目`)); entry.append(heading);
            const fields = document.createElement('div'); fields.className = 'my-wordbook-bulk-fields';
            const field = (key, label, tag) => {
                const control = document.createElement(tag), el = document.createElement('label');
                control.setAttribute('aria-label', `${index + 1}行目の${label}`);
                if (key === 'pos') {
                    [['', '選んでください'], ...Object.entries(POS_LABELS)].forEach(([value, name]) => {
                        const option = document.createElement('option'); option.value = value; option.textContent = name; control.append(option);
                    });
                } else { control.maxLength = key === 'word' ? 120 : 500; if (tag === 'textarea') control.rows = 2; }
                control.value = row[key];
                control.addEventListener(key === 'pos' ? 'change' : 'input', () => { row[key] = control.value; row.error = ''; error.textContent = ''; });
                el.append(document.createTextNode(label), control); fields.append(el);
            };
            const error = document.createElement('p'); error.className = 'my-wordbook-bulk-error'; error.setAttribute('role', 'status');
            error.textContent = row.error || (row.posText && !row.pos ? `入力された品詞「${row.posText}」を確認してください。` : '');
            field('word', '単語', 'input'); field('pos', '品詞', 'select'); field('meaning', '意味', 'textarea');
            entry.append(fields, error); host.append(entry);
        });
        element('myWordbookBulkPaging').hidden = rows.length <= PAGE_SIZE;
        element('myWordbookBulkPageInfo').textContent = `${bulkPage + 1} / ${Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}`;
        element('myWordbookBulkPrev').disabled = bulkPage === 0;
        element('myWordbookBulkNext').disabled = (bulkPage + 1) * PAGE_SIZE >= rows.length;
        renderBulkCount();
    }

    function saveBulk(event) {
        event.preventDefault();
        const book = getBook(editingId), rows = pendingImportRows();
        if (!book || !rows.some(row => row.selected) || !requireAccess()) return;
        let plan;
        try { plan = planBulkImport(book, rows); }
        catch (error) {
            if (error.row) {
                error.row.error = error.message;
                bulkPage = Math.floor(rows.indexOf(error.row) / PAGE_SIZE); renderBulkRows();
                element('myWordbookBulkRows').querySelectorAll('article')[rows.indexOf(error.row) % PAGE_SIZE]?.querySelector('input:not([type=checkbox])')?.focus();
            }
            status(error.message, true); return;
        }
        if (!commit(window.gameState.myWordbooks.map(item => item.id === book.id ? plan.book : item),
            window.gameState.activeMyWordbookId, plan.customWords)) return;
        rows.filter(row => row.selected).forEach(row => { row.saved = true; });
        refreshImportResult(); cancelWordEdit();
        status(`${plan.count}語をまとめて登録しました。`);
    }

    function getSuggestions(query, database = window.vocabularyDatabase) {
        const prefix = normalizeText(query);
        const rank = item => item.level === 'my-custom' ? LEVELS.length : LEVELS.indexOf(item.level);
        return prefix ? [...getCatalog(database).byKey.values()]
            .filter(item => normalizeText(item.word.word).startsWith(prefix))
            .sort((a, b) => Number(normalizeText(b.word.word) === prefix) - Number(normalizeText(a.word.word) === prefix)
                || rank(a) - rank(b) || a.word.word.localeCompare(b.word.word, 'en') || posLabel(a.word).localeCompare(posLabel(b.word))) : [];
    }

    function getRegistrationMatches(text, database = window.vocabularyDatabase) {
        return (getCatalog(database).byText.get(normalizeText(text)) || []).filter(item => item.level !== 'my-custom');
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
        element('myWordbookPremiumBadge').textContent = '無料';
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
        tableSource = null;
        element('myWordbookImportFormat').value = 'words';
        element('myWordbookImportSeparator').value = 'auto';
        refreshImportMode();
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
        tableSource = null;
        element('myWordbookImportFormat').value = 'words';
        element('myWordbookImportSeparator').value = 'auto';
        refreshImportMode();
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
        try {
            if (element('myWordbookImportFormat').value === 'table') {
                refreshTableOptions();
                if (!tableSource) throw new Error(element('myWordbookTablePreview').textContent || '単語と意味を入力してください。');
                importResult = matchImportRows(mappedImportRows(tableSource, tableMapping(), element('myWordbookImportHeader').checked));
            } else {
                importResult = matchInput(element('myWordbookInput').value);
                importResult.pendingRows = importResult.missing.map(word => ({ word, originalWord: word, meaning: '', pos: '', selected: true, saved: false }));
            }
        } catch (error) { importResult = null; selection.clear(); renderRows(); status(error.message, true); return; }
        const members = new Set(getBook(editingId).wordKeys);
        selection = new Set(importResult.keys.filter(key => canSelectInput(key, members) && !importResult.ambiguousKeys.includes(key)));
        pageIndex = 0;
        renderRows();
        const message = !importResult.inputCount ? '英単語を入力してください。'
            : !importResult.keys.length && importResult.missing.length ? '未収録の語は、意味・品詞を確認してまとめて登録できます。'
            : !importResult.keys.length ? '一致する語がありません。綴りや区切りをご確認ください。'
            : importResult.ambiguousKeys.length ? '同じ綴りの別カードがあります。品詞と意味を確認して選んでください。'
            : !selection.size ? '一致した語はすべて追加済みです。'
            : '追加する語を確認し、「選択した語を追加」を押してください。';
        status(message, !importResult.keys.length && !importResult.missing.length);
    }

    function canSelectInput(key, members = new Set(getBook(editingId).wordKeys)) {
        if (!members.has(key)) return true;
        try {
            const meaning = importedMeaning(importResult, key), item = getCatalog().byKey.get(key);
            const current = getNote(key, getBook(editingId))?.meaning || (item?.level === 'my-custom' ? item.word.meaning : '');
            return !!meaning && meaning !== current;
        }
        catch { return true; }
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

    function showWordEditor(formId, focusId, opener = document.activeElement) {
        wordEditReturnFocus = opener;
        const panel = element('myWordbookModal').querySelector('.my-wordbook-panel');
        editorScrollTop = panel.scrollTop;
        wordEditorOpen = true;
        element('myWordbookEditorContent').hidden = true;
        element('myWordbookIntro').hidden = true;
        element('myWordbookWordEditor').hidden = false;
        element(formId).hidden = false;
        element('myWordbookModal').setAttribute('aria-labelledby', formId === 'myWordbookCustomForm' ? 'myWordbookCustomTitle'
            : formId === 'myWordbookBulkForm' ? 'myWordbookBulkTitle' : 'myWordbookNoteTitle');
        panel.scrollTop = 0;
        element(focusId).focus({ preventScroll: true });
    }

    function updateRegistrationSaveLabel() {
        const book = getBook(editingId);
        element('myWordbookCustomSave').textContent = registrationKey && book?.wordKeys.includes(registrationKey)
            ? '自分の訳を保存' : '意味を保存して追加';
    }

    function renderRegistrationMatches() {
        if (customEditingId) return;
        const matches = getRegistrationMatches(element('myWordbookCustomWord').value);
        if (!matches.some(item => item.key === registrationKey)) registrationKey = matches.length === 1 ? matches[0].key : null;
        element('myWordbookRegistrationMatches').hidden = !matches.length;
        element('myWordbookCustomPosLabel').hidden = !!matches.length;
        element('myWordbookCustomPos').disabled = !!matches.length;
        element('myWordbookCustomHelp').textContent = matches.length
            ? '入力した訳はこの単語帳だけに保存します。元の意味・学習履歴はそのままです。'
            : '未収録の語は独立した履歴になります。ランキング加点は対象外です。';
        const host = element('myWordbookRegistrationCandidates');
        host.replaceChildren();
        matches.forEach(item => {
            const label = document.createElement('label');
            label.className = 'my-wordbook-registration-candidate';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'myWordbookRegistrationKey';
            radio.value = item.key;
            radio.checked = item.key === registrationKey;
            const copy = document.createElement('span'), title = document.createElement('strong'), meaning = document.createElement('small');
            title.textContent = `${item.word.word}（${posLabel(item.word)}）・${LABELS[item.level]}`;
            meaning.textContent = meaningLabel(item.word);
            copy.append(title, meaning);
            label.append(radio, copy);
            radio.addEventListener('change', () => {
                registrationKey = item.key;
                updateRegistrationSaveLabel();
                status('');
            });
            host.append(label);
        });
        updateRegistrationSaveLabel();
    }

    function openCustom(word = element('myWordbookSuggest').value, opener = document.activeElement) {
        if (!requireAccess() || !getBook(editingId)) return;
        cancelWordEdit(false);
        element('myWordbookCustomForm').reset();
        element('myWordbookCustomTitle').textContent = '単語と意味を登録';
        element('myWordbookCustomWord').readOnly = false;
        element('myWordbookCustomPos').disabled = false;
        element('myWordbookCustomWord').value = word.trim().slice(0, 120);
        renderRegistrationMatches();
        status('');
        showWordEditor('myWordbookCustomForm', word.trim() ? 'myWordbookCustomMeaning' : 'myWordbookCustomWord', opener);
    }

    function cancelWordEdit(restoreFocus = true) {
        customEditingId = null;
        noteEditingKey = null;
        registrationKey = null;
        wordEditorOpen = false;
        element('myWordbookCustomForm').hidden = true;
        element('myWordbookNoteForm').hidden = true;
        element('myWordbookBulkForm').hidden = true;
        element('myWordbookWordEditor').hidden = true;
        element('myWordbookEditorContent').hidden = false;
        element('myWordbookIntro').hidden = false;
        element('myWordbookModal').setAttribute('aria-labelledby', 'myWordbookTitle');
        if (restoreFocus && getBook(editingId)) {
            status('');
            render();
            element('myWordbookModal').querySelector('.my-wordbook-panel').scrollTop = editorScrollTop;
            const bulkOpener = wordEditReturnFocus?.id === 'myWordbookBulkOpen' && element('myWordbookBulkOpen');
            const target = bulkOpener || (wordEditReturnFocus?.isConnected && element('myWordbookEditorContent').contains(wordEditReturnFocus)
                && wordEditReturnFocus.getClientRects().length
                ? wordEditReturnFocus : element('myWordbookEditorHeading'));
            target.focus({ preventScroll: target === wordEditReturnFocus });
        }
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
        element('myWordbookCustomPosLabel').hidden = false;
        element('myWordbookRegistrationMatches').hidden = true;
        element('myWordbookCustomMeaning').value = word.meaning;
        element('myWordbookCustomSave').textContent = '変更を保存';
        element('myWordbookCustomHelp').textContent = 'この語を使うすべてのマイ単語帳に反映します。綴り・品詞と学習履歴はそのままです。';
        status('');
        showWordEditor('myWordbookCustomForm', 'myWordbookCustomMeaning');
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
        status('');
        showWordEditor('myWordbookNoteForm', 'myWordbookNoteMeaning');
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
            status('自作語の意味を保存しました。ほかの単語帳にも反映し、学習履歴はそのままです。');
            return;
        }
        const word = element('myWordbookCustomWord').value.trim().replace(/\s+/g, ' ');
        const pos = element('myWordbookCustomPos').value;
        const meaning = element('myWordbookCustomMeaning').value.trim();
        if (!word || word.length > 120 || !meaning || meaning.length > 500 || !Object.hasOwn(POS_LABELS, pos)) {
            status('単語・品詞・意味を入力してください（単語120字、意味500字まで）。', true); return;
        }
        const matches = getRegistrationMatches(word);
        if (matches.length) {
            const item = matches.find(item => item.key === registrationKey) || (matches.length === 1 ? matches[0] : null);
            if (!item) {
                renderRegistrationMatches();
                status('品詞・意味を確認して、元のカードを選んでください。', true);
                element('myWordbookRegistrationCandidates').querySelector('input')?.focus();
                return;
            }
            const registered = book.wordKeys.includes(item.key);
            const wordNotes = { ...book.wordNotes, [item.key]: { ...book.wordNotes?.[item.key], meaning } };
            if (!commit(window.gameState.myWordbooks.map(current => current.id === book.id ? { ...current,
                wordKeys: registered ? current.wordKeys : [...current.wordKeys, item.key], wordNotes } : current))) return;
            if (tab !== 'members') selection.delete(item.key);
            refreshImportResult();
            cancelWordEdit();
            status(registered ? 'この単語帳の訳を保存しました。元の意味・学習履歴はそのままです。'
                : `${item.word.word}を自分の訳付きで追加しました。元の意味・学習履歴はそのままです。`);
            return;
        }
        const existing = (window.gameState.myCustomWords || []).find(item => normalizeText(item.word) === normalizeText(word) && item.pos === pos);
        const custom = existing || { id: newId('custom-'), word, pos, meaning };
        const key = customKey(custom.id);
        if (book.wordKeys.includes(key)) { status('同じ単語・品詞はこの単語帳に追加済みです。', true); return; }
        const words = existing ? window.gameState.myCustomWords : [...(window.gameState.myCustomWords || []), custom];
        if (!commit(window.gameState.myWordbooks.map(item => item.id === book.id
            ? { ...item, wordKeys: [...item.wordKeys, key] } : item), window.gameState.activeMyWordbookId, words)) return;
        refreshImportResult();
        cancelWordEdit();
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
            checkbox.disabled = registered && !(tab === 'input' && canSelectInput(item.key, members));
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
            if (tab === 'input' && importResult?.sourceRows) {
                const personal = document.createElement('small'); personal.className = 'my-wordbook-import-meaning';
                try { const value = importedMeaning(importResult, item.key); personal.textContent = value ? `自分の訳：${value}` : ''; }
                catch (error) { personal.textContent = error.message; }
                copy.append(personal);
            }
            const state = window.gameState.wordStates[item.key] || 'unlearned';
            const meta = document.createElement('span');
            meta.className = 'my-wordbook-row-meta';
            meta.textContent = registered ? (checkbox.disabled ? '追加済み' : '登録済み・訳を保存') : `${LABELS[item.level]}・${STATES[state] || '未学習'}`;
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
        const pending = pendingImportRows();
        element('myWordbookMissing').hidden = tab !== 'input' || !pending.length;
        const missingHost = element('myWordbookMissing');
        missingHost.replaceChildren();
        if (pending.length) {
            const title = document.createElement('p');
            title.textContent = '未収録の語：意味を入力して登録できます。';
            missingHost.append(title);
            const bulk = document.createElement('button'); bulk.id = 'myWordbookBulkOpen'; bulk.type = 'button';
            bulk.textContent = `未収録の${pending.length}語をまとめて登録`;
            bulk.addEventListener('click', () => openBulk(bulk)); missingHost.append(bulk);
            // Keep the familiar one-word entry for word-only input, without a huge button list.
            if (!importResult.sourceRows) pending.slice(0, 12).forEach(row => {
                const word = row.word;
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = `${word} の意味を入力`;
                button.addEventListener('click', () => openCustom(word, button));
                missingHost.append(button);
            });
        }
        element('myWordbookPaging').hidden = rows.length <= PAGE_SIZE;
        element('myWordbookPageInfo').textContent = `${pageIndex + 1} / ${Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}`;
        element('myWordbookPrev').disabled = pageIndex === 0;
        element('myWordbookNext').disabled = (pageIndex + 1) * PAGE_SIZE >= rows.length;
        element('myWordbookSelectShown').disabled = !shown.some(item => tab === 'members' || (tab === 'input' ? canSelectInput(item.key, members) : !members.has(item.key)));
        renderSelection();
    }

    function renderSelection() {
        const count = selection.size;
        element('myWordbookSelectionCount').textContent = `${count}語選択`;
        const action = element('myWordbookApply');
        action.disabled = count === 0;
        action.textContent = tab === 'members' ? '選択した語を外す' : tab === 'input' && importResult?.sourceRows ? '選択した語を追加・訳を保存' : '選択した語を追加';
    }

    function applySelection() {
        const book = getBook(editingId);
        if (!book || !selection.size) return;
        const members = new Set(book.wordKeys);
        const wordNotes = { ...book.wordNotes };
        let count = 0, notes = 0;
        try {
            if (tab === 'input') selection.forEach(key => {
                const meaning = importedMeaning(importResult, key);
                if (meaning && wordNotes[key]?.meaning !== meaning) { wordNotes[key] = { ...wordNotes[key], meaning }; notes++; }
            });
        } catch (error) { status(error.message, true); return; }
        selection.forEach(key => {
            if (tab === 'members') { if (members.delete(key)) count++; }
            else if (getCatalog().byKey.has(key) && !members.has(key)) { members.add(key); count++; }
        });
        if (tab === 'members' && !confirm(`選択した${count}語を単語帳から外しますか？\n学習履歴・復習予定は消えません。`)) return;
        if (!commit(window.gameState.myWordbooks.map(item => item.id === book.id ? { ...item, wordKeys: [...members], wordNotes } : item))) return;
        selection.clear();
        render();
        status(tab === 'members' ? `${count}語を外しました。学習履歴はそのままです。`
            : `${count}語を追加しました。${notes ? `${notes}語の自分の訳を保存しました。` : ''}`);
    }

    function render() {
        const book = getBook(editingId);
        element('myWordbookLibrary').hidden = !!book;
        element('myWordbookEditor').hidden = !book;
        element('myWordbookEditorContent').hidden = wordEditorOpen;
        element('myWordbookWordEditor').hidden = !wordEditorOpen;
        element('myWordbookIntro').hidden = wordEditorOpen;
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
        element('myWordbookCustomWord').addEventListener('input', () => { renderRegistrationMatches(); status(''); });
        element('myWordbookNoteForm').addEventListener('submit', saveNote);
        element('myWordbookBulkForm').addEventListener('submit', saveBulk);
        element('myWordbookImportFormat').addEventListener('change', () => { tableSource = null; clearImportPreview(); });
        element('myWordbookImportSeparator').addEventListener('change', () => { tableSource = null; clearImportPreview(); });
        ['Word', 'Meaning', 'Pos'].forEach(kind => element(`myWordbookImport${kind}Column`).addEventListener('change', clearImportPreview));
        element('myWordbookImportHeader').addEventListener('change', clearImportPreview);
        element('myWordbookBulkPos').addEventListener('change', () => {
            const pos = element('myWordbookBulkPos').value;
            if (pos) pendingImportRows().filter(row => row.selected && !row.pos).forEach(row => { row.pos = pos; row.error = ''; });
            element('myWordbookBulkPos').value = ''; renderBulkRows();
        });
        element('myWordbookSuggest').addEventListener('input', renderSuggestions);
        element('myWordbookSearch').addEventListener('input', () => { pageIndex = 0; renderRows(); });
        element('myWordbookSource').addEventListener('change', () => { selection.clear(); pageIndex = 0; renderRows(); });
        element('myWordbookInput').addEventListener('input', clearImportPreview);
    });

    window.MyWordbooks = Object.freeze({
        normalizeBooks, normalizeNotes, normalizeCustomWords, customKey, isCustomKey, matchInput, getSuggestions, getRegistrationMatches, getCatalog, getBook, getNote, resolveWord, studyNoteMarkup, restore, refreshCollection, refreshStudyUI,
        importPos, parseImportTable, mappedImportRows, matchImportRows, importedMeaning, planBulkImport,
        openBulk, saveBulk,
        selectBulk(selected) { pendingImportRows().forEach(row => { row.selected = selected; }); renderBulkRows(); },
        pageBulk(delta) { bulkPage = Math.max(0, bulkPage + delta); renderBulkRows(); },
        openCustom, addCustom, editCustom, editNote, saveNote, cancelWordEdit,
        open, openEditor, create, rename, removeBook, changeTab, previewInput, applySelection, startStudy, practiceAll,
        showLibrary() { cancelWordEdit(false); editingId = null; selection.clear(); status(''); render(); element('myWordbookNewName').focus({ preventScroll: true }); },
        page(delta) { pageIndex = Math.max(0, pageIndex + delta); renderRows(); },
        selectShown() { getRows().slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).forEach(item => {
            if (tab === 'members' || (tab === 'input' ? canSelectInput(item.key) : !getBook(editingId).wordKeys.includes(item.key))) selection.add(item.key);
        }); renderRows(); },
        clearSelection() { selection.clear(); renderRows(); }
    });
})();
