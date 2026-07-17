const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const vocabularyPath = path.join(root, "data", "vocabulary.js");
const utilsPath = path.join(root, "js", "utils.js");
const outputPath = path.join(root, "functions", "review_word_hashes.json");
const checkOnly = process.argv.includes("--check");

function loadVocabularyAndKeyBuilder() {
    const vocabularySource = fs.readFileSync(vocabularyPath, "utf8");
    const utilsSource = fs.readFileSync(utilsPath, "utf8");
    const context = vm.createContext({ window: {} });
    const database = vm.runInContext(
        `(() => {\n${vocabularySource}\nreturn DEFAULT_VOCABULARY;\n})()`,
        context,
        { timeout: 10000 }
    );
    vm.runInContext(utilsSource, context, { timeout: 10000 });
    return {
        database,
        getWordKey: context.window.GameUtils.getWordKey,
    };
}

function hashWordKey(value) {
    return crypto.createHash("sha256").update(value).digest("hex").slice(0, 40);
}

const { database, getWordKey } = loadVocabularyAndKeyBuilder();
const hashes = new Set();
Object.entries(database).forEach(([level, words]) => {
    if (!Array.isArray(words)) return;
    words.forEach((word) => hashes.add(hashWordKey(getWordKey(word, level, database))));
});

const output = `${JSON.stringify([...hashes].sort(), null, 2)}\n`;
if (checkOnly) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
    if (current !== output) {
        console.error("review_word_hashes.json is out of date. Run npm run generate:review-word-hashes.");
        process.exit(1);
    }
    console.log(`OK: ${hashes.size} review word keys`);
} else {
    fs.writeFileSync(outputPath, output, "utf8");
    console.log(`Generated ${hashes.size} review word keys: ${outputPath}`);
}
