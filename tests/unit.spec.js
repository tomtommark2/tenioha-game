const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScriptIntoContext(filePath, context) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: filePath });
}

test('StatsEngine.getPerfectCountsByCEFR: perfect-onlyで集計される', async () => {
  const ctx = vm.createContext({ console, self: {} });
  const file = path.resolve(__dirname, '../js/stats_engine.js');
  loadScriptIntoContext(file, ctx);

  const vocabularyDatabase = {
    junior: [{ word: 'a' }, { word: 'b' }],
    basic: [{ word: 'c' }],
    daily: [{ word: 'd' }],
    exam1: [{ word: 'e' }],
  };

  const gameState = {
    wordStates: {
      junior_a: 'perfect',
      junior_b: 'learned',
      basic_c: 'perfect',
      daily_d: 'weak',
      exam1_e: 'perfect',
    }
  };

  const result = ctx.self.StatsEngine.getPerfectCountsByCEFR(gameState, vocabularyDatabase);
  expect(result).toEqual({ A1: 1, A2: 1, B1: 0, B2: 1, total: 3 });
});

test('ChartDataAdapter.buildMonthlyStats: 履歴+当日スナップショットを構築できる', async () => {
  const ctx = vm.createContext({ console, self: {} });

  loadScriptIntoContext(path.resolve(__dirname, '../js/stats_engine.js'), ctx);
  loadScriptIntoContext(path.resolve(__dirname, '../js/chart_data_adapter.js'), ctx);

  // expose globals expected by adapter
  ctx.window = ctx.self;

  const gs = {
    wordStates: {
      junior_a: 'perfect',
      basic_b: 'perfect',
      daily_c: 'weak',
      exam1_d: 'perfect',
    },
    dailyHistory: [
      { date: '2026-02-01', total_learned: 2, cefr_breakdown: { A1: 1, A2: 1, B1: 0, B2: 0 } }
    ]
  };

  const vDB = {
    junior: [{ word: 'a' }],
    basic: [{ word: 'b' }],
    daily: [{ word: 'c' }],
    exam1: [{ word: 'd' }],
  };

  const logMap = new Map();
  ctx.self.ChartDataAdapter.mergeLocalHistory(logMap, gs);
  const stats = ctx.self.ChartDataAdapter.buildMonthlyStats(logMap, gs, vDB);

  expect(stats.labels.length).toBe(30);
  expect(stats.datasets.total.length).toBe(30);

  // 今日の末尾データは perfect-only の 3 になるはず
  const last = stats.datasets.total[stats.datasets.total.length - 1];
  expect(last).toBe(3);
});
