
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');
content += '\nmodule.exports = DEFAULT_VOCABULARY;';
const tempPath = path.join(__dirname, '../data/vocabulary_temp_scan2.js');
fs.writeFileSync(tempPath, content);
const vocabulary = require(tempPath);

const targetList = vocabulary.selection1900 || [];
const wordsToFix = [];

targetList.forEach(item => {
    if (!item.ref) {
        const isSuspicious = (item.pos === 'other' || item.pos === 'unknown' || !item.pos) ||
            (item.example && item.example.includes('example.'));
        if (isSuspicious) {
            wordsToFix.push(item.word);
        }
    }
});

fs.writeFileSync(path.join(__dirname, 'words_to_fix.json'), JSON.stringify(wordsToFix, null, 2));
try { fs.unlinkSync(tempPath); } catch (e) { }
