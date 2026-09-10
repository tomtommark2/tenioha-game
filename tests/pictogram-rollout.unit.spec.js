const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { readInputs } = require('../scripts/word-illustration-queue');
const sources = require('../docs/experiments/noun-production/pictogram-rollout-01/sources.json');
const encoding = require('../docs/experiments/noun-production/pictogram-rollout-01/encoding.json');

test('新版50枚を52語へ割り当て、残り48語と元の画像を保持する', () => {
  const { illustrations } = readInputs();
  expect(sources.entries).toHaveLength(50);
  expect(encoding.records).toHaveLength(50);
  const updated = illustrations.filter(entry => entry.src.endsWith('-pictogram-v1.webp'));
  expect(updated).toHaveLength(52);
  expect(new Set(updated.map(entry => entry.src)).size).toBe(50);
  expect(illustrations.length - updated.length).toBe(48);
  for (const source of sources.entries) {
    const entry = illustrations.find(item => item.word === source.word && item.level === source.level && item.pos === source.pos);
    expect(entry.src).toBe(source.delivery);
    expect(fs.existsSync(source.delivery)).toBe(true);
    expect(fs.existsSync(source.oldAsset)).toBe(true);
    const record = encoding.records.find(item => item.delivery === source.delivery);
    expect(record.visiblePixelsIdentical).toBe(true);
    expect(record.transparentPixels).toBeGreaterThan(0);
  }
});
