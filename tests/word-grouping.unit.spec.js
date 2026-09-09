const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

function load() {
  const context = vm.createContext({ window: {} });
  for (const file of ['js/utils.js', 'js/word_grouping.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  const raw = vm.runInContext(fs.readFileSync('data/vocabulary.js', 'utf8') + ';DEFAULT_VOCABULARY', context);
  return { raw, utils: context.window.GameUtils, api: context.window.WordGrouping };
}

test('全CEFRの同綴りを初級側へ集約し、全用法・参照・サーバーキーを保持する', () => {
  const { raw, utils, api } = load();
  const before = JSON.stringify(raw);
  const grouping = api.build(raw, utils);
  const { database, groups } = grouping;
  expect(groups).toHaveLength(891);
  expect(JSON.stringify(raw)).toBe(before);
  const seen = new Set();
  let senses = 0;
  for (const level of api.LEVELS) {
    for (const word of database[level]) {
      expect(seen.has(word.word), word.word).toBe(false);
      seen.add(word.word);
      senses += word.senses?.length || 1;
      if (word.senses) {
        const firstLevel = api.LEVELS.find(source => raw[source].some(entry => entry.word === word.word));
        const first = raw[firstLevel].find(entry => entry.word === word.word);
        expect(level).toBe(first.studyLevel || firstLevel);
        for (const sense of word.senses) {
          const { __sourceLevel, ...data } = sense;
          expect(raw[__sourceLevel]).toContainEqual(data);
        }
      }
    }
  }
  expect(senses).toBe(api.LEVELS.reduce((sum, level) => sum + raw[level].length, 0));
  const allowed = new Set(JSON.parse(fs.readFileSync('functions/review_word_hashes.json', 'utf8')));
  for (const [level, words] of Object.entries(database)) for (const word of words) {
    const key = utils.getWordKey(word, level, database);
    expect(allowed.has(crypto.createHash('sha256').update(key).digest('hex').slice(0, 40)), key).toBe(true);
    if (word.senses) expect(groups.some(group => group.key === key)).toBe(true);
  }
  expect(database.junior.find(word => word.word === 'after').senses).toHaveLength(3);
  expect(database.basic.some(word => word.word === 'after')).toBe(false);
});

test('再配置16語とexcuseの入口変更は旧統合キー・全参照・クラウド履歴を維持する', () => {
  const { raw, utils, api } = load();
  const grouping = api.build(raw, utils);
  const batch = require('../docs/vocabulary-changes/2026-09-09-level-repair-01.json');
  const before = JSON.parse(JSON.stringify(raw));
  expect(batch.changes).toHaveLength(17);
  for (const change of batch.changes) {
    expect(raw[change.level][change.index]).toEqual(change.after);
    before[change.level][change.index] = change.before;
  }
  const old = api.build(before, utils);
  const allKeys = database => Object.entries(database).flatMap(([level, words]) => words.map(word => utils.getWordKey(word, level, database))).sort();
  expect(allKeys(grouping.database)).toEqual(allKeys(old.database));
  const changedWords = new Set(batch.changes.map(change => change.after.word));
  for (const [level, words] of Object.entries(old.database)) {
    expect(grouping.database[level].filter(word => !changedWords.has(word.word))).toEqual(words.filter(word => !changedWords.has(word.word)));
  }
  const targets = {
    basic: 'sheet shout shut since skate ski speed stamp taste tie tour trouble'.split(' '),
    daily: 'judge tax tent though'.split(' '),
    junior: ['excuse'],
  };
  const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
  const context = vm.createContext({ console });
  vm.runInContext(source.slice(source.indexOf('function buildCloudSaveData('), source.indexOf('\nfunction hasCloudSaveData(')), context);
  for (const [level, spellings] of Object.entries(targets)) for (const spelling of spellings) {
    const old = raw.junior.find(word => word.word === spelling);
    const key = utils.getWordKey(old, 'junior', raw);
    const cards = api.LEVELS.flatMap(level => grouping.database[level].filter(word => word.word === spelling));
    expect(cards).toHaveLength(1);
    expect(grouping.database[level]).toContain(cards[0]);
    expect(cards[0].__sourceLevel).toBe(level);
    expect(utils.getWordKey(cards[0], level, grouping.database)).toBe(key);
    const refs = Object.entries(grouping.database).flatMap(([category, words]) => words.filter(word => word.word === spelling && word.senses).map(word => utils.getWordKey(word, category, grouping.database)));
    expect(new Set(refs)).toEqual(new Set([key]));
    const saved = { wordGroupingVersion: 1, wordStates: { [key]: 'weak' }, srsData: { [key]: { recentAnswers: [false, true], dueAt: 123, failCount: 1, successCount: 1 } }, learnedWordIntervals: { [key]: 3, [`${key}_last`]: 100 }, points: 1234 };
    const restored = JSON.parse(context.buildCloudSaveData(JSON.stringify(saved)));
    api.resetMergedHistory(restored, grouping, restored.wordGroupingVersion);
    expect(restored.srsData[key]).toEqual(saved.srsData[key]);
    expect(restored.wordStates[key]).toBe('weak');
    expect(restored.learnedWordIntervals).toEqual(saved.learnedWordIntervals);
    expect(restored.points).toBe(1234);
  }
  expect(grouping.database.junior).toHaveLength(1098);
  const excuse = grouping.database.junior.find(word => word.word === 'excuse');
  expect(excuse.phrase).toBe('Excuse me');
  expect(excuse.senses[0].pos).toBe('動');
  expect(excuse.senses.some(sense => sense.meaning.includes('言い訳'))).toBe(true);
});

test('統合対象だけ旧履歴を削除し、再読込では新履歴・ポイントを維持する', () => {
  const { raw, utils, api } = load();
  const grouping = api.build(raw, utils);
  const key = grouping.groups.find(group => group.card.word === 'adult').key;
  const state = { wordStates: { keep: 'learned' }, srsData: { keep: { recentAnswers: [false, true], dueAt: 123 } }, learnedWordIntervals: { keep: 5 }, points: 1234, reviewScore: { total: 99, pendingEvents: [{ eventId: 'old-earned-score' }] } };
  for (const key of grouping.oldKeys) {
    state.wordStates[key] = 'perfect';
    state.srsData[key] = { recentAnswers: [true], dueAt: 10 };
    state.learnedWordIntervals[key] = 4;
    state.learnedWordIntervals[`${key}_last`] = 50;
  }
  api.resetMergedHistory(state, grouping, 0);
  expect(state.wordStates).toEqual({ keep: 'learned' });
  expect(state.srsData).toEqual({ keep: { recentAnswers: [false, true], dueAt: 123 } });
  expect(state.learnedWordIntervals).toEqual({ keep: 5 });
  expect(state.points).toBe(1234);
  expect(state.reviewScore).toEqual({ total: 99, pendingEvents: [{ eventId: 'old-earned-score' }] });
  state.wordStates[key] = 'weak';
  state.srsData[key] = { recentAnswers: [false], dueAt: 500 };
  const saved = JSON.parse(JSON.stringify(state));
  api.resetMergedHistory(saved, grouping, saved.wordGroupingVersion);
  expect(saved).toEqual(state);
});

test('クラウド圧縮・復元後にも統合バージョンと新履歴が残る', () => {
  const { raw, utils, api } = load();
  const grouping = api.build(raw, utils);
  const key = grouping.groups[0].key;
  const source = fs.readFileSync('js/firebase_app_v2.js', 'utf8');
  const context = vm.createContext({ console });
  vm.runInContext(source.slice(source.indexOf('function buildCloudSaveData('), source.indexOf('\nfunction hasCloudSaveData(')), context);
  const saved = { wordGroupingVersion: 1, wordStates: { [key]: 'weak' }, srsData: { [key]: { recentAnswers: [false], failCount: 1, dueAt: 123 } } };
  const restored = JSON.parse(context.buildCloudSaveData(JSON.stringify(saved)));
  api.resetMergedHistory(restored, grouping, restored.wordGroupingVersion);
  expect(restored.wordGroupingVersion).toBe(1);
  expect(restored.srsData[key]).toEqual(saved.srsData[key]);
});
