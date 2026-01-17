
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');

// Quick hack to load
content += '\nmodule.exports = DEFAULT_VOCABULARY;';
const tempPath = path.join(__dirname, '../data/vocabulary_temp_scan.js');
fs.writeFileSync(tempPath, content);
const vocabulary = require(tempPath);

const targetList = vocabulary.selection1900 || [];
const incomplete = [];

targetList.forEach(item => {
    // We are looking for items that:
    // 1. Have an ID (implies local definition intent)
    // 2. Do NOT have a ref (or ref is empty) -> If it has a ref, we assume it relies on the ref (though user showed 'alert' has ID and Ref, so maybe checks valid ref? But user said 'conspicuous' wasn't in basic/daily, so it has no ref or invalid ref).
    // The user example of 'magnetic' had NO ref. 'alert' had a ref.
    // So we focus on "No Ref" AND ("pos is other/unknown" OR "example is placeholder").

    if (!item.ref) {
        const isSuspicious = (item.pos === 'other' || item.pos === 'unknown' || !item.pos) ||
            (item.example && item.example.includes('example.')); // "magnetic example."

        if (isSuspicious) {
            incomplete.push({
                id: item.id,
                word: item.word,
                meaning: item.meaning,
                pos: item.pos,
                phrase: item.phrase,
                example: item.example
            });
        }
    }
});

console.log(`Found ${incomplete.length} incomplete words in selection1900.`);
console.log(JSON.stringify(incomplete, null, 2));

try { fs.unlinkSync(tempPath); } catch (e) { }
