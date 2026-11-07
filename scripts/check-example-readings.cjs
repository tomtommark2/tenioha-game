const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const level = process.argv.find(arg => arg.startsWith('--level='))?.slice('--level='.length) || 'junior';
assert.ok(['junior', 'basic', 'daily', 'exam1'].includes(level), `Unsupported level: ${level}`);
const context = { window: {}, readingLevel: level };
vm.createContext(context);
for (const file of ['data/vocabulary.js', 'js/utils.js', 'js/word_grouping.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
vm.runInContext('this.grouped = window.WordGrouping.build(DEFAULT_VOCABULARY, window.GameUtils).database[readingLevel]; this.source = this.grouped.flatMap(word => word.senses || [word]);', context);
const data = JSON.parse(fs.readFileSync(path.join(root, `data/example-readings-${level}.json`), 'utf8'));
assert.equal(data.version, 1);
assert.equal(data.level, level);
if (data.complete !== undefined) assert.equal(typeof data.complete, 'boolean');
assert.ok(data.entries.length);
const key = row => JSON.stringify([row.word, row.pos, row.example]);
const sourceKeys = new Set(context.source.map(key));
const covered = new Set();
for (const entry of data.entries) {
    const identity = key(entry);
    assert.ok(sourceKeys.has(identity), `No current source: ${identity}`);
    assert.ok(!covered.has(identity), `Duplicate: ${identity}`);
    covered.add(identity);
    assert.ok(Array.isArray(entry.chunks) && entry.chunks.length, `No chunks: ${identity}`);
    assert.equal(entry.chunks.map(chunk => chunk[0]).join(' '), entry.example, `Incomplete English: ${identity}`);
    for (const chunk of entry.chunks) {
        assert.equal(chunk.length, 2);
        assert.ok(chunk.every(value => typeof value === 'string' && value.trim()));
        if (chunk[1].includes('＝')) {
            assert.match(chunk[0], /\b(?:am|is|are|was|were|be|been|being|isn't|aren't|wasn't|weren't)\b|\b(?:I|you|he|she|it|we|they|there|that|what|who)(?:'m|'s|'re)\b/i, `Equality without be: ${identity}`);
        }
        // A standalone relation marker requires be (copular or passive use).
        if (/^＝(?:？|（過去）|（予測）)?$/u.test(chunk[1])) {
            assert.match(chunk[0], /^(?:am|is|are|was|were|be|will be)[.?!,]?$/i, `Invalid equality marker: ${identity}`);
        } else {
            assert.match(chunk[1], /[\u3040-\u30ff\u3400-\u9fff]/u);
        }
    }
    assert.match(entry.translation, /[\u3040-\u30ff\u3400-\u9fff]/u);
    if (entry.note !== undefined) assert.ok(typeof entry.note === 'string' && entry.note.trim());
}
const pending = context.source.filter(row => !covered.has(key(row)));
// The UI looks up the selected sense under the displayed parent spelling.
const runtimeRows = context.grouped.flatMap(word => (word.senses || [word]).map(sense => ({
    word: word.word, pos: sense.pos, example: sense.example
})));
const runtimePending = runtimeRows.filter(row => !covered.has(key(row)));
if (process.argv.includes('--complete') || data.complete === true) {
    assert.equal(pending.length, 0, 'Uncovered source examples');
    assert.equal(runtimePending.length, 0, 'Uncovered displayed examples');
}
console.log(JSON.stringify({
    level,
    sourceRows: context.source.length,
    uniqueSourceRows: sourceKeys.size,
    supportedRows: context.source.length - pending.length,
    supportedEntries: data.entries.length,
    remainingRows: pending.length,
    runtimeRemainingRows: runtimePending.length,
    next: pending.slice(0, 5).map(({ word, pos, example }) => ({ word, pos, example }))
}, null, 2));
