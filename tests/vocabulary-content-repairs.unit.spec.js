const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const batch = require('../docs/vocabulary-changes/2026-09-08-batch-01.json');

function loadVocabulary() {
    const context = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../data/vocabulary.js'), 'utf8') +
        '\n;globalThis.database = DEFAULT_VOCABULARY;', context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8'), context);
    return { database: JSON.parse(JSON.stringify(context.database)), utils: context.window.GameUtils };
}

test('語彙修復の変更記録と実データが一致し、表示内容以外を変更しない', () => {
    const { database } = loadVocabulary();
    expect(batch.changes).toHaveLength(8);
    for (const { level, index, before, after } of batch.changes) {
        expect(database[level][index]).toEqual(after);
        const changed = Object.keys(after).filter(key => after[key] !== before[key]);
        expect(changed.length).toBeGreaterThan(0);
        expect(changed.every(key => ['meaning', 'phrase', 'example'].includes(key))).toBe(true);
        expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
    }
});

test('語彙修復前後で参照語を含む全行の学習キーが維持される', () => {
    const { database, utils } = loadVocabulary();
    const beforeDatabase = JSON.parse(JSON.stringify(database));
    for (const change of batch.changes) {
        beforeDatabase[change.level][change.index] = change.before;
    }
    const keys = db => Object.entries(db).flatMap(([level, words]) =>
        words.map(word => utils.getWordKey(word, level, db)));
    expect(keys(database)).toEqual(keys(beforeDatabase));
});
