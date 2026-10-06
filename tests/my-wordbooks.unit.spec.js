const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runtime() {
    const ctx = vm.createContext({ console, document: { addEventListener() {} }, localStorage: { getItem: () => null } });
    ctx.window = ctx;
    for (const name of ['utils', 'my_wordbooks']) vm.runInContext(fs.readFileSync(path.join(__dirname, `../js/${name}.js`), 'utf8'), ctx);
    ctx.vocabularyDatabase = { junior: [{ word: 'apple', pos: '名' }, { word: 'look after', pos: '動' }],
        basic: [{ word: 'attribute', pos: '名' }, { word: 'attribute', pos: '動' }], daily: [], exam1: [],
        selection1900: [{ word: 'exclusive', pos: '形' }] };
    return ctx;
}

test('マイ単語帳：未購入・期限切れでも語と学習範囲を使え、購入権限は変更しない', () => {
    const ctx = runtime();
    let purchased = false, checks = 0;
    ctx.GameUtils = { ...ctx.GameUtils, checkPremiumStatus: () => { checks++; return purchased; } };
    ctx.document.getElementById = () => null;
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/word_illustrations.js'), 'utf8'), ctx);
    const api = ctx.WordIllustrations;
    const custom = { word: 'quux-study', pos: '名', __customWord: true, __groupKey: ctx.MyWordbooks.customKey('custom-a') };
    ctx.vocabularyDatabase.my = [ctx.vocabularyDatabase.junior[0], custom];
    expect(api.canUseLevel('my')).toBe(true);
    expect(api.canUseWord(custom, 'my-custom', ctx.vocabularyDatabase)).toBe(true);
    expect(api.accessibleWords('my', ctx.vocabularyDatabase).length).toBe(2);
    expect(checks).toBe(0);
    expect(api.premium()).toBe(false);
    purchased = true;
    expect(api.canUseLevel('my')).toBe(true);
    expect(api.premium()).toBe(true);
    purchased = false;
    expect(api.canUseLevel('my')).toBe(true);
    expect(api.premium()).toBe(false);
});

test('マイ単語帳：照合は大小文字・重複・熟語・品詞を扱い未収録語を明示', () => {
    const ctx = runtime();
    const result = ctx.MyWordbooks.matchInput('APPLE, apple\nlook   after\tattribute；unknown-word');
    expect(result.inputCount).toBe(4);
    expect(result.keys.length).toBe(4);
    expect(result.missing).toEqual(['unknown-word']);
    expect(ctx.MyWordbooks.matchInput('exclusive').keys).toEqual([]);
    expect(ctx.MyWordbooks.matchInput('').inputCount).toBe(0);
});

test('マイ単語帳：保存を検証し重複を除き未解決の正規キーは保持', () => {
    const ctx = runtime();
    const result = ctx.MyWordbooks.normalizeBooks([
        { id: 'book-a', name: ' Test ', wordKeys: ['word-v2:junior:apple:x', 'word-v2:junior:apple:x', 'word-v2:old:gone:x', 'invalid', null] },
        { id: 'book-a', name: 'duplicate' }, { id: '<script>', name: 'bad' }, { id: 'blank', name: ' ' }, null,
    ]);
    expect(JSON.parse(JSON.stringify(result))).toEqual([{ id: 'book-a', name: 'Test', wordKeys: ['word-v2:junior:apple:x', 'word-v2:old:gone:x'], wordNotes: {} }]);
    expect(ctx.MyWordbooks.normalizeBooks(undefined)).toEqual([]);
});

test('マイ単語帳：意味付き登録の原本候補は完全一致・正規化・独立品詞を保ち自作語を混ぜない', () => {
    const ctx = runtime();
    ctx.gameState = { myCustomWords: [{ id: 'custom-a', word: 'apple', pos: '動', meaning: '独自の意味' }] };
    expect(ctx.MyWordbooks.getRegistrationMatches(' ＡＰＰＬＥ ').map(item => item.word.word)).toEqual(['apple']);
    expect(ctx.MyWordbooks.getRegistrationMatches('ap')).toEqual([]);
    expect(ctx.MyWordbooks.getRegistrationMatches('unknown')).toEqual([]);
    const separate = ctx.MyWordbooks.getRegistrationMatches('attribute');
    expect(separate.map(item => item.word.pos)).toEqual(['名', '動']);
    expect(new Set(separate.map(item => item.key)).size).toBe(2);
    const merged = { word: 'attribute', pos: '名', __groupKey: 'word-v2:basic:attribute:merged',
        senses: [{ pos: '名', meaning: '属性' }, { pos: '動', meaning: '〜に帰する' }] };
    const database = { junior: [], basic: [merged], daily: [], exam1: [] };
    expect(ctx.MyWordbooks.getRegistrationMatches('attribute', database).map(item => item.key)).toEqual([merged.__groupKey]);
});

test('マイ単語帳：未回答の作成も新規端末の実データ扱い', () => {
    const ctx = runtime();
    expect(ctx.GameUtils.getLoginCloudSyncDecision({ hadExistingSaveAtBoot: false,
        localData: { lastSaveTime: 200, myWordbooks: [{ id: 'book-a', name: 'テスト', wordKeys: [] }] },
        cloudData: { lastSaveTime: 100, points: 1 },
    })).toBe('keep-local');
    expect(ctx.GameUtils.hasMeaningfulLocalLearningData({ myWordbooks: [] })).toBe(false);
    expect(ctx.GameUtils.hasMeaningfulLocalLearningData({ myWordbooks: [], myCustomWords: [{ id: 'custom-a', word: 'quux-study', meaning: '自分の意味' }] })).toBe(true);
});

test('マイ単語帳：クラウド圧縮・復元は参照と選択を保持し旧保存は補完', () => {
    const ctx = runtime();
    const code = fs.readFileSync(path.join(__dirname, '../js/firebase_app_v2.js'), 'utf8');
    vm.runInContext(code.slice(code.indexOf('function buildCloudSaveData('), code.indexOf('function hasCloudSaveData(')), ctx);
    const key = ctx.GameUtils.getWordKey(ctx.vocabularyDatabase.junior[0], 'junior', ctx.vocabularyDatabase);
    const customKey = ctx.MyWordbooks.customKey('custom-a');
    const original = { myWordbooks: [{ id: 'book-a', name: '中間テスト', wordKeys: [key, customKey],
        wordNotes: { [key]: { meaning: '教科書の訳', memo: '自分の覚え方' } } }],
        myCustomWords: [{ id: 'custom-a', word: 'quux-study', pos: '名', meaning: '自分の意味' }],
        activeMyWordbookId: 'book-a', currentLevel: 'my', currentMode: 'all', srsData: { [customKey]: { recentAnswers: [false], everWrong: true } } };
    ctx.gameState = JSON.parse(ctx.buildCloudSaveData(JSON.stringify(original)));
    ctx.WordIllustrations = { canUseWord: () => true, canUseLevel: () => true };
    ctx.MyWordbooks.restore();
    expect(JSON.parse(JSON.stringify(ctx.gameState.myWordbooks))).toEqual(original.myWordbooks);
    expect(ctx.gameState.activeMyWordbookId).toBe('book-a');
    expect(ctx.GameUtils.getWordKey(ctx.vocabularyDatabase.my[0], 'my', ctx.vocabularyDatabase)).toBe(key);
    expect(JSON.parse(JSON.stringify(ctx.gameState.myCustomWords))).toEqual(original.myCustomWords);
    expect(JSON.parse(JSON.stringify(ctx.gameState.srsData[customKey]))).toEqual(original.srsData[customKey]);
    expect(ctx.vocabularyDatabase.my[1].meaning).toBe('自分の意味');
    expect(JSON.parse(JSON.stringify(ctx.MyWordbooks.getNote(key)))).toEqual(original.myWordbooks[0].wordNotes[key]);
    expect(JSON.parse(JSON.stringify(ctx.MyWordbooks.normalizeBooks([{ id: 'old', name: '旧保存', wordKeys: [key] }])))[0].wordNotes).toEqual({});
    ctx.gameState = { currentLevel: 'basic', currentMode: 'unlearned' };
    ctx.MyWordbooks.restore();
    expect(ctx.gameState.myWordbooks).toEqual([]);
    expect(ctx.gameState.myCustomWords).toEqual([]);
    ctx.gameState = { currentLevel: 'my', currentMode: 'all', activeMyWordbookId: 'deleted' };
    ctx.MyWordbooks.restore();
    expect(ctx.gameState.currentLevel).toBe('basic');
    expect(ctx.gameState.currentMode).toBe('unlearned');
});

test('マイ単語帳：メモの検証・単語帳別の範囲・安全表示を維持', () => {
    const ctx = runtime();
    const word = ctx.vocabularyDatabase.junior[0];
    const key = ctx.GameUtils.getWordKey(word, 'junior', ctx.vocabularyDatabase);
    const notes = ctx.MyWordbooks.normalizeNotes({
        [key]: { meaning: ' 教科書の訳 ', memo: '<img src=x onerror=alert(1)>\n覚え方' },
        'word-v2:old:gone:x': { meaning: '', memo: 'あとで再追加する語' },
        invalid: { meaning: '不正キー' }, 'word-v2:empty:x:x': { meaning: ' ', memo: '' },
        'word-v2:long:x:x': { memo: 'a'.repeat(501) },
    });
    expect(Object.keys(notes)).toHaveLength(3);
    expect(notes[key].meaning).toBe('教科書の訳');
    expect(notes['word-v2:long:x:x'].memo.length).toBe(500);
    expect(ctx.MyWordbooks.normalizeNotes([])).toEqual({});
    ctx.gameState = { currentLevel: 'my', activeMyWordbookId: 'book-a', myWordbooks: [
        { id: 'book-a', name: '教材A', wordKeys: [key], wordNotes: notes },
        { id: 'book-b', name: '教材B', wordKeys: [key], wordNotes: {} },
    ] };
    ctx.WordIllustrations = { canUseLevel: () => true };
    const studyWord = ctx.MyWordbooks.getCatalog().byKey.get(key).word;
    const markup = ctx.MyWordbooks.studyNoteMarkup(studyWord);
    expect(markup).toContain('教科書の訳');
    expect(markup).toContain('&lt;img');
    expect(markup).not.toContain('<img');
    ctx.gameState.activeMyWordbookId = 'book-b';
    expect(ctx.MyWordbooks.studyNoteMarkup(word)).toBe('');
    ctx.gameState.activeMyWordbookId = 'book-a';
    ctx.gameState.currentLevel = 'junior';
    expect(ctx.MyWordbooks.studyNoteMarkup(word)).toBe('');
    ctx.gameState.currentLevel = 'my';
    ctx.WordIllustrations.canUseLevel = () => false;
    expect(ctx.MyWordbooks.studyNoteMarkup(word)).toBe('');
    expect(ctx.MyWordbooks.getNote('word-v2:old:gone:x')).toBeNull();
});

test('マイ単語帳：古い自作語表示も現在の意味へ解決し固定IDと履歴を保持', () => {
    const ctx = runtime();
    const key = ctx.MyWordbooks.customKey('custom-a');
    const oldWord = { word: 'quux-study', meaning: '修正前', pos: '名', __customWord: true, __groupKey: key };
    ctx.gameState = { myCustomWords: [{ id: 'custom-a', word: 'quux-study', meaning: '修正後', pos: '名' }],
        srsData: { [key]: { recentAnswers: [false], dueAt: 123 } } };
    const history = JSON.stringify(ctx.gameState.srsData);
    expect(ctx.MyWordbooks.resolveWord(oldWord).meaning).toBe('修正後');
    expect(ctx.GameUtils.getWordKey(ctx.MyWordbooks.resolveWord(oldWord), 'my', ctx.vocabularyDatabase)).toBe(key);
    expect(JSON.stringify(ctx.gameState.srsData)).toBe(history);
    const standardWord = ctx.vocabularyDatabase.junior[0];
    expect(ctx.MyWordbooks.resolveWord(standardWord)).toBe(standardWord);
});

test('マイ単語帳：前方一致・別品詞候補・自作語検証と固定キーを維持', () => {
    const ctx = runtime();
    expect(ctx.MyWordbooks.getSuggestions('AP').map(item => item.word.word)).toEqual(['apple']);
    expect(ctx.MyWordbooks.getSuggestions('ppl')).toEqual([]);
    expect(ctx.MyWordbooks.matchInput('attribute').ambiguousKeys.length).toBe(2);
    const valid = [
        { id: 'custom-a', word: ' quux-study ', pos: '名', meaning: ' 自分の意味 ' },
        { id: 'custom-b', word: 'quux-study', pos: '動', meaning: '動作' },
    ];
    ctx.gameState = { myCustomWords: ctx.MyWordbooks.normalizeCustomWords([...valid,
        { id: 'custom-a', word: 'duplicate', pos: '名', meaning: '重複' },
        { id: 'bad-pos', word: 'bad', pos: '<script>', meaning: '不正品詞' },
        { id: 'blank', word: 'blank', pos: '名', meaning: ' ' },
        { id: 'long', word: 'a'.repeat(121), pos: '名', meaning: '長過ぎる単語' }]) };
    expect(ctx.gameState.myCustomWords.length).toBe(2);
    const matches = ctx.MyWordbooks.matchInput('QUUX-STUDY');
    expect(matches.keys).toEqual([ctx.MyWordbooks.customKey('custom-a'), ctx.MyWordbooks.customKey('custom-b')]);
    expect(matches.ambiguousKeys.length).toBe(2);
    const code = fs.readFileSync(path.join(__dirname, '../js/game_logic.js'), 'utf8');
    vm.runInContext(code.slice(code.indexOf('function awardReviewScore('), code.indexOf('function updateSrsForWord(')), ctx);
    ctx.isScheduledReviewQuestion = () => true;
    expect(ctx.awardReviewScore(matches.keys[0], true, 1)).toBe(0);
});

test('マイ単語帳：CSV・TSVは引用符・カンマ・改行・熟語・ヘッダー・列割当てを保持', () => {
    const api = runtime().MyWordbooks;
    const source = api.parseImportTable('\uFEFFword,meaning,pos\r\napple,"りんご,果物",n.\r\nlook after,"世話をする\r\n気にかける",verb\r\nquux,"""本人の訳""",その他');
    expect(source).toMatchObject({ separator: 'comma', header: true, mapping: { word: 0, meaning: 1, pos: 2 } });
    expect(api.mappedImportRows(source, source.mapping)).toEqual([
        { word: 'apple', meaning: 'りんご,果物', pos: '名', posText: 'n.' },
        { word: 'look after', meaning: '世話をする\n気にかける', pos: '動', posText: 'verb' },
        { word: 'quux', meaning: '"本人の訳"', pos: 'other', posText: 'その他' },
    ]);
    const reordered = api.parseImportTable('意味\t品詞\t単語\tタグ\n本人の訳\t名詞\tquux\ttag');
    expect(reordered.mapping).toEqual({ word: 2, meaning: 0, pos: 1 });
    expect(api.mappedImportRows(reordered, reordered.mapping)[0]).toMatchObject({ word: 'quux', meaning: '本人の訳', pos: '名' });
    const anki = api.parseImportTable('#separator:Tab\n#columns:Front\tBack\tTags\nquux\t独自の訳\tmy-tag');
    expect(anki).toMatchObject({ separator: 'tab', header: false, mapping: { word: 0, meaning: 1, pos: -1 } });
    expect(api.mappedImportRows(anki, anki.mapping)[0]).toMatchObject({ word: 'quux', meaning: '独自の訳', pos: '' });
    expect(api.parseImportTable('quux;独自の訳;名').separator).toBe('semicolon');
});

test('マイ単語帳：表の破損・列重複・長さ・行上限は切捨てず拒否し完全重複だけをまとめる', () => {
    const api = runtime().MyWordbooks;
    expect(() => api.parseImportTable('quux,"未閉じ')).toThrow('引用符');
    expect(() => api.parseImportTable('quux,"訳"extra')).toThrow('引用符');
    expect(() => api.parseImportTable('quux 意味')).toThrow('区切って');
    const source = api.parseImportTable('quux,本人の訳\nQUUX,本人の訳');
    expect(api.mappedImportRows(source, source.mapping)).toHaveLength(1);
    expect(() => api.mappedImportRows(source, { word: 0, meaning: 0, pos: -1 })).toThrow('別々の列');
    const long = api.parseImportTable(`quux,${'訳'.repeat(501)}`);
    expect(() => api.mappedImportRows(long, long.mapping)).toThrow('500字');
    const rows = api.parseImportTable(Array.from({ length: 501 }, (_, i) => `word-${i},訳`).join('\n'));
    expect(() => api.mappedImportRows(rows, rows.mapping)).toThrow('500行');
});

test('マイ単語帳：表の品詞を照合し曖昧候補・統合キー・自作語の別品詞を維持', () => {
    const ctx = runtime(), api = ctx.MyWordbooks;
    const result = api.matchImportRows([{ word: 'attribute', meaning: '自分の訳', pos: '', posText: '' }]);
    expect(result.keys).toHaveLength(2);
    expect(result.ambiguousKeys).toEqual(result.keys);
    const one = api.matchImportRows([{ word: 'attribute', meaning: '自分の訳', pos: '動', posText: '動詞' }]);
    expect(one.keys).toHaveLength(1); expect(one.ambiguousKeys).toEqual([]);
    const merged = { word: 'attribute', pos: '名', __groupKey: 'word-v2:basic:attribute:merged',
        senses: [{ pos: '名', meaning: '属性' }, { pos: '動', meaning: '〜に帰する' }] };
    const database = { junior: [], basic: [merged], daily: [], exam1: [] };
    const combined = api.matchImportRows([{ word: 'attribute', meaning: '属性の訳', pos: '名', posText: '名詞' },
        { word: 'attribute', meaning: '帰するの訳', pos: '動', posText: '動詞' }], database);
    expect(combined.keys).toEqual([merged.__groupKey]);
    expect(api.importedMeaning(combined, merged.__groupKey)).toBe('');
    const tooLong = api.matchImportRows([{ word: 'attribute', meaning: 'あ'.repeat(300), pos: '名' },
        { word: 'attribute', meaning: 'い'.repeat(300), pos: '動' }], database);
    expect(api.importedMeaning(tooLong, merged.__groupKey)).toBe('');
    ctx.gameState = { myCustomWords: [{ id: 'custom-a', word: 'quux', meaning: '名詞', pos: '名' }] };
    expect(api.matchImportRows([{ word: 'quux', meaning: '動詞', pos: '動', posText: '動詞' }]).pendingRows).toHaveLength(1);
    const conflict = api.matchImportRows([{ word: 'apple', meaning: '訳1' }, { word: 'apple', meaning: '訳2' }]);
    expect(api.importedMeaning(conflict, conflict.keys[0])).toBe('');
});

test('マイ単語帳：一括保存案は重複を除き別品詞を分け、共有定義・メモ・元データを変更しない', () => {
    const ctx = runtime(), api = ctx.MyWordbooks;
    ctx.gameState = { myCustomWords: [{ id: 'custom-a', word: 'quux', meaning: '元の訳', pos: '名' }] };
    const key = api.customKey('custom-a');
    const book = { id: 'a', name: 'A', wordKeys: [key], wordNotes: { [key]: { memo: '既存メモ', meaning: '旧訳' } } };
    const before = JSON.stringify([book, ctx.gameState.myCustomWords]);
    const records = [{ word: 'quux', meaning: '新しい本人の訳', pos: '名', selected: true },
        { word: 'QUUX', meaning: '新しい本人の訳', pos: '名', selected: true },
        { word: 'quux', meaning: '動作', pos: '動', selected: true },
        { word: '', meaning: '', pos: '', selected: false }];
    const plan = api.planBulkImport(book, records);
    expect(plan.count).toBe(2); expect(plan.customWords).toHaveLength(2);
    expect(plan.book.wordKeys).toHaveLength(2);
    expect(plan.book.wordNotes[key]).toEqual({ meaning: '旧訳', memo: '既存メモ' });
    expect(plan.customWords[1].meaning).toBe('動作');
    expect(plan.book.wordNotes[api.customKey(plan.customWords[1].id)]).toBeUndefined();
    expect(plan.customWords[0].meaning).toBe('元の訳');
    expect(JSON.stringify([book, ctx.gameState.myCustomWords])).toBe(before);
    expect(() => api.planBulkImport(book, [...records, { word: 'missing', meaning: '', pos: '名', selected: true }])).toThrow('意味');
    expect(() => api.planBulkImport(book, [{ word: 'apple', meaning: '自作', pos: '名', selected: true }])).toThrow('元のカード');
    expect(() => api.planBulkImport(book, [records[0], { ...records[0], meaning: '別の訳' }])).toThrow('異なる意味');
    expect(() => api.planBulkImport(book, Array.from({ length: 501 }, () => records[0]))).toThrow('500語');
    expect(JSON.stringify([book, ctx.gameState.myCustomWords])).toBe(before);
});
