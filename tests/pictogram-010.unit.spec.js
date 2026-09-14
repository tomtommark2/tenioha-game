const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { buildQueue } = require('../scripts/word-illustration-queue');
const { readInputs } = require('./helpers/pictogram-history');
const registration = require('../docs/experiments/pictogram-010-2026-09-14/registration.json');
const prompts = require('../docs/experiments/pictogram-010-2026-09-14/prompts.json');
const encoding = require('../docs/experiments/noun-production/pictogram-010/encoding.json');

test('通常生成の追加50画像・53項目は未制作順を守り、既存310語を保持する', () => {
  const input = readInputs();
  const illustrations = input.illustrations.slice(0, registration.totalWords);
  expect(input.vocabularySha256).toBe(registration.vocabularySha256);
  expect(illustrations).toHaveLength(363);
  expect(new Set(illustrations.map(e => e.src)).size).toBe(347);
  const previous = illustrations.slice(0, 310);
  expect(crypto.createHash('sha256').update(JSON.stringify(previous)).digest('hex')).toBe(registration.previousManifestSha256);
  expect(illustrations.slice(310)).toEqual(registration.entries);
  const baseline = buildQueue({ ...input, illustrations: previous });
  expect(registration.entries.map(e => e.word)).toEqual(baseline.entries.filter(e => e.status === 'pending').slice(0, 53).map(e => e.word));
  const pending = baseline.entries.filter(e => e.status === 'pending').slice(0, 53);
  expect(registration.entries.map(e => input.utils.getWordKey(e, e.level, input.database))).toEqual(pending.map(e => e.key));
  const lots = registration.entries.filter(e => e.word === 'lot');
  expect(lots.map(e => e.legacyKeyPos)).toEqual(['副', '代']);
  expect(lots[0].src).toBe(lots[1].src);
  expect(prompts.entries).toHaveLength(50);
  expect(encoding.records).toHaveLength(50);
  for (const e of registration.entries) {
    expect(fs.existsSync(e.src)).toBe(true);
    const record = encoding.records.find(r => r.delivery === e.src);
    expect(record.visiblePixelsIdentical).toBe(true);
    expect(record.transparentPixels).toBeGreaterThan(0);
    expect(record.width).toBe(1254);
    expect(record.height).toBe(1254);
  }
  const find = word => illustrations.find(e => e.word === word && e.level === 'junior');
  for (const alias of prompts.aliases) expect(find(alias.word).src).toBe(find(alias.source).src);
  expect(buildQueue({ ...input, illustrations }).entries.find(e => e.status === 'pending').word).toBe('meal');
});
