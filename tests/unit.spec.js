const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScriptIntoContext(filePath, context) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: filePath });
}

test('StatsEngine.getPerfectCountsByCEFR: perfect-onlyで集計される', async () => {
  const ctx = vm.createContext({ console, self: {}, localStorage: { getItem: () => null } });
  ctx.window = ctx.self;
  loadScriptIntoContext(path.resolve(__dirname, '../js/utils.js'), ctx);
  const file = path.resolve(__dirname, '../js/stats_engine.js');
  loadScriptIntoContext(file, ctx);

  const vocabularyDatabase = {
    junior: [{ word: 'a', pos: '名' }, { word: 'b', pos: '動' }],
    basic: [{ word: 'c', pos: '名' }],
    daily: [{ word: 'd', pos: '形' }],
    exam1: [{ word: 'e', pos: '副' }],
  };

  const gameState = {
    wordStates: {}
  };
  gameState.wordStates[ctx.self.GameUtils.getWordKey(vocabularyDatabase.junior[0], 'junior', vocabularyDatabase)] = 'perfect';
  gameState.wordStates[ctx.self.GameUtils.getWordKey(vocabularyDatabase.junior[1], 'junior', vocabularyDatabase)] = 'learned';
  gameState.wordStates[ctx.self.GameUtils.getWordKey(vocabularyDatabase.basic[0], 'basic', vocabularyDatabase)] = 'perfect';
  gameState.wordStates[ctx.self.GameUtils.getWordKey(vocabularyDatabase.daily[0], 'daily', vocabularyDatabase)] = 'weak';
  gameState.wordStates[ctx.self.GameUtils.getWordKey(vocabularyDatabase.exam1[0], 'exam1', vocabularyDatabase)] = 'perfect';

  const result = ctx.self.StatsEngine.getPerfectCountsByCEFR(gameState, vocabularyDatabase);
  expect(result).toEqual({ A1: 1, A2: 1, B1: 0, B2: 1, total: 3 });
});

test('GameUtils.getWordKey: 同じ綴りでも品詞を区別し、参照語は基底語と共有する', async () => {
  const ctx = vm.createContext({ console, self: {}, localStorage: { getItem: () => null } });
  ctx.window = ctx.self;
  loadScriptIntoContext(path.resolve(__dirname, '../js/utils.js'), ctx);

  const database = {
    exam1: [
      { word: 'attribute', pos: '名' },
      { word: 'attribute', pos: '動' },
    ],
    selection1900: [
      { word: 'attribute', pos: 'unknown', ref: 'exam1:attribute' },
    ],
  };
  const nounKey = ctx.self.GameUtils.getWordKey(database.exam1[0], 'exam1', database);
  const verbKey = ctx.self.GameUtils.getWordKey(database.exam1[1], 'exam1', database);
  const selectionKey = ctx.self.GameUtils.getWordKey(database.selection1900[0], 'selection1900', database);

  expect(nounKey).not.toBe(verbKey);
  expect(selectionKey).toBe(nounKey);
});

test('ChartDataAdapter.buildMonthlyStats: 履歴+当日スナップショットを構築できる', async () => {
  const ctx = vm.createContext({ console, self: {}, localStorage: { getItem: () => null } });
  ctx.window = ctx.self;

  loadScriptIntoContext(path.resolve(__dirname, '../js/utils.js'), ctx);
  loadScriptIntoContext(path.resolve(__dirname, '../js/stats_engine.js'), ctx);
  loadScriptIntoContext(path.resolve(__dirname, '../js/chart_data_adapter.js'), ctx);

  // expose globals expected by adapter
  ctx.window = ctx.self;

  const vDB = {
    junior: [{ word: 'a', pos: '名' }],
    basic: [{ word: 'b', pos: '名' }],
    daily: [{ word: 'c', pos: '名' }],
    exam1: [{ word: 'd', pos: '名' }],
  };
  const gs = {
    wordStates: {},
    dailyHistory: [
      { date: '2026-02-01', total_learned: 2, cefr_breakdown: { A1: 1, A2: 1, B1: 0, B2: 0 } }
    ]
  };
  gs.wordStates[ctx.self.GameUtils.getWordKey(vDB.junior[0], 'junior', vDB)] = 'perfect';
  gs.wordStates[ctx.self.GameUtils.getWordKey(vDB.basic[0], 'basic', vDB)] = 'perfect';
  gs.wordStates[ctx.self.GameUtils.getWordKey(vDB.daily[0], 'daily', vDB)] = 'weak';
  gs.wordStates[ctx.self.GameUtils.getWordKey(vDB.exam1[0], 'exam1', vDB)] = 'perfect';

  const logMap = new Map();
  ctx.self.ChartDataAdapter.mergeLocalHistory(logMap, gs);
  const stats = ctx.self.ChartDataAdapter.buildMonthlyStats(logMap, gs, vDB);

  expect(stats.labels.length).toBe(30);
  expect(stats.datasets.total.length).toBe(30);

  // 今日の末尾データは perfect-only の 3 になるはず
  const last = stats.datasets.total[stats.datasets.total.length - 1];
  expect(last).toBe(3);
});
