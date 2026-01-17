
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
const patchPath1 = path.join(__dirname, 'apply_fix_sys2000_remaining.js');
const patchPath2 = path.join(__dirname, 'apply_fix_sys2000_final.js');

function extractPatchData(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const start = content.indexOf('const patchData = {');
    if (start === -1) return {};

    let end = content.indexOf('};', start);
    if (end === -1) return {};

    const jsonStr = content.substring(start + 18, end + 1); // include the brace
    // eval is dangerous but this is our own code.
    // However, the content is JS object literal, not strictly JSON (keys might not be quoted? no they are).
    // Let's use eval safely.
    try {
        return eval('(' + jsonStr + ')');
    } catch (e) {
        console.error("Error parsing patch data from " + filePath + ": " + e.message);
        return {};
    }
}

const patch1 = extractPatchData(patchPath1);
const patch2 = extractPatchData(patchPath2);

// Merge patches (patch2 overrides patch1 if duplicates)
const mergedPatch = { ...patch1, ...patch2 };

console.log(`Loaded ${Object.keys(mergedPatch).length} patches.`);

const posMap = {
    "noun": "名",
    "verb": "動",
    "adj": "形",
    "adv": "副",
    "aux": "助",
    "prep": "前",
    "conj": "接",
    "pron": "代",
    "interj": "間"
};

let lines = fs.readFileSync(vocabPath, 'utf8').split('\n');
let insideSys2000 = false;
let updatedCount = 0;

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
            if (mergedPatch[word]) {
                const patch = mergedPatch[word];
                let newLine = line;

                // Convert POS if english
                let newPos = patch.pos;
                if (posMap[newPos]) {
                    newPos = posMap[newPos];
                }
                // If patch.pos matches mojibake/jap already, keep it.

                // FORCE REPLACE
                // We use replace but need to handle "unknown" or "ref" missing things.
                // Assuming format: { word: "x", ... pos: "...", ... }

                // Replace POS
                if (newLine.includes('pos:')) {
                    newLine = newLine.replace(/pos:\s*"[^"]*"/, `pos: "${newPos}"`);
                }

                // Replace Phrase
                if (newLine.includes('phrase:')) {
                    newLine = newLine.replace(/phrase:\s*"[^"]*"/, `phrase: "${patch.phrase}"`);
                }

                // Replace Example
                if (newLine.includes('example:')) {
                    // escape double quotes in example if any (simple approach)
                    const cleanExample = patch.example.replace(/"/g, '\\"');
                    newLine = newLine.replace(/example:\s*"[^"]*"/, `example: "${cleanExample}"`);
                }

                if (lines[i] !== newLine) {
                    lines[i] = newLine;
                    updatedCount++;
                }
            }
        }
    }
}

console.log(`Force Updated ${updatedCount} words in sys_2000.`);
fs.writeFileSync(vocabPath, lines.join('\n'));
