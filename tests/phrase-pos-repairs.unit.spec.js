const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const batches = [
    { batch: require('../docs/vocabulary-changes/2026-09-09-phrase-pos-batch-01.json'), count: 24, words: 16 },
    { batch: require('../docs/vocabulary-changes/2026-09-09-phrase-pos-batch-02.json'), count: 89, words: 62 },
];

for (const { batch, count, words } of batches) {

test(`フレーズ品詞修復${count}用法の記録・表示フィールド・全学習キーを検証する`, () => {
    const context = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../data/vocabulary.js'), 'utf8') +
        ';globalThis.database = DEFAULT_VOCABULARY;', context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8'), context);
    const database = JSON.parse(JSON.stringify(context.database));
    const before = JSON.parse(JSON.stringify(database));
    expect(batch.changes).toHaveLength(count);
    expect(new Set(batch.changes.map(c => c.before.word)).size).toBe(words);
    for (const change of batch.changes) {
        expect(database[change.level][change.index]).toEqual(change.after);
        expect(Object.keys(change.after)).toEqual(Object.keys(change.before));
        const changed = Object.keys(change.after).filter(k => change.after[k] !== change.before[k]);
        expect(changed.length).toBeGreaterThan(0);
        expect(changed.every(k => ['meaning', 'phrase', 'example'].includes(k))).toBe(true);
        before[change.level][change.index] = change.before;
    }
    const keys = db => Object.entries(db).flatMap(([level, rows]) =>
        rows.map(row => context.window.GameUtils.getWordKey(row, level, db)));
    expect(keys(database)).toEqual(keys(before));
});
}
