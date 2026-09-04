const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScriptIntoContext(filePath, context) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: filePath });
}

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

test('GameUtils.getLoginCloudSyncDecision: 空の新規端末では時刻よりクラウドを優先する', async () => {
  const ctx = vm.createContext({ console, self: {}, localStorage: { getItem: () => null } });
  ctx.window = ctx.self;
  loadScriptIntoContext(path.resolve(__dirname, '../js/utils.js'), ctx);

  const cloudData = {
    lastSaveTime: 100,
    globalQuestionCount: 20,
    wordStates: { learned_word: 'learned' },
  };
  const timestampedEmptyLocal = {
    lastSaveTime: 200,
    globalQuestionCount: 0,
    wordStates: {},
    srsData: {},
    actionCounts: {},
  };

  expect(ctx.self.GameUtils.getLoginCloudSyncDecision({
    hadExistingSaveAtBoot: false,
    localData: timestampedEmptyLocal,
    cloudData,
  })).toBe('restore-clean-device');

  expect(ctx.self.GameUtils.getLoginCloudSyncDecision({
    hadExistingSaveAtBoot: false,
    localData: { ...timestampedEmptyLocal, globalQuestionCount: 1 },
    cloudData,
  })).toBe('keep-local');

  expect(ctx.self.GameUtils.getLoginCloudSyncDecision({
    hadExistingSaveAtBoot: true,
    localData: timestampedEmptyLocal,
    cloudData,
  })).toBe('keep-local');
});
