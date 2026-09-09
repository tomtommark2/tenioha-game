const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const batch = require('../docs/vocabulary-changes/2026-09-09-phrase-pos-batch-03.json');

function load() {
  const context = vm.createContext({ window: {} });
  for (const file of ['js/utils.js', 'js/word_grouping.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  const after = JSON.parse(JSON.stringify(vm.runInContext(fs.readFileSync('data/vocabulary.js', 'utf8') + ';DEFAULT_VOCABULARY', context)));
  const before = JSON.parse(JSON.stringify(after));
  for (const c of batch.changes) before[c.level][c.index] = c.before;
  return { context, before, after, utils: context.window.GameUtils, grouping: context.window.WordGrouping };
}

test('3語6行の分類修復でも全原データ・参照・統合キーを維持する', () => {
  const { before, after, utils, grouping } = load();
  expect(batch.changes).toHaveLength(6);
  expect(batch.changes.filter(c => c.after.legacyKeyPos)).toHaveLength(4);
  for (const c of batch.changes) {
    expect(after[c.level][c.index]).toEqual(c.after);
    expect(c.after.word).toBe(c.before.word);
    if (c.after.pos !== c.before.pos) expect(c.after.legacyKeyPos).toBe(c.before.pos);
    expect(utils.resolveWordIdentity(c.after, c.level, after).pos).toBe(c.after.pos);
  }
  const keys = db => Object.entries(db).flatMap(([level, rows]) => rows.map(row => utils.getWordKey(row, level, db)));
  expect(keys(after)).toEqual(keys(before));
  expect(keys(grouping.build(after, utils).database)).toEqual(keys(grouping.build(before, utils).database));
  for (const c of batch.changes.filter(c => c.after.legacyKeyPos)) {
    const first = before[c.level].find(row => row.word === c.before.word);
    for (const pos of [undefined, 'unknown']) {
      const ref = { word: c.before.word, pos, ref: c.level };
      expect(utils.getWordKey(ref, 'book', after)).toBe(utils.getWordKey(first, c.level, before));
    }
  }
});

test('新しい品詞でフィルターでき、既存の統合履歴とクラウド圧縮後の状態を再リセットしない', () => {
  const { before, after, utils, grouping } = load();
  const old = grouping.build(before, utils);
  const updated = grouping.build(after, utils);
  const keys = ['lot', 'most', 'yeah'].map(word => old.groups.find(g => g.card.word === word).key);
  const state = { wordGroupingVersion: 1, points: 1234, reviewScore: { total: 77, pendingEvents: [{ eventId: 'keep' }] },
    wordStates: Object.fromEntries(keys.map(key => [key, 'weak'])),
    srsData: Object.fromEntries(keys.map(key => [key, { recentAnswers: [false, true], dueAt: 123, failCount: 1 }])),
    learnedWordIntervals: Object.fromEntries(keys.map(key => [key, 7])) };
  const context = vm.createContext({ console });
  const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
  vm.runInContext(source.slice(source.indexOf('function buildCloudSaveData('), source.indexOf('\nfunction hasCloudSaveData(')), context);
  const restored = JSON.parse(context.buildCloudSaveData(JSON.stringify(state)));
  grouping.resetMergedHistory(restored, updated, restored.wordGroupingVersion);
  expect(restored.wordStates).toEqual(state.wordStates);
  expect(restored.srsData).toEqual(state.srsData);
  expect(restored.learnedWordIntervals).toEqual(state.learnedWordIntervals);
  expect(restored.points).toBe(1234);
  expect(restored.reviewScore.total).toBe(77);
  expect(updated.groups.find(g => g.card.word === 'lot').card.senses.every(s => s.pos === '名')).toBe(true);
  expect(updated.groups.find(g => g.card.word === 'most').card.senses.some(s => s.pos === '冠')).toBe(false);
  expect(updated.groups.find(g => g.card.word === 'yeah').card.senses.every(s => s.pos === '副')).toBe(true);
});

test('品詞修復後も旧品詞に対応するIPAを失わない', () => {
  const { context, before, after } = load();
  const source = fs.readFileSync('js/game_logic.js', 'utf8');
  vm.runInContext(source.slice(source.indexOf('function applyIpaOverrides('), source.indexOf('\napplyIpaOverrides(vocabularyDatabase')), context);
  vm.runInContext(fs.readFileSync('data/ipa_overrides.js', 'utf8'), context);
  context.applyIpaOverrides(before, context.window.IPA_OVERRIDES);
  context.applyIpaOverrides(after, context.window.IPA_OVERRIDES);
  for (const c of batch.changes) expect(after[c.level][c.index].ipa).toBe(before[c.level][c.index].ipa);
});
