/* Group the primary CEFR layers without changing the source vocabulary records. */
(function () {
    const VERSION = 1;
    const LEVELS = ['junior', 'basic', 'daily', 'exam1'];

    function build(database, utils) {
        const bySpelling = new Map();
        LEVELS.forEach(level => (database[level] || []).forEach((word, index) => {
            if (!word?.word) return;
            const entries = bySpelling.get(word.word) || [];
            entries.push({ level, index, word });
            bySpelling.set(word.word, entries);
        }));
        const groups = [];
        const byIdentity = new Map();
        const oldKeys = new Set();
        bySpelling.forEach(entries => {
            if (entries.length < 2) return;
            const first = entries[0];
            const key = utils.getWordKey(first.word, first.level, database);
            const card = {
                ...first.word,
                __groupKey: key,
                __sourceLevel: first.level,
                senses: entries.map(entry => ({ ...entry.word, __sourceLevel: entry.level })),
            };
            const group = { key, level: first.level, index: first.index, card };
            groups.push(group);
            entries.forEach(entry => byIdentity.set(`${entry.level}\u0000${entry.word.word}`, group));
        });

        const output = {};
        Object.entries(database).forEach(([level, words]) => {
            if (!Array.isArray(words)) { output[level] = words; return; }
            const seen = new Set();
            output[level] = [];
            words.forEach((word, index) => {
                const identity = utils.resolveWordIdentity(word, level, database);
                const group = byIdentity.get(`${identity.level}\u0000${identity.word}`);
                if (!group) { output[level].push(word); return; }
                oldKeys.add(utils.getWordKey(word, level, database));
                utils.getLegacyWordKeys(word, level, database).forEach(key => oldKeys.add(key));
                // Existing wordbook display resolves the first base entry's POS.
                const referenced = database[identity.level]?.find(item => item.word === identity.word);
                if (word.ref && referenced) {
                    oldKeys.add(utils.getWordKey({ ...word, pos: referenced.pos }, level, database));
                }
                if (LEVELS.includes(level)) {
                    if (group.level === level && group.index === index) output[level].push(group.card);
                } else if (!seen.has(group.key)) {
                    output[level].push({ ...word, __groupKey: group.key, senses: group.card.senses,
                        meaning: group.card.meaning, phrase: group.card.phrase, example: group.card.example,
                        ipa: group.card.ipa, pos: group.card.pos, __sourceLevel: level });
                    seen.add(group.key);
                }
            });
        });
        return { database: output, groups, oldKeys, version: VERSION };
    }

    function resetMergedHistory(state, grouping, savedVersion = 0) {
        const currentKeys = new Set(grouping.groups.map(group => group.key));
        const firstMigration = savedVersion < VERSION;
        for (const key of grouping.oldKeys) {
            if (!firstMigration && currentKeys.has(key)) continue;
            delete state.wordStates?.[key];
            delete state.srsData?.[key];
            delete state.learnedWordIntervals?.[key];
            delete state.learnedWordIntervals?.[`${key}_last`];
        }
        state.wordGroupingVersion = VERSION;
        // Scores and already earned/pending score events are not learning history.
        return firstMigration;
    }

    window.WordGrouping = Object.freeze({ build, resetMergedHistory, VERSION, LEVELS });
})();
