// Build a reproducible production queue; never changes vocabulary or learning keys.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const projectRoot = path.resolve(__dirname, '..');
const LEVEL_ORDER = ['junior', 'basic', 'daily', 'exam1', 'exam2', 'selection1400', 'selection1900', 'sys_2000'];

function readInputs(root = projectRoot) {
  const vocabularySource = fs.readFileSync(path.join(root, 'data/vocabulary.js'), 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(vocabularySource + '\n;this.database = DEFAULT_VOCABULARY;', context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/utils.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'data/word-illustrations.js'), 'utf8'), context);
  return {
    database: context.database,
    illustrations: context.window.WORD_ILLUSTRATIONS,
    utils: context.window.GameUtils,
    vocabularySha256: crypto.createHash('sha256').update(vocabularySource).digest('hex'),
  };
}

function buildQueue({ database, illustrations, utils, vocabularySha256 }) {
  const ready = new Map(illustrations.map(entry => [utils.getWordKey(entry, entry.level, database), entry]));
  const entries = new Map();
  const unresolvedReferences = [];
  const levels = [...LEVEL_ORDER.filter(level => database[level]), ...Object.keys(database).filter(level => !LEVEL_ORDER.includes(level))];
  let nounRows = 0;
  for (const level of levels) {
    for (const raw of database[level]) {
      let resolved = raw;
      if (raw.ref && raw.ref !== level) {
        const separator = raw.ref.indexOf(':');
        const refLevel = separator >= 0 ? raw.ref.slice(0, separator) : raw.ref;
        const refWord = separator >= 0 ? raw.ref.slice(separator + 1) : raw.word;
        // Match the app's resolveReferencedVocabularyWord first-spelling behavior.
        const source = database[refLevel]?.find(word => word.word === refWord);
        if (!source) {
          unresolvedReferences.push({ level, word: raw.word, ref: raw.ref });
          continue;
        }
        resolved = { ...raw, pos: source.pos, meaning: source.meaning, phrase: source.phrase, example: source.example };
      }
      if (resolved.pos !== '名') continue;
      nounRows++;
      const identity = utils.resolveWordIdentity(resolved, level, database);
      const key = utils.getWordKey(resolved, level, database);
      const existing = entries.get(key);
      if (existing) {
        existing.occurrences++;
        if (!existing.meaningVariants.includes(resolved.meaning)) existing.meaningVariants.push(resolved.meaning);
        continue;
      }
      const asset = ready.get(key);
      entries.set(key, {
        key, level: identity.level, word: identity.word, pos: identity.pos,
        meaning: resolved.meaning, phrase: resolved.phrase, example: resolved.example,
        meaningVariants: [resolved.meaning], occurrences: 1,
        status: asset ? 'ready' : 'pending', ...(asset ? { src: asset.src } : {}),
      });
    }
  }
  const all = [...entries.values()];
  return {
    schemaVersion: 1, source: 'data/vocabulary.js', vocabularySha256,
    policy: 'All nouns, A1 to A2 to B1 to B2, then remaining wordbooks; retain source order. No desirability exclusions.',
    summary: {
      nounRows, nounKeys: all.length, readyKeys: all.filter(entry => entry.status === 'ready').length,
      pendingKeys: all.filter(entry => entry.status === 'pending').length,
      uniqueReadyAssets: new Set(all.filter(entry => entry.src).map(entry => entry.src)).size,
      byLevel: Object.fromEntries(levels.map(level => [level, all.filter(entry => entry.level === level).length])),
    },
    unresolvedReferences,
    entries: all,
  };
}

if (require.main === module) {
  const queue = buildQueue(readInputs());
  if (queue.unresolvedReferences.length) throw new Error('Resolve missing vocabulary references before production.');
  if (process.argv.includes('--write')) {
    const destination = path.join(projectRoot, 'docs/experiments/noun-production/queue.json');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify(queue, null, 2) + '\n');
  }
  const nextIndex = process.argv.indexOf('--next');
  const count = nextIndex >= 0 ? Number(process.argv[nextIndex + 1]) : 20;
  if (!Number.isInteger(count) || count < 0) throw new Error('--next requires a non-negative integer.');
  console.log(JSON.stringify({ summary: queue.summary, next: queue.entries.filter(entry => entry.status === 'pending').slice(0, count) }, null, 2));
}

module.exports = { readInputs, buildQueue };
