
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');
content += '\nmodule.exports = DEFAULT_VOCABULARY;';
const tempPath = path.join(__dirname, '../data/vocabulary_temp_scan2000_v2.js');
fs.writeFileSync(tempPath, content);
const vocabulary = require(tempPath);

const sys2000 = vocabulary.sys_2000 || [];
const incomplete = [];

sys2000.forEach(item => {
    // If it has a ref, we assume it pulls data from elsewhere (Logic handles this).
    // The user specifically said "where ref could not be attached".
    if (!item.ref) {
        // Check for missing/placeholder data
        // We know they have meaning (User said "meaning is filled").
        // We check pos, phrase, example.

        let missing = [];
        // Check POS: unknown, other, or empty
        if (!item.pos || item.pos === 'unknown' || item.pos === 'other' || item.pos === 'noun') {
            // Note: 'noun' should have been converted to '名', so if it's 'noun' it's "english".
            // But if it is '名', it is fine.
            if (item.pos !== '名' && item.pos !== '動' && item.pos !== '形' && item.pos !== '副' &&
                item.pos !== '助' && item.pos !== '前' && item.pos !== '接' && item.pos !== '代' && item.pos !== '他') {
                // It's invalid/untranslated/unknown
                missing.push('pos');
            }
        }

        // Check Phrase: empty
        if (!item.phrase || item.phrase === "") {
            missing.push('phrase');
        }

        // Check Example: empty
        if (!item.example || item.example === "") {
            missing.push('example');
        }

        if (missing.length > 0) {
            incomplete.push({
                word: item.word,
                missing: missing,
                current: item
            });
        }
    }
});

console.log(`Found ${incomplete.length} incomplete words in sys_2000 (No Ref).`);
// Print first 50 to see patterns
// console.log(JSON.stringify(incomplete.slice(0, 50), null, 2));
// Only print words for compact output
console.log(JSON.stringify(incomplete.map(i => i.word), null, 2));

try { fs.unlinkSync(tempPath); } catch (e) { }
