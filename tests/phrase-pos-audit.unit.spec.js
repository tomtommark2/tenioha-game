const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { screenVocabulary } = require('../scripts/audit-phrase-pos');
const original = require('../docs/phrase-pos-screening-2026-09-09.json');
const current = require('../docs/phrase-pos-screening-2026-09-09-after-overview-01.json');
const ledger = require('../docs/phrase-pos-decisions-2026-09-09.json');

test('修正前の全抽出項目に判定があり、分類残件と適合例を混同しない', () => {
    const ids = [
        ...original.reusedAcrossPos.map(g => `reuse|${g.word}|${g.phrase}`),
        ...original.nounWithAdjectiveReadingCandidates.map(r => `noun|${r.level}|${r.index}`),
    ];
    expect(ids).toHaveLength(91);
    expect(ledger.decisions.map(d => d.id).sort()).toEqual(ids.sort());
    expect(new Set(ledger.decisions.map(d => d.id)).size).toBe(91);
    expect(ledger.decisions.filter(d => d.status === 'classification-review').map(d => d.word).sort())
        .toEqual(['lot', 'most', 'yeah']);
    const repair = require('../docs/vocabulary-changes/2026-09-09-phrase-pos-batch-03.json');
    expect([...new Set(repair.changes.map(c => c.after.word))].sort()).toEqual(ledger.latestResolution.resolvedWords);
    expect(ledger.latestResolution.remainingClassificationReviews).toBe(0);
    expect(ledger.decisions.filter(d => d.status === 'retain-phrase').map(d => d.word).sort())
        .toEqual(['back', 'round', 'silver', 'standard', 'top']);
    for (const decision of ledger.decisions) {
        expect(decision.reason.length).toBeGreaterThan(0);
        if (decision.status === 'revised') expect(decision.changes.length).toBeGreaterThan(0);
    }
});

test('現在の抽出結果が保存した修正後レポートと一致し、原データを変更しない', () => {
    const database = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data/vocabulary.js'), 'utf8')
        + ';DEFAULT_VOCABULARY');
    const before = JSON.stringify(database);
    const result = screenVocabulary(database);
    const { sourceSha256, ...expected } = current;
    expect(JSON.parse(JSON.stringify(result))).toEqual(expected);
    expect(JSON.stringify(database)).toBe(before);
    expect(result.reusedAcrossPos).toHaveLength(0);
    expect(result.nounWithAdjectiveReadingCandidates).toHaveLength(5);
});
