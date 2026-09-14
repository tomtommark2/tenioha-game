const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { buildQueue } = require('../scripts/word-illustration-queue');
const { readInputs } = require('./helpers/pictogram-history');
const registration = require('../docs/experiments/pictogram-006-2026-09-11/registration.json');
const encoding = require('../docs/experiments/noun-production/pictogram-006/encoding.json');

test('通常生成の追加50画像・51語は未制作順を守り、既存100語を保持する', () => {
  const input = readInputs();
  const { utils, database } = input;
  const illustrations = input.illustrations.slice(0, registration.totalWords);
  expect(input.vocabularySha256).toBe(registration.vocabularySha256);
  expect(illustrations).toHaveLength(151);
  expect(new Set(illustrations.map(e => e.src)).size).toBe(147);
  expect(crypto.createHash('sha256').update(JSON.stringify(illustrations.slice(0, 100))).digest('hex')).toBe(registration.previousManifestSha256);
  expect(illustrations.slice(100)).toEqual(registration.entries);
  const keys = new Set(registration.entries.map(e => utils.getWordKey(e, e.level, database)));
  const baseline = buildQueue({ ...input, illustrations: illustrations.filter(e => !keys.has(utils.getWordKey(e, e.level, database))) });
  expect(registration.entries.map(e => e.word)).toEqual(baseline.entries.filter(e => e.status === 'pending').slice(0, 51).map(e => e.word));
  expect(encoding.records).toHaveLength(50);
  for (const e of registration.entries) {
    expect(fs.existsSync(e.src)).toBe(true);
    const record = encoding.records.find(r => r.delivery === e.src);
    expect(record.visiblePixelsIdentical).toBe(true);
    expect(record.transparentPixels).toBeGreaterThan(0);
  }
  const find = word => illustrations.find(e => e.word === word && e.level === 'junior');
  expect(find('color').src).toBe(find('colour').src);
  expect(buildQueue({ ...input, illustrations }).entries.find(e => e.status === 'pending').word).toBe('cow');
});
