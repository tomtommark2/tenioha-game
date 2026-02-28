// Stats Engine: single source for learning metrics (perfect-only)
(function (global) {
  function resolveWordKey(wordObj, level) {
    if (wordObj && wordObj.ref && wordObj.ref !== level) {
      let refCategory = wordObj.ref;
      let refWordText = wordObj.word;
      if (wordObj.ref.includes(':')) {
        const parts = wordObj.ref.split(':');
        refCategory = parts[0];
        refWordText = parts[1];
      }
      return `${refCategory}_${refWordText}`;
    }
    return `${level}_${wordObj.word}`;
  }

  function countPerfectByCategory(gameState, vocabularyDatabase, category) {
    const words = (vocabularyDatabase && vocabularyDatabase[category]) || [];
    let count = 0;
    words.forEach((w) => {
      const k = resolveWordKey(w, category);
      if (gameState && gameState.wordStates && gameState.wordStates[k] === 'perfect') count++;
    });
    return count;
  }

  function getPerfectCountsByCEFR(gameState, vocabularyDatabase) {
    const A1 = countPerfectByCategory(gameState, vocabularyDatabase, 'junior');
    const A2 = countPerfectByCategory(gameState, vocabularyDatabase, 'basic');
    const B1 = countPerfectByCategory(gameState, vocabularyDatabase, 'daily');
    const B2 = countPerfectByCategory(gameState, vocabularyDatabase, 'exam1');
    return { A1, A2, B1, B2, total: A1 + A2 + B1 + B2 };
  }

  function buildDailySnapshot(gameState, vocabularyDatabase, dateString) {
    const c = getPerfectCountsByCEFR(gameState, vocabularyDatabase);
    return {
      date: dateString,
      total_learned: c.total,
      // backward compatibility
      wordsLearned: c.total,
      cefr_breakdown: {
        A1: c.A1,
        A2: c.A2,
        B1: c.B1,
        B2: c.B2
      }
    };
  }

  global.StatsEngine = {
    resolveWordKey,
    countPerfectByCategory,
    getPerfectCountsByCEFR,
    buildDailySnapshot
  };
})(typeof window !== 'undefined' ? window : self);
