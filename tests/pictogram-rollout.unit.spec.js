const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { readInputs } = require('../scripts/word-illustration-queue');
const sources = require('../docs/experiments/noun-production/pictogram-rollout-01/sources.json');
const encoding = require('../docs/experiments/noun-production/pictogram-rollout-01/encoding.json');
const secondSources = require('../docs/experiments/noun-production/pictogram-rollout-02/sources.json');
const secondEncoding = require('../docs/experiments/noun-production/pictogram-rollout-02/encoding.json');
const thirdSources = require('../docs/experiments/noun-production/pictogram-rollout-03/sources.json');
const thirdEncoding = require('../docs/experiments/noun-production/pictogram-rollout-03/encoding.json');

test('新版97枚を全100語へ割り当て、元の画像を保持する', () => {
  const { illustrations } = readInputs();
  expect(sources.entries).toHaveLength(50);
  expect(encoding.records).toHaveLength(50);
  expect(secondSources.entries).toHaveLength(20);
  expect(secondEncoding.records).toHaveLength(20);
  expect(thirdSources.entries).toHaveLength(27);
  expect(thirdEncoding.records).toHaveLength(27);
  const rolloutAssets = new Set([...sources.entries, ...secondSources.entries, ...thirdSources.entries].map(entry => entry.delivery));
  const updated = illustrations.filter(entry => rolloutAssets.has(entry.src));
  expect(updated).toHaveLength(100);
  expect(new Set(updated.map(entry => entry.src)).size).toBe(97);
  expect(illustrations.find(entry => entry.word === 'café').src).toBe(illustrations.find(entry => entry.word === 'cafe').src);
  for (const source of [...sources.entries, ...secondSources.entries, ...thirdSources.entries]) {
    const entry = illustrations.find(item => item.word === source.word && item.level === source.level && item.pos === source.pos);
    expect(entry.src).toBe(source.delivery);
    expect(fs.existsSync(source.delivery)).toBe(true);
    expect(fs.existsSync(source.oldAsset)).toBe(true);
    const record = [...encoding.records, ...secondEncoding.records, ...thirdEncoding.records].find(item => item.delivery === source.delivery);
    expect(record.visiblePixelsIdentical).toBe(true);
    expect(record.transparentPixels).toBeGreaterThan(0);
  }
});
