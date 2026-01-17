
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');
content += '\nmodule.exports = DEFAULT_VOCABULARY;';
const tempPath = path.join(__dirname, '../data/vocabulary_temp_scan1400.js');
fs.writeFileSync(tempPath, content);
const vocabulary = require(tempPath);

const targetList = vocabulary.selection1400 || [];
const incomplete = [];

targetList.forEach(item => {
    if (!item.ref) {
        // Same criteria: "other" POS or placeholder example
        const isSuspicious = (item.pos === 'other' || item.pos === 'unknown' || !item.pos) ||
            (item.example && item.example.includes('example.'));

        if (isSuspicious) {
            incomplete.push(item.word);
        }
    }
});

console.log(`Found ${incomplete.length} incomplete words in selection1400.`);
console.log(JSON.stringify(incomplete, null, 2));

try { fs.unlinkSync(tempPath); } catch (e) { }
