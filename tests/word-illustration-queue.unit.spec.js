const { test, expect } = require('@playwright/test');
const { readInputs, buildQueue } = require('../scripts/word-illustration-queue');
const fs = require('node:fs');
const path = require('node:path');

test('全名詞キューは収録順・参照品詞・学習キーを保持する', () => {
  const input = readInputs();
  const queue = buildQueue(input);
  expect(queue.unresolvedReferences).toEqual([]);
  expect(queue.summary.nounRows).toBe(6746);
  expect(queue.summary.nounKeys).toBe(4577);
  expect(new Set(queue.entries.map(entry => entry.key)).size).toBe(queue.entries.length);
  expect(queue.entries.slice(0, 4).map(entry => entry.word)).toEqual(['action', 'activity', 'actor', 'address']);
  expect(queue.entries.filter(entry => entry.level === 'junior')).toHaveLength(663);
  expect(queue.entries.every(entry => entry.pos === '名')).toBe(true);
  expect(queue.entries.find(entry => entry.word === 'article' && entry.level === 'junior').occurrences).toBe(3);
  expect(queue.entries.find(entry => entry.word === 'shelter' && entry.level === 'daily').status).toBe('ready');
  expect(queue.summary.readyKeys).toBe(input.illustrations.length);
  expect(queue.summary.readyKeys + queue.summary.pendingKeys).toBe(4577);
});

test('同じ綴りの別品詞を混ぜず、参照先の品詞を優先して重複をまとめる', () => {
  const { utils } = readInputs();
  const database = {
    junior: [
      { word: 'arm', pos: '名', meaning: '腕' },
      { word: 'arm', pos: '動', meaning: '武装させる' },
      { word: 'hope', pos: '名', meaning: '希望' },
    ],
    basic: [{ word: 'arm', pos: '名', meaning: '部門' }],
    selection1400: [{ word: 'arm', pos: '動', ref: 'junior:arm' }],
  };
  const queue = buildQueue({ database, illustrations: [{ word: 'arm', level: 'junior', pos: '名', src: 'arm.webp' }], utils });
  expect(queue.entries).toHaveLength(3);
  expect(queue.entries[0]).toMatchObject({ word: 'arm', level: 'junior', occurrences: 2, status: 'ready' });
  expect(queue.entries[1]).toMatchObject({ word: 'hope', status: 'pending' });
  expect(queue.entries[2]).toMatchObject({ word: 'arm', level: 'basic', meaning: '部門', status: 'pending' });
});

test('未解決の参照は無視せず報告し、同じキーの異なる語義を残す', () => {
  const { utils } = readInputs();
  const database = {
    junior: [{ word: 'test', pos: '名', meaning: '試験' }, { word: 'test', pos: '名', meaning: '検査' }],
    selection1400: [{ word: 'missing', pos: '名', ref: 'junior:missing' }],
  };
  const queue = buildQueue({ database, illustrations: [], utils });
  expect(queue.entries[0].meaningVariants).toEqual(['試験', '検査']);
  expect(queue.unresolvedReferences).toEqual([{ level: 'selection1400', word: 'missing', ref: 'junior:missing' }]);
});

test('登録画像の全パスと収録名詞の対応が存在し、対応キーが重複しない', () => {
  const { database, illustrations, utils } = readInputs();
  const keys = new Set();
  for (const entry of illustrations) {
    const key = utils.getWordKey(entry, entry.level, database);
    expect(keys.has(key)).toBe(false);
    keys.add(key);
    expect(database[entry.level].some(word => word.word === entry.word && word.pos === entry.pos)).toBe(true);
    expect(entry.pos).toBe('名');
    expect(entry.src).toMatch(/^assets\/word-illustrations\/[a-z0-9-]+\.webp$/);
    expect(fs.statSync(path.resolve(__dirname, '..', entry.src)).size).toBeGreaterThan(0);
    expect(entry.alt).toBeTruthy();
  }
});

test('A1第2回は選別せず未制作先頭70語を扱い、同義表記だけを共有する', () => {
  const input = readInputs();
  const batch = require('../docs/experiments/noun-production/a1-002/prompts.json');
  const batchKeys = new Set(batch.entries.map(entry => input.utils.getWordKey(entry, entry.level, input.database)));
  const baseline = buildQueue({ ...input, illustrations: input.illustrations.filter(entry => !batchKeys.has(input.utils.getWordKey(entry, entry.level, input.database))) });
  expect(batch.entries.map(entry => entry.word)).toEqual(baseline.entries.filter(entry => entry.status === 'pending').slice(0, 70).map(entry => entry.word));
  expect(batch.entries).toHaveLength(70);
  expect(new Set(batch.entries.map(entry => entry.asset)).size).toBe(68);
  const find = word => batch.entries.find(entry => entry.word === word);
  expect(find('bike').asset).toBe(find('bicycle').asset);
  expect(find('café').asset).toBe(find('cafe').asset);
  expect(find('bag').asset).toBe('assets/word-illustrations/bag-v2.png');
});
