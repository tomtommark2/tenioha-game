
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');

// Quick hack to make it loadable in Node
content += '\nmodule.exports = DEFAULT_VOCABULARY;';

// Write to a temp file
const tempPath = path.join(__dirname, '../data/vocabulary_temp.js');
fs.writeFileSync(tempPath, content);

const vocabulary = require(tempPath);

const sys2000 = vocabulary.sys_2000 || [];
const report = {
    total: sys2000.length,
    missingRefTarget: [],
    noRefUnknownPos: [],
    validRef: 0,
    validLocal: 0
};

sys2000.forEach((item, index) => {
    if (item.ref) {
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
            report.noRefUnknownPos.push({ word: item.word, reason: 'No ref and unknown POS' });
        } else {
            report.validLocal++;
        }
    }
});

console.log('--- Analysis Report ---');
console.log(`Total sys_2000 words: ${report.total}`);
console.log(`Valid References: ${report.validRef}`);
console.log(`Valid Local Data: ${report.validLocal}`);
console.log(`Broken References: ${report.missingRefTarget.length}`);
console.log(`Missing Data (No Ref): ${report.noRefUnknownPos.length}`);

if (report.missingRefTarget.length > 0) {
    console.log('\n--- Broken References (First 5) ---');
    console.log(report.missingRefTarget.slice(0, 5));
}

if (report.noRefUnknownPos.length > 0) {
    console.log('\n--- Missing Data (First 5) ---');
    console.log(report.noRefUnknownPos.slice(0, 5));
}

// Cleanup
fs.unlinkSync(tempPath);
