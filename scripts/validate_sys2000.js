
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');
content += '\nmodule.exports = DEFAULT_VOCABULARY;';
const tempPath = path.join(__dirname, '../data/vocabulary_temp_validator.js');
fs.writeFileSync(tempPath, content);
const vocabulary = require(tempPath);

const sys2000 = vocabulary.sys_2000 || [];
const errors = [];

sys2000.forEach(item => {
    // If POS is valid/localized, it's fine (self-contained).
    // Valid POS: 名, 動, 形, 副, 助, 前, 接, 代
    const validPos = ['名', '動', '形', '副', '助', '前', '接', '代'];
    const hasData = validPos.includes(item.pos);

    if (hasData) {
        // Self-contained, OK.
        return;
    }

    // If no valid data, MUST have valid ref.
    if (!item.ref) {
        errors.push({ word: item.word, reason: "No Data and No Ref" });
        return;
    }

    // Check ref validity
    let refCategory = item.ref;
    let refWord = item.word;
    if (item.ref.includes(':')) {
        const parts = item.ref.split(':');
        refCategory = parts[0];
        refWord = parts[1];
    }

    // Check if category exists
    const targetArray = vocabulary[refCategory];
    if (!targetArray) {
        errors.push({ word: item.word, reason: `Ref Category '${refCategory}' Not Found` });
        return;
    }

    // Check if word exists in category
    const targetItem = targetArray.find(w => w.word === refWord);
    if (!targetItem) {
        // Loose check: maybe target has different case? 
        // Game logic is case sensitive usually.
        errors.push({ word: item.word, reason: `Ref Word '${refWord}' Not Found in '${refCategory}'` });
        return;
    }

    // Check if target item has valid data
    if (!validPos.includes(targetItem.pos) && targetItem.pos !== 'noun' && targetItem.pos !== 'verb') { // simplistic check
        // It might be 'unknown' too?
        // If partial chain...
    }
});

console.log(`Found ${errors.length} validation errors in sys_2000.`);
if (errors.length > 0) {
    console.log(JSON.stringify(errors.slice(0, 100), null, 2)); // limit output
}

try { fs.unlinkSync(tempPath); } catch (e) { }
