
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let content = fs.readFileSync(vocabPath, 'utf8');

// Simple regex scan because require() might have caching issues or data structure complexities.
// match { ... pos: "unknown" ... set: "sys_2000" } logic isn't easily regexable across lines if formatted differently.
// But we know the file format is 1 line per word usually.

const lines = content.split('\n');
const unknowns = [];

lines.forEach((line, index) => {
    if (line.includes('sys_2000') && (line.includes('pos: "unknown"') || line.includes("pos: 'unknown'"))) {
        const wordMatch = line.match(/word:\s*"([^"]+)"/);
        const word = wordMatch ? wordMatch[1] : `Line ${index + 1}`;
        unknowns.push({ line: index + 1, word: word });
    }
});

console.log(`Found ${unknowns.length} items with pos: "unknown" in sys_2000.`);
if (unknowns.length > 0) {
    console.log(JSON.stringify(unknowns, null, 2));
}
