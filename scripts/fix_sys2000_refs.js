
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let fileContent = fs.readFileSync(vocabPath, 'utf8');

// Load data to map
// We need to parse the arrays from the string to build a search index.
// This time I'll use a regex to extract arrays roughly or just use the node module trick again for READING.
// The writing part needs to be string replacement to preserve format.

// Helper to load data
function loadData() {
    let content = fs.readFileSync(vocabPath, 'utf8');
    content += '\nmodule.exports = DEFAULT_VOCABULARY;';
    const tempPath = path.join(__dirname, '../data/vocabulary_temp_ref.js');
    fs.writeFileSync(tempPath, content);
    try {
        return require(tempPath);
    } finally {
        try { fs.unlinkSync(tempPath); } catch (e) { }
    }
}

const vocabulary = loadData();
const sys2000 = vocabulary.sys_2000 || [];

// Build Index
const wordIndex = {};
// Priority order for search
const sources = ['selection1900', 'selection1400', 'daily', 'basic', 'exam1', 'junior'];

sources.forEach(source => {
    (vocabulary[source] || []).forEach(item => {
        // Only index if the item is "valid" (has meaning, pos, etc).
        // Since we fixed selection1900, it should be valid.
        if (!wordIndex[item.word]) {
            wordIndex[item.word] = source;
        }
    });
});

// We will generate a map of "Word -> New Ref" for updates
const updates = {};

sys2000.forEach(item => {
    // Check if current ref is broken
    let isBroken = true;
    if (item.ref) {
        let refCat = item.ref;
        let refWord = item.word;
        if (item.ref.includes(':')) {
            const parts = item.ref.split(':');
            refCat = parts[0];
            refWord = parts[1];
        } else {
            // If no colon, it refers to 'item.word' in the category
            // Logic in game: if no colon, assumes same word.
        }

        // Check existence
        const targetArr = vocabulary[refCat];
        if (targetArr) {
            const targetItem = targetArr.find(w => w.word === refWord);
            if (targetItem) {
                isBroken = false;
                // Optional: Standardize format?
                // User liked "ref: category" if same word.
                // But let's stick to fixing BROKEN ones first.
            }
        }
    }

    if (isBroken) {
        // Find in index
        if (wordIndex[item.word]) {
            updates[item.word] = wordIndex[item.word];
        }
    } else {
        // Even if not broken, maybe we want to simplify the ref if it's "category:word" -> "category"
        // But let's prioritize fixing broken ones.
        // Actually, the user mentioned: "selection1400 has ref: 'exam1' ... works fine".
        // "sys2000 has ref: 'daily:temper' ... broken".
        // So we should probably Standardize to `ref: "category"` if the word matches.

        let existingRef = item.ref || "";
        let refCat = existingRef.split(':')[0];

        // If the ref is complex "cat:word" and word == item.word, simplify?
        // Let's decide to just FIX pointers.
    }
});

// Now apply updates to file content
// We scan lines in sys_2000 block
const lines = fileContent.split('\n');
let insideSys2000 = false;
let updateCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('sys_2000: [')) {
        insideSys2000 = true;
        continue;
    }
    if (insideSys2000 && line.trim().startsWith(']')) {
        insideSys2000 = false;
    }

    if (insideSys2000) {
        const wordMatch = line.match(/word:\s*"([^"]+)"/);
        if (wordMatch) {
            const word = wordMatch[1];
            if (updates[word]) {
                const newRefCategory = updates[word];
                // Regex replace the ref part, or ADD it if missing
                // Line format: { word: "x", ..., ref: "old" },

                let newLine = line;
                if (newLine.includes('ref:')) {
                    // Replace existing ref
                    newLine = newLine.replace(/ref:\s*"[^"]+"/, `ref: "${newRefCategory}"`);
                } else {
                    // Add ref before the closing brace
                    // Be careful with commas. 
                    // Usually lines end with ` },` or ` }`
                    // Let's replace ` },` with `, ref: "${newRefCategory}" },`
                    // But wait, the line might have other props.
                    // Safest: replace the whole line? We need other props (set, id? sys_2000 usually doesn't have ID, just set).
                    // We can retain word, meaning(empty), pos(unknown), set.
                    // Actually, if we give it a ref, we don't need pos/meaning in the file technically?
                    // But current file has `pos: "unknown"`.
                    // Let's just update the REF.

                    // Actually, if we update the ref, we rely on the game logic to pull POS/Meanings.
                    // The line has `pos: "unknown"`. We can leave it, or change it?
                    // Logic: `loadVocabularyForLevel` overwrites pos if ref exists.
                    // So just adding ref is enough.

                    newLine = newLine.replace(/}\s*,?$/, `, ref: "${newRefCategory}" },`);
                }

                // Optimization: if we found a ref, maybe we can simplify the line to NOT have empty meaning/pos?
                // But strict find-replace is safer.

                lines[i] = newLine;
                updateCount++;
            }
        }
    }
}

console.log(`Fixed references for ${updateCount} words in sys_2000.`);
fs.writeFileSync(vocabPath, lines.join('\n'));
