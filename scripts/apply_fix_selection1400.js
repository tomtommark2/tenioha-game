
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let fileContent = fs.readFileSync(vocabPath, 'utf8');

const patchData = {
    "technology": { pos: "noun", phrase: "modern technology", example: "We rely on technology every day." },
    "topic": { pos: "noun", phrase: "discuss a topic", example: "That is an interesting topic." },
    "social": { pos: "adj", phrase: "social skills", example: "He has good social skills." },
    "expensive": { pos: "adj", phrase: "expensive car", example: "It was too expensive to buy." },
    "solve": { pos: "verb", phrase: "solve a math problem", example: "Can you solve this puzzle?" },
    "seemingly": { pos: "adv", phrase: "seemingly impossible", example: "It was a seemingly simple task." },
    "site": { pos: "noun", phrase: "official site", example: "Visit our web site for details." },
    "survey": { pos: "noun", phrase: "customer survey", example: "Please complete the survey." },
    "terrible": { pos: "adj", phrase: "terrible news", example: "The weather was terrible." },
    "FALSE": { pos: "adj", phrase: "false alarm", example: "The report turned out to be false." },
    "wheel": { pos: "noun", phrase: "steering wheel", example: "He fell asleep at the wheel." },
    "sight": { pos: "noun", phrase: "lost his sight", example: "The Grand Canyon is a beautiful sight." },
    "diversity": { pos: "noun", phrase: "biological diversity", example: "We value diversity in the workplace." },
    "mammal": { pos: "noun", phrase: "land mammal", example: "A dolphin is a mammal, not a fish." },
    "fossil": { pos: "noun", phrase: "fossil remains", example: "They found a dinosaur fossil." },
    "strict": { pos: "adj", phrase: "strict teacher", example: "Her parents are very strict." },
    "thick": { pos: "adj", phrase: "thick fog", example: "The wall is three feet thick." },
    "isolate": { pos: "verb", phrase: "feel isolated", example: "Do not isolate yourself from others." },
    "dialect": { pos: "noun", phrase: "speak a dialect", example: "It is hard to understand the local dialect." },
    "colony": { pos: "noun", phrase: "ant colony", example: "They established a new colony." },
    "obesity": { pos: "noun", phrase: "childhood obesity", example: "Obesity is a major health problem." },
    "hypothesis": { pos: "noun", phrase: "support a hypothesis", example: "Evidence supports the hypothesis." },
    "alien": { pos: "noun", phrase: "illegal alien", example: "Aliens from another planet." },
    "equivalent": { pos: "adj", phrase: "roughly equivalent", example: "Silence is sometimes equivalent to agreement." },
    "distinct": { pos: "adj", phrase: "distinct advantage", example: "There is a distinct smell of gas." },
    "frustrate": { pos: "verb", phrase: "feel frustrated", example: "The delay frustrated the passengers." },
    "sum": { pos: "noun", phrase: "sum total", example: "The detailed sum is on the receipt." },
    "boundary": { pos: "noun", phrase: "national boundary", example: "Trees mark the boundary of his land." },
    "mechanism": { pos: "noun", phrase: "defense mechanism", example: "The clock has a complex mechanism." },
    "shy": { pos: "adj", phrase: "shy child", example: "Don't be shy about asking questions." },
    "literacy": { pos: "noun", phrase: "literacy rate", example: "Literacy is key to development." },
    "protein": { pos: "noun", phrase: "animal protein", example: "Eggs are a source of protein." },
    "glacier": { pos: "noun", phrase: "glacier park", example: "The glacier moves slowly." },
    "pioneer": { pos: "noun", phrase: "pioneer in the field", example: "He was a pioneer of aviation." },
    "harsh": { pos: "adj", phrase: "harsh words", example: "Winter in the north is harsh." },
    "Arctic": { pos: "noun", phrase: "Arctic Circle", example: "Explorers traveled to the Arctic." },
    "speculate": { pos: "verb", phrase: "speculate about", example: "I cannot speculate on his motives." },
    "comprehend": { pos: "verb", phrase: "fully comprehend", example: "Review the text to comprehend it better." },
    "dispose": { pos: "verb", phrase: "dispose of", example: "How should I dispose of this battery?" },
    "galaxy": { pos: "noun", phrase: "distant galaxy", example: "We live in the Milky Way galaxy." },
    "illusion": { pos: "noun", phrase: "under an illusion", example: "Mirrors can create an illusion of space." },
    "superficial": { pos: "adj", phrase: "superficial cut", example: "His charm is only superficial." },
    "disgust": { pos: "verb", phrase: "be disgusted by", example: "The smell disgusted me." },
    "flourish": { pos: "verb", phrase: "flowers flourish", example: "The business is flourishing." },
    "thrive": { pos: "verb", phrase: "thrive in the city", example: "Some animals thrive in the desert." },
    "esteem": { pos: "noun", phrase: "self-esteem", example: "She has low self-esteem." },
    "peasant": { pos: "noun", phrase: "peasant farmer", example: "Peasants worked the land." },
    "livestock": { pos: "noun", phrase: "feed livestock", example: "They raise livestock on the farm." },
    "famine": { pos: "noun", phrase: "face famine", example: "Many died during the famine." },
    "fatigue": { pos: "noun", phrase: "mental fatigue", example: "Driver fatigue causes accidents." },
    "inclined": { pos: "adj", phrase: "mechanically inclined", example: "The path is steeply inclined." },
    "inferior": { pos: "adj", phrase: "feel inferior", example: "Fake goods are of inferior quality." },
    "ugly": { pos: "adj", phrase: "ugly duckling", example: "It was an ugly situation." },
    "conform": { pos: "verb", phrase: "conform to standards", example: "Products must conform to safety rules." },
    "criterion": { pos: "noun", phrase: "main criterion", example: "Success is the only criterion." },
    "circulation": { pos: "noun", phrase: "poor circulation", example: "Cold hands indicate poor circulation." },
    "merit": { pos: "noun", phrase: "basis of merit", example: "He was promoted on merit." },
    "obscure": { pos: "adj", phrase: "obscure poet", example: "The details are still obscure." },
    "hostile": { pos: "adj", phrase: "hostile forces", example: "They entered hostile territory." },
    "supreme": { pos: "adj", phrase: "supreme leader", example: "It required supreme skill." },
    "infinite": { pos: "adj", phrase: "infinite patience", example: "Space is infinite." },
    "static": { pos: "adj", phrase: "static noise", example: "The population remained static." },
    "immense": { pos: "adj", phrase: "immense joy", example: "They faced immense difficulties." }
};

const lines = fileContent.split('\n');
let insideSelection1400 = false;
let updatedCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('selection1400: [')) {
        insideSelection1400 = true;
        continue;
    }
    if (insideSelection1400 && line.trim().startsWith(']')) {
        insideSelection1400 = false;
    }

    if (insideSelection1400) {
        const wordMatch = line.match(/word:\s*"([^"]+)"/);
        if (wordMatch) {
            const word = wordMatch[1];
            if (patchData[word]) {
                const patch = patchData[word];
                const meaningMatch = line.match(/meaning:\s*"([^"]*)"/);
                const setMatch = line.match(/set:\s*(\d+|"[^"]+")/);
                const idMatch = line.match(/id:\s*(\d+)/);

                const meaning = meaningMatch ? meaningMatch[1] : "";
                const setVal = setMatch ? setMatch[1] : "1";
                const idVal = idMatch ? idMatch[1] : null;

                let newLine = `        { word: "${word}", meaning: "${meaning}", phrase: "${patch.phrase}", pos: "${patch.pos}", example: "${patch.example}", set: ${setVal}`;
                if (idVal) newLine += `, id: ${idVal}`;
                newLine += ` },`;

                lines[i] = newLine;
                updatedCount++;
            }
        }
    }
}

console.log(`Updated ${updatedCount} lines in selection1400.`);
fs.writeFileSync(vocabPath, lines.join('\n'));
