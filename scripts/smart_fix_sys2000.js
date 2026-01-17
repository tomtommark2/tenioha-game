
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let fileContent = fs.readFileSync(vocabPath, 'utf8');

function loadData() {
    let content = fs.readFileSync(vocabPath, 'utf8');
    content += '\nmodule.exports = DEFAULT_VOCABULARY;';
    const tempPath = path.join(__dirname, '../data/vocabulary_temp_fix2000.js');
    fs.writeFileSync(tempPath, content);
    try {
        return require(tempPath);
    } finally {
        try { fs.unlinkSync(tempPath); } catch (e) { }
    }
}

const vocabulary = loadData();
const sys2000 = vocabulary.sys_2000 || [];

// Index all other sources with CORRECT data
// We assume selection1900/1400 are now "correct" (or at least better than unknown).
const sources = ['selection1900', 'selection1400', 'daily', 'basic', 'exam1', 'junior'];
const wordIndex = {};

sources.forEach(source => {
    (vocabulary[source] || []).forEach(item => {
        // Only index if meaningful?
        // Actually, if it exists in these sources, it's better than "unknown".
        if (!wordIndex[item.word]) {
            wordIndex[item.word] = source;
        }
    });
});

const patchRefs = {}; // word -> source
const patchData = {
    // Manual fills for words NOT found in index (Truly missing)
    // I will populate this based on the "truly missing" expectation.
    // Ideally I would print the "truly missing" list first, but let's automate.
    // List from previous step output (some might be missing).
    // I already have the 386 list.

    // Hardcode 'chore' as requested since it might be missing?
    "chore": { pos: "noun", phrase: "daily chore", example: "Cleaning is a daily chore." },
    // I'll add a few common ones if they show up as missing, but for now relies on index.
};

// Words to verify if they are truly missing so I can generate data for them?
// Let's run a "Scan" pass first inside this script to see what's left.

const targetList = sys2000.filter(item => {
    return (!item.ref && (item.pos === 'other' || item.pos === 'unknown' || !item.pos));
});

const missingAfterLink = [];

targetList.forEach(item => {
    if (wordIndex[item.word]) {
        patchRefs[item.word] = wordIndex[item.word];
    } else {
        missingAfterLink.push(item.word);
    }
});

// For missingAfterLink, we need generated data.
// Since I cannot interactively ask the model mid-script (I am the model), 
// I will output the list of "Still Missing" words to a file, 
// AND generate a partial patch for "chore" and friends if I can.
// But mostly I want to APPLY the refs first.

console.log(`Linking ${Object.keys(patchRefs).length} words to existing sources.`);
console.log(`Still missing (Need generation): ${missingAfterLink.length} words.`);
// console.log(JSON.stringify(missingAfterLink, null, 2));

// Generate data for known missing ones that are common?
// Let's just create the script to apply what we have (Refs) 
// AND manual data for `chore` etc if they are in the missing list.

// NOTE: I will hardcode the patchData for ALL 386 words just in case? 
// No, that's too big for one go without external tool.
// I will apply refs. For the rest, I will let them be "unknown" for one more second OR generate generic "Prepared" data?
// User wants `chore` fixed. 
// If `chore` IS in missingAfterLink, I will fix it.

// Let's write the REFs to the file.
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

            // Priority 1: Link to existing
            if (patchRefs[word]) {
                const newRef = patchRefs[word];
                // Add ref
                let newLine = line.replace(/}\s*,?$/, `, ref: "${newRef}" },`);
                lines[i] = newLine;
                updateCount++;
            }
            // Priority 2: Manual patch (e.g. Chore)
            else if (patchData[word]) {
                const patch = patchData[word];
                // Replace unknown info
                // Need to parse regex carefully.
                // line: { word: "chore", meaning: "...", pos: "unknown", ... }
                let newLine = line;
                newLine = newLine.replace(/pos:\s*"[^"]*"/, `pos: "${patch.pos}"`);
                newLine = newLine.replace(/phrase:\s*"[^"]*"/, `phrase: "${patch.phrase}"`);
                newLine = newLine.replace(/example:\s*"[^"]*"/, `example: "${patch.example}"`);
                lines[i] = newLine;
                updateCount++;
            }
        }
    }
}

fs.writeFileSync(vocabPath, lines.join('\n'));
console.log(`Updated vocabulary.js with ${updateCount} matches.`);

// Return missing list to standard out for next step
if (missingAfterLink.length > 0) {
    console.log("MISSING_WORDS_JSON_START");
    console.log(JSON.stringify(missingAfterLink));
    console.log("MISSING_WORDS_JSON_END");
}
