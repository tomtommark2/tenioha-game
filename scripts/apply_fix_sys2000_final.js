
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let lines = fs.readFileSync(vocabPath, 'utf8').split('\n');

// Use Japanese POS tags directly
const patchData = {
    "wheel": { pos: "名", phrase: "steering wheel", example: "He gripped the steering wheel." },
    "sight": { pos: "名", phrase: "out of sight", example: "They waved until he was out of sight." },
    "solve": { pos: "動", phrase: "solve a problem", example: "We need to solve this issue." },
    "site": { pos: "名", phrase: "construction site", example: "Safety is important at the site." },
    "survey": { pos: "名", phrase: "conduct a survey", example: "They conducted a survey of voters." },
    "expensive": { pos: "形", phrase: "expensive car", example: "That is an expensive watch." },
    "terrible": { pos: "形", phrase: "terrible mistake", example: "I made a terrible mistake." },
    "strict": { pos: "形", phrase: "strict rules", example: "The school has strict rules." },
    "oblige": { pos: "動", phrase: "be obliged to", example: "I was obliged to help him." },
    "frustrate": { pos: "動", phrase: "frustrate efforts", example: "The rain frustrated our plans." },
    "foster": { pos: "動", phrase: "foster a child", example: "They foster good relations." },
    "diminish": { pos: "動", phrase: "diminish value", example: "His influence diminished over time." },
    "sum": { pos: "名", phrase: "sum of money", example: "A large sum was stolen." },
    "equivalent": { pos: "形", phrase: "equivalent to", example: "One dollar is equivalent to 100 cents." },
    "parallel": { pos: "形", phrase: "parallel lines", example: "The road runs parallel to the river." },
    "prey": { pos: "名", phrase: "bird of prey", example: "The eagle hunted its prey." },
    "distress": { pos: "名", phrase: "in distress", example: "The ship was in distress." },
    "circulation": { pos: "名", phrase: "blood circulation", example: "Exercise improves circulation." },
    "gravity": { pos: "名", phrase: "center of gravity", example: "Gravity pulls objects down." },
    "alien": { pos: "名", phrase: "alien species", example: "Alien life forms." },
    "inclined": { pos: "形", phrase: "inclined to agree", example: "I am inclined to believe him." },
    "FALSE": { pos: "形", phrase: "false alarm", example: "It was a false statement." }, // "FALSE" case sensitive in JS? check file.
    "colony": { pos: "名", phrase: "ant colony", example: "The British established a colony." }
};

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

    // Special handling for lowercase keys if needed, but file seems to have "FALSE" as uppercase?
    // scan output said "FALSE".

    if (insideSys2000) {
        const wordMatch = line.match(/word:\s*"([^"]+)"/);
        if (wordMatch) {
            const word = wordMatch[1];
            if (patchData[word]) {
                const patch = patchData[word];
                // Replace invalid data with valid data
                let newLine = line;

                // Regex to safeguard replacement even if keys are missing (add them if missing logic is complex, 
                // but usually they exist as empty/unknown).
                // Assuming format: { word: "x", meaning: "y", phrase: "", pos: "unknown", ... }

                if (newLine.includes('pos:')) {
                    newLine = newLine.replace(/pos:\s*"[^"]*"/, `pos: "${patch.pos}"`);
                } else {
                    // If missing, append? Unlikely for sys_2000 based on structure, but safe to ignore for now if structure is consistent.
                }

                if (newLine.includes('phrase:')) {
                    newLine = newLine.replace(/phrase:\s*"[^"]*"/, `phrase: "${patch.phrase}"`);
                }

                if (newLine.includes('example:')) {
                    newLine = newLine.replace(/example:\s*"[^"]*"/, `example: "${patch.example}"`);
                }

                lines[i] = newLine;
                updatedCount++;
            }
        }
    }
}

console.log(`Updated ${updatedCount} words in sys_2000.`);
fs.writeFileSync(vocabPath, lines.join('\n'));
