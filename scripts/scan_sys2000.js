
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');
content += '\nmodule.exports = DEFAULT_VOCABULARY;';
const tempPath = path.join(__dirname, '../data/vocabulary_temp_scan2000.js');
fs.writeFileSync(tempPath, content);
const vocabulary = require(tempPath);

const targetList = vocabulary.sys_2000 || [];
const incomplete = [];

targetList.forEach(item => {
    if (!item.ref) {
        // Must have no ref.
        // Check if incomplete.
        const isSuspicious = (item.pos === 'other' || item.pos === 'unknown' || !item.pos);
        // Note: sys_2000 items often have meaning.

        if (isSuspicious) {
            incomplete.push(item.word);
        }
    }
});

console.log(`Found ${incomplete.length} incomplete words in sys_2000.`);
console.log(JSON.stringify(incomplete, null, 2));

try { fs.unlinkSync(tempPath); } catch (e) { }
