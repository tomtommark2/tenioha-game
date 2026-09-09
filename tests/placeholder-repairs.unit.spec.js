const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const batches = [
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-01.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-02.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-03.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-04.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-05.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-06.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-07.json'),
  require('../docs/vocabulary-changes/2026-09-09-placeholder-batch-08.json'),
];
const changes = batches.flatMap(batch => batch.changes);

test('仮例文修復414行の内容・全キー・実行時の残件0件を検証する', () => {
  const ctx = vm.createContext({ window: {} });
  for (const file of ['js/utils.js', 'js/word_grouping.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  const after = JSON.parse(JSON.stringify(vm.runInContext(fs.readFileSync('data/vocabulary.js', 'utf8') + ';DEFAULT_VOCABULARY', ctx)));
  const before = JSON.parse(JSON.stringify(after));
  expect(batches.map(batch => batch.changes.length)).toEqual([51, 36, 59, 57, 55, 51, 50, 55]);
  expect(new Set(changes.map(c => c.after.word)).size).toBe(365);
  for (const c of changes) {
    expect(after[c.level][c.index]).toEqual(c.after);
    const fields = ['galaxy', 'adolescent', 'pesticide', 'beverage'].includes(c.after.word) && c.level === 'selection1900' ? ['example', 'meaning', 'phrase'] : ['example', 'phrase'];
    expect(Object.keys(c.after).filter(k => c.after[k] !== c.before[k]).sort()).toEqual(fields);
    expect(c.after.example).not.toBe(c.after.word + ' example.');
    before[c.level][c.index] = c.before;
  }
  const utils = ctx.window.GameUtils, grouping = ctx.window.WordGrouping;
  const keys = db => Object.entries(db).flatMap(([level, rows]) => rows.map(row => utils.getWordKey(row, level, db)));
  expect(keys(after)).toEqual(keys(before));
  expect(keys(grouping.build(after, utils).database)).toEqual(keys(grouping.build(before, utils).database));
  const source = fs.readFileSync('js/game_logic.js', 'utf8');
  vm.runInContext(source.slice(source.indexOf('function resolveReferencedVocabularyWord('), source.indexOf('\nfunction loadVocabularyForLevel(')), ctx);
  for (const [db, count] of [[before, 414], [after, 0]]) {
    ctx.vocabularyDatabase = grouping.build(db, utils).database;
    const placeholders = Object.entries(db).flatMap(([level, rows]) => rows.filter(r => r.example === r.word + ' example.').map(row => ({ level, row })));
    expect(placeholders).toHaveLength(count);
    expect(placeholders.every(r => !r.row.ref)).toBe(true);
    expect(placeholders.every(({ level, row }) => ctx.resolveReferencedVocabularyWord(row, level).example === row.example)).toBe(true);
  }
  const remaining = Object.entries(after).flatMap(([level, rows]) => rows.map((row, index) => ({ level, index, row })))
    .filter(({ row }) => row.example === row.word + ' example.')
    .map(({ level, index, row }) => ({ level, index, word: row.word, pos: row.pos, id: row.id }));
  const report = require('../docs/placeholder-example-status-2026-09-09.json');
  expect(report.remaining).toEqual(remaining);
  expect(report.after.rows).toBe(remaining.length);
  expect(report.after.uniqueWords).toBe(new Set(remaining.map(row => row.word)).size);
});
