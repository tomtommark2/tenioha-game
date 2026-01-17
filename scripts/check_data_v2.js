
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');

// Quick hack to make it loadable in Node
content += '\nmodule.exports = DEFAULT_VOCABULARY;';

// Write to a temp file
const tempPath = path.join(__dirname, '../data/vocabulary_temp_v2.js');
fs.writeFileSync(tempPath, content);

const vocabulary = require(tempPath);

const sys2000 = vocabulary.sys_2000 || [];
const report = {
    total: sys2000.length,
    missingRefTarget: [],
    noRefUnknownPos: [],
    foundMatches: [], // Words that have no ref but exist elsewhere
    validRef: 0,
    validLocal: 0
};

// Index all other words
const wordIndex = {};
Object.keys(vocabulary).forEach(key => {
    if (key === 'sys_2000') return;
    vocabulary[key].forEach(w => {
        if (!wordIndex[w.word]) {
            wordIndex[w.word] = [];
        }
        wordIndex[w.word].push({ category: key, data: w });
    });
});

sys2000.forEach((item, index) => {
    if (item.ref) {
        // ... (Existing check logic) ...
        let refCat = item.ref;
        let refWord = item.word;
        if (item.ref.includes(':')) {
            const parts = item.ref.split(':');
            refCat = parts[0];
            refWord = parts[1];
        }

        const targetArray = vocabulary[refCat];
        if (!targetArray) {
            report.missingRefTarget.push({ word: item.word, ref: item.ref, reason: `Category ${refCat} not found` });
            return;
        }

        const targetWord = targetArray.find(w => w.word === refWord);
        if (!targetWord) {
            report.missingRefTarget.push({ word: item.word, ref: item.ref, reason: `Word ${refWord} not found in ${refCat}` });
        } else {
            report.validRef++;
        }
    } else {
        if (item.pos === 'unknown' || !item.pos || item.pos === '') {
            // Check if it exists elsewhere
            if (wordIndex[item.word]) {
                const match = wordIndex[item.word][0]; // Take first match
                report.foundMatches.push({
                    word: item.word,
                    suggRef: `${match.category}:${match.data.word}`,
                    foundIn: match.category
                });
            } else {
                report.noRefUnknownPos.push({ word: item.word, reason: 'No ref, unknown POS, and NO Match found' });
            }
        } else {
            report.validLocal++;
        }
    }
});

console.log('--- Analysis Report v2 ---');
console.log(`Total sys_2000 words: ${report.total}`);
console.log(`Valid References: ${report.validRef}`);
console.log(`Valid Local Data: ${report.validLocal}`);
console.log(`Broken References: ${report.missingRefTarget.length}`);
console.log(`Words RECOVERABLE (Found elsewhere): ${report.foundMatches.length}`);
console.log(`Words TRULY MISSING (No Ref/Matches): ${report.noRefUnknownPos.length}`);

if (report.foundMatches.length > 0) {
    console.log('\n--- Recoverable Example (First 5) ---');
    console.log(report.foundMatches.slice(0, 5));
}

if (report.noRefUnknownPos.length > 0) {
    console.log('\n--- Truly Missing Example (First 5) ---');
    console.log(report.noRefUnknownPos.slice(0, 5));
}

// Cleanup (try catch to avoid crash)
try {
    fs.unlinkSync(tempPath);
} catch (e) {
    console.log("Could not delete temp file, ignoring.");
}
