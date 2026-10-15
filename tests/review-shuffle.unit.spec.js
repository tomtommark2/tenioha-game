const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../js/game_logic.js'), 'utf8');
const storageKey = 'vocabGame_reviewQueueShuffle_v1';
function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Missing source section: ${start}`);
  return source.slice(from, to);
}
function load(storage = new Map()) {
  const writes = [];
  const state = { currentLevel: 'basic', activeReviewLevels: ['basic'], posFilters: ['名', '動'],
    currentWord: { word: 'A', key: 'A' }, isReviewWord: true,
    reviewQueueShuffleOrder: [], reviewQueueWasShuffled: false };
  const context = { console: { warn() {} }, gameState: state, window: { isDirty: false },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { storage.set(key, value); writes.push(['set', key, value]); },
      removeItem: key => { storage.delete(key); writes.push(['remove', key]); }
    },
    Math: Object.assign(Object.create(Math), { random: () => 0 }),
    getWordKeySafe: word => word.key,
    updateReviewQueueBadge() {}, updateReviewProgressUI() {}, showReviewShuffleStatus: text => { context.status = text; },
    saveGame: () => { throw new Error('Shuffle must not request a learning/cloud save'); }
  };
  vm.createContext(context);
  vm.runInContext(section('const REVIEW_QUEUE_SHUFFLE_STORAGE_KEY', '\nfunction showReviewShuffleStatus(')
    + section('window.shuffleReviewQueue = function', '\nfunction getCurrentReviewStats(')
    + section('function createShuffledDeck(', '\nfunction getWordFromDeck('), context);
  context.items = ['A', 'B', 'C', 'D'].map(key => ({ key, word: { key, word: key } }));
  context.buildReviewQueueSnapshot = () => ({ dueWords: context.applyReviewQueueShuffleOrder(context.items).map(item => item.word) });
  return { context, state, storage, writes };
}
const order = context => Array.from(context.gameState.reviewQueueShuffleOrder);

test('復習シャッフル：同じ並び順を別の起動で復元し、現在語と学習保存を変更しない', () => {
  const first = load();
  first.context.window.shuffleReviewQueue();
  const savedOrder = order(first.context);
  expect(savedOrder[0]).toBe('A');
  expect(savedOrder).not.toEqual(['A', 'B', 'C', 'D']);
  expect(first.state.currentWord.word).toBe('A');
  expect(first.context.window.isDirty).toBe(false);
  expect(first.writes).toHaveLength(1);
  expect(first.writes[0][1]).toBe(storageKey);
  expect(Object.keys(JSON.parse(first.storage.get(storageKey))).sort()).toEqual(['order', 'scope']);
  const second = load(first.storage);
  second.context.restoreReviewQueueShuffleOrder();
  expect(second.context.buildReviewQueueSnapshot().dueWords.map(word => word.word)).toEqual(savedOrder);
  expect(second.state.reviewQueueWasShuffled).toBe(true);
  expect(second.writes).toHaveLength(0);
});

test('復習シャッフル：完了語を除き、新たな期限到来語だけ末尾へ加えて保存する', () => {
  const first = load();
  first.context.window.shuffleReviewQueue();
  const before = order(first.context);
  first.context.items = first.context.items.filter(item => item.key !== 'A');
  first.context.items.push({ key: 'E', word: { key: 'E', word: 'E' } });
  const remaining = first.context.buildReviewQueueSnapshot().dueWords.map(word => word.key);
  expect(remaining).toEqual([...before.filter(key => key !== 'A'), 'E']);
  const second = load(first.storage);
  second.context.items = first.context.items;
  second.context.restoreReviewQueueShuffleOrder();
  expect(second.context.buildReviewQueueSnapshot().dueWords.map(word => word.key)).toEqual(remaining);
  expect(second.writes).toHaveLength(0);
});

test('復習シャッフル：同じ画面更新で端末へ繰り返し書き込まない', () => {
  const { context, writes } = load();
  context.window.shuffleReviewQueue();
  for (let n = 0; n < 10; n++) context.buildReviewQueueSnapshot();
  expect(writes).toHaveLength(1);
});

test('復習シャッフル：対象範囲・品詞・別の冊へ古い順番を適用しない', () => {
  const original = load();
  original.context.window.shuffleReviewQueue();
  for (const changes of [
    { activeReviewLevels: ['junior'] }, { posFilters: ['名'] },
    { currentLevel: 'illustrated' }, { currentLevel: 'my', activeMyWordbookId: 'book-1' }
  ]) {
    const restored = load(original.storage);
    Object.assign(restored.state, changes);
    restored.context.restoreReviewQueueShuffleOrder();
    expect(order(restored.context)).toEqual([]);
    expect(restored.state.reviewQueueWasShuffled).toBe(false);
  }
  original.state.currentLevel = 'my';
  original.state.activeMyWordbookId = 'book-1';
  original.context.persistReviewQueueShuffleOrder();
  const anotherBook = load(original.storage);
  Object.assign(anotherBook.state, { currentLevel: 'my', activeMyWordbookId: 'book-2' });
  anotherBook.context.restoreReviewQueueShuffleOrder();
  expect(order(anotherBook.context)).toEqual([]);
});

test('復習シャッフル：古いデータがなくても通常順を維持し、不正な保存を安全に無視する', () => {
  for (const raw of [null, '{broken', 'null', '[]', '{}']) {
    const storage = new Map(raw ? [[storageKey, raw]] : []);
    const { context, state } = load(storage);
    expect(() => context.restoreReviewQueueShuffleOrder()).not.toThrow();
    expect(context.buildReviewQueueSnapshot().dueWords.map(word => word.key)).toEqual(['A', 'B', 'C', 'D']);
    expect(state.reviewQueueWasShuffled).toBe(false);
  }
  const { context, storage } = load();
  storage.set(storageKey, JSON.stringify({ scope: context.getReviewQueueShuffleScope(), order: ['C', null, 'C', '', 7, 'missing', 'A'] }));
  context.restoreReviewQueueShuffleOrder();
  expect(context.buildReviewQueueSnapshot().dueWords.map(word => word.key)).toEqual(['C', 'A', 'B', 'D']);
});

test('復習シャッフル：起動中に別の復習範囲へ移った場合も保存順を解除する', () => {
  const { context, state, storage } = load();
  context.window.shuffleReviewQueue();
  state.currentLevel = 'illustrated';
  expect(context.buildReviewQueueSnapshot().dueWords.map(word => word.key)).toEqual(['A', 'B', 'C', 'D']);
  expect(storage.has(storageKey)).toBe(false);
  expect(state.reviewQueueWasShuffled).toBe(false);
});

test('復習シャッフル：端末保存に失敗したら順番を戻し、保存成功と表示しない', () => {
  const { context, state, storage } = load();
  context.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  context.window.shuffleReviewQueue();
  expect(order(context)).toEqual([]);
  expect(state.reviewQueueWasShuffled).toBe(false);
  expect(storage.has(storageKey)).toBe(false);
  expect(context.status).toBe('並び順を保存できませんでした');
  expect(state.currentWord.word).toBe('A');
});

test('復習シャッフル：対象が空またはリセットされたら保存順を解除する', () => {
  const { context, state, storage } = load();
  context.window.shuffleReviewQueue();
  context.items = [];
  expect(context.buildReviewQueueSnapshot().dueWords).toHaveLength(0);
  expect(storage.has(storageKey)).toBe(false);
  expect(state.reviewQueueWasShuffled).toBe(false);
  context.items = ['A', 'B', 'C'].map(key => ({ key, word: { key } }));
  context.window.shuffleReviewQueue();
  context.resetReviewQueueShuffleOrder();
  expect(storage.has(storageKey)).toBe(false);
});

test('復習シャッフル：復元は初期化後、リセットはログアウト時に実行し通常セーブに含めない', () => {
  const initialize = section('function init() {', '\nfunction ensureReviewScoreState(');
  expect(initialize.indexOf('restoreReviewQueueShuffleOrder();')).toBeGreaterThan(initialize.indexOf('restoreLastLevelPreference();'));
  expect(section('window.resetGameData = function', '\nfunction startPlayTimeCounter(')).toContain('resetReviewQueueShuffleOrder();');
  const save = section('function buildLocalSaveData()', '\nfunction saveGame()');
  expect(save).not.toContain('reviewQueueShuffle');
});
