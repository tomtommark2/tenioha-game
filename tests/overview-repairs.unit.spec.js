const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const batch = require('../docs/vocabulary-changes/2026-09-09-overview-batch-01.json');

function load() {
  const ctx = vm.createContext({ window: {} });
  for (const file of ['js/utils.js', 'js/word_grouping.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  const after = JSON.parse(JSON.stringify(vm.runInContext(fs.readFileSync('data/vocabulary.js', 'utf8') + ';DEFAULT_VOCABULARY', ctx)));
  const before = JSON.parse(JSON.stringify(after));
  for (const [level, length] of Object.entries(batch.beforeLengths)) before[level] = before[level].slice(0, length);
  for (const c of batch.changes) before[c.level][c.index] = c.before;
  return { ctx, after, before, utils: ctx.window.GameUtils, grouping: ctx.window.WordGrouping };
}

test('全体点検の7行修復と7語追加だけを適用し、既存キー・参照・用法を保持する', () => {
  const { after, before, utils, grouping } = load();
  expect(batch.changes).toHaveLength(7);
  expect(batch.additions).toHaveLength(7);
  for (const c of batch.changes) {
    expect(after[c.level][c.index]).toEqual(c.after);
    expect(Object.keys(c.after).filter(k => c.after[k] !== c.before[k]).sort()).toEqual(['example', 'phrase']);
  }
  for (const a of batch.additions) {
    expect(after[a.level][a.index]).toEqual(a.after);
    expect(before[a.level].some(r => r.word === a.after.word)).toBe(false);
    const separator = a.source.lastIndexOf(':');
    const file = a.source.slice(0, separator), line = Number(a.source.slice(separator + 1));
    expect(fs.readFileSync(file, 'utf8').split(/\r?\n/)[line - 1]).toMatch(new RegExp('^' + a.after.word + ',' + (a.after.pos === '名' ? 'noun' : 'adjective') + ','));
  }
  const oldGrouped = grouping.build(before, utils), newGrouped = grouping.build(after, utils);
  const keys = db => new Set(Object.entries(db).flatMap(([level, rows]) => rows.map(r => utils.getWordKey(r, level, db))));
  const addedKeys = batch.additions.map(a => utils.getWordKey(a.after, a.level, after));
  for (const [oldDB, newDB] of [[before, after], [oldGrouped.database, newGrouped.database]]) {
    const oldKeys = keys(oldDB), newKeys = keys(newDB);
    expect([...oldKeys].every(key => newKeys.has(key))).toBe(true);
    expect([...newKeys].filter(key => !oldKeys.has(key)).sort()).toEqual(addedKeys.slice().sort());
    for (const [level, rows] of Object.entries(oldDB)) {
      expect(newDB[level].length).toBe(rows.length + batch.additions.filter(a => a.level === level).length);
      // Explicitly relocated cards are appended after the level's original rows.
      const retainedKeys = newDB[level].map(r => utils.getWordKey(r, level, newDB)).filter(key => !addedKeys.includes(key));
      expect(retainedKeys).toEqual(rows.map(r => utils.getWordKey(r, level, oldDB)));
    }
  }
  const allowed = new Set(require('../functions/review_word_hashes.json'));
  expect(allowed.size).toBe(10726);
  for (const key of keys(newGrouped.database)) expect(allowed.has(crypto.createHash('sha256').update(key).digest('hex').slice(0, 40))).toBe(true);
  expect(newGrouped.groups.map(g => g.key)).toEqual(oldGrouped.groups.map(g => g.key));
  expect([...newGrouped.oldKeys].sort()).toEqual([...oldGrouped.oldKeys].sort());
  const expensiveKeys = ['junior', 'selection1400', 'sys_2000'].map(level => utils.getWordKey(after[level].find(r => r.word === 'expensive'), level, after));
  expect(new Set(expensiveKeys).size).toBe(3);
});

test('修正の参照伝播・仮例文0件・既存履歴のクラウド往復を検証する', () => {
  const { ctx, after, before, utils, grouping } = load();
  const old = grouping.build(before, utils), updated = grouping.build(after, utils);
  ctx.vocabularyDatabase = updated.database;
  const logic = fs.readFileSync('js/game_logic.js', 'utf8');
  vm.runInContext(logic.slice(logic.indexOf('function resolveReferencedVocabularyWord('), logic.indexOf('\nfunction loadVocabularyForLevel(')), ctx);
  let changedOccurrences = 0;
  for (const [level, rows] of Object.entries(updated.database)) for (const row of rows) {
    const resolved = ctx.resolveReferencedVocabularyWord(row, level);
    for (const sense of resolved.senses || [resolved]) {
      expect(sense.example).not.toBe(sense.word + ' example.');
      expect(sense.meaning).toBeTruthy(); expect(sense.phrase).toBeTruthy(); expect(sense.example).toBeTruthy();
      for (const c of batch.changes) if (sense.word === c.after.word && (sense.__sourceLevel || level) === c.level && sense.pos === c.after.pos && sense.meaning === c.after.meaning) {
        // A word may intentionally have other senses with the same meaning, so match the changed phrase/example as a pair.
        if (sense.phrase === c.after.phrase && sense.example === c.after.example) changedOccurrences++;
      }
    }
  }
  expect(changedOccurrences).toBeGreaterThanOrEqual(7);
  const oldKeys = [...new Set(Object.entries(old.database).flatMap(([level, rows]) => rows.map(r => utils.getWordKey(r, level, old.database))))];
  const state = { wordGroupingVersion: 1, points: 1234, reviewScore: { total: 99, pendingEvents: [] },
    wordStates: Object.fromEntries(oldKeys.map(k => [k, 'weak'])),
    srsData: Object.fromEntries(oldKeys.map(k => [k, { recentAnswers: [false, true], successCount: 1, failCount: 1, dueAt: 123, scheduledIntervalDays: 1 }])),
    learnedWordIntervals: Object.fromEntries(oldKeys.map(k => [k, 7])) };
  const cloud = vm.createContext({});
  const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
  vm.runInContext(source.slice(source.indexOf('function buildCloudSaveData('), source.indexOf('\nfunction hasCloudSaveData(')), cloud);
  const restored = JSON.parse(cloud.buildCloudSaveData(JSON.stringify(state)));
  grouping.resetMergedHistory(restored, updated, restored.wordGroupingVersion);
  expect(restored.wordStates).toEqual(state.wordStates);
  expect(restored.srsData).toEqual(state.srsData);
  expect(restored.learnedWordIntervals).toEqual(state.learnedWordIntervals);
  expect(restored.points).toBe(1234); expect(restored.reviewScore.total).toBe(99);
  for (const a of batch.additions) expect(restored.srsData[utils.getWordKey(a.after, a.level, after)]).toBeUndefined();
});
