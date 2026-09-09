// Screening only: identical phrases and noun modifiers are not automatically errors.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function screenVocabulary(database) {
const levels = ['junior', 'basic', 'daily', 'exam1'];
const byWord = new Map();
for (const level of levels) for (const [index, word] of database[level].entries()) {
    const rows = byWord.get(word.word) || [];
    rows.push({ level, index, ...word });
    byWord.set(word.word, rows);
}
const reusedAcrossPos = [];
const nounWithAdjectiveReadingCandidates = [];
for (const [word, rows] of byWord) {
    const byPhrase = new Map();
    for (const row of rows) {
        if (!row.phrase) continue;
        const matches = byPhrase.get(row.phrase) || [];
        matches.push(row);
        byPhrase.set(row.phrase, matches);
    }
    for (const [phrase, matches] of byPhrase) {
        if (new Set(matches.map(row => row.pos)).size > 1) reusedAcrossPos.push({ word, phrase, rows: matches });
    }
    if (rows.some(row => row.pos === '形')) {
        nounWithAdjectiveReadingCandidates.push(...rows.filter(row => row.pos === '名'
            && row.phrase?.toLowerCase().startsWith(word.toLowerCase() + ' ')));
    }
}
return {
    scope: 'Primary CEFR source rows; screening candidates, not confirmed error counts',
    sourceRows: levels.reduce((count, level) => count + database[level].length, 0),
    reusedAcrossPos,
    nounWithAdjectiveReadingCandidates,
};
}

module.exports = { screenVocabulary };

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--output')) {
        throw new Error('Usage: node scripts/audit-phrase-pos.js [--output new-report.json]');
    }
    const source = fs.readFileSync(path.join(root, 'data/vocabulary.js'), 'utf8');
    const database = vm.runInNewContext(source + ';DEFAULT_VOCABULARY');
    const report = screenVocabulary(database);
    report.sourceSha256 = require('crypto').createHash('sha256').update(source).digest('hex');
    if (args.length) {
        const destination = path.resolve(root, args[1]);
        // Historical evidence must not be silently overwritten by a new run.
        fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
        console.log(JSON.stringify({ sourceRows: report.sourceRows, reusedAcrossPos: report.reusedAcrossPos.length,
            nounWithAdjectiveReadingCandidates: report.nounWithAdjectiveReadingCandidates.length, destination }));
    } else {
        console.log(JSON.stringify(report, null, 2));
    }
}
