
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let fileContent = fs.readFileSync(vocabPath, 'utf8');

// The file might contain mixed specific strings.
// We will replace specific ENGLISH pos values with JAPANESE single character values.
// Be careful not to replace "noun" inside a sentence, only `pos: "noun"`

const map = {
    '"noun"': '"名"',
    '"verb"': '"動"',
    '"adj"': '"形"',
    '"adv"': '"副"',
    '"aux"': '"助"',
    '"prep"': '"前"',
    '"conj"': '"接"',
    '"pron"': '"代"',
    '"interj"': '"間"'
};

let content = fileContent;
let count = 0;

for (const [eng, jap] of Object.entries(map)) {
    // Regex: pos:\s*"noun"
    // We want to replace valid occurrences.
    const regex = new RegExp(`pos:\\s*${eng}`, 'g');

    // Count occurrences
    const matches = content.match(regex);
    if (matches) {
        count += matches.length;
        content = content.replace(regex, `pos: ${jap}`);
    }
}

// Special case: "other" -> "他"? Or keep "other"?
// In game_logic.js: `posFilters: [..., 'other']`. 
// It seems 'other' is valid and used for "Others".
// So we DO NOT change "other".

console.log(`Replaced ${count} English POS tags with Japanese.`);
fs.writeFileSync(vocabPath, content);
