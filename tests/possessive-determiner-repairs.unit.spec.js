const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const batch = require('../docs/vocabulary-changes/2026-09-09-phrase-pos-batch-04.json');

test('第4回26行は記録どおりで原データ・参照・統合キーと履歴を維持する', () => {
  const ctx = vm.createContext({ window: {} });
  for (const file of ['js/utils.js', 'js/word_grouping.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  const after = JSON.parse(JSON.stringify(vm.runInContext(fs.readFileSync('data/vocabulary.js', 'utf8') + ';DEFAULT_VOCABULARY', ctx)));
  const before = JSON.parse(JSON.stringify(after));
  expect(batch.changes).toHaveLength(26);
  expect(new Set(batch.changes.map(c => c.after.word)).size).toBe(22);
  for (const c of batch.changes) {
    expect(after[c.level][c.index]).toEqual(c.after);
    expect(c.after.word).toBe(c.before.word);
    if (c.after.pos !== c.before.pos) expect(c.after.legacyKeyPos).toBe(c.before.pos);
    before[c.level][c.index] = c.before;
  }
  const { GameUtils: utils, WordGrouping: grouping } = ctx.window;
  const keys = db => Object.entries(db).flatMap(([level, rows]) => rows.map(row => utils.getWordKey(row, level, db)));
  expect(keys(after)).toEqual(keys(before));
  const old = grouping.build(before, utils), updated = grouping.build(after, utils);
  expect(keys(updated.database)).toEqual(keys(old.database));
  const affected = new Set(batch.changes.map(c => c.after.word));
  const changedKeys = Object.entries(updated.database).flatMap(([level, rows]) => rows.filter(r => affected.has(r.word)).map(r => utils.getWordKey(r, level, updated.database)));
  const state = { wordGroupingVersion: 1, points: 456, wordStates: {}, srsData: {}, learnedWordIntervals: {} };
  for (const key of changedKeys) {
    state.wordStates[key] = 'weak';
    state.srsData[key] = { recentAnswers: [false, true], dueAt: 123 };
    state.learnedWordIntervals[key] = 7;
  }
  const saved = JSON.stringify(state);
  grouping.resetMergedHistory(state, updated, 1);
  expect(JSON.stringify(state)).toBe(saved);
  expect(Object.values(after).flat().filter(r => r.pos === '冠').map(r => r.word).sort()).toEqual(['a', 'an', 'the']);
  expect(after.basic.filter(r => r.word === 'latter').some(r => r.pos === '副')).toBe(false);
  expect(after.junior.filter(r => r.word === 'its').every(r => r.pos === '代' && r.meaning.includes('所有格'))).toBe(true);
});
