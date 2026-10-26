const crypto = require('node:crypto');

function buildRecoveryPlan(baseline, events, keysByHash, now = Date.now()) {
    const data = baseline ? structuredClone(baseline) : {};
    data.wordStates ||= {};
    data.srsData ||= {};
    const candidates = new Map();
    let unmapped = 0;
    for (const event of events) {
        const key = keysByHash.get(event.wordHash);
        if (!key) { unmapped++; continue; }
        if (!['incorrect', 'relearning-correct', 'scheduled-correct'].includes(event.outcome)) continue;
        if (typeof event.isCorrect !== 'boolean' || (event.outcome === 'incorrect') === event.isCorrect) continue;
        const previous = candidates.get(key);
        if (!previous || Date.parse(event.updatedAt) > Date.parse(previous.updatedAt)) candidates.set(key, event);
    }
    const added = { weak: 0, learned: 0 };
    let preserved = 0;
    for (const [key, event] of candidates) {
        // Never replace later work, custom meanings, books or settings in a readable save.
        if (Object.hasOwn(data.wordStates, key) || Object.hasOwn(data.srsData, key)) { preserved++; continue; }
        const state = event.isCorrect ? 'learned' : 'weak';
        const reviewedAt = Date.parse(event.updatedAt);
        data.wordStates[key] = state;
        data.srsData[key] = { recentAnswers: [], legacyReviewState: state, dueAt: now,
            lastReviewedAt: Number.isFinite(reviewedAt) ? reviewedAt : 0,
            lastReviewScoreDate: event.lastEarnedDate, firstTryPerfect: false,
            ...(state === 'weak' ? { isRelearning: true, everWrong: true } : {}) };
        added[state]++;
    }
    data.wordKeySchemaVersion = 2;
    data.wordGroupingVersion = 1;
    data.srsSchemaVersion = 5;
    data.srsBootstrapped = true;
    data.lastSaveTime = now;
    return { data, summary: { sourceEvents: events.length, mappedUniqueKeys: candidates.size,
        unmapped, preserved, added, totalClassified: Object.values(data.wordStates).filter(state => ['weak', 'learned', 'perfect'].includes(state)).length,
        exactRecovery: false, restoredPerfect: 0, restoredAnswerHistory: false } };
}

const hashKey = key => crypto.createHash('sha256').update(key).digest('hex').slice(0, 40);
module.exports = { buildRecoveryPlan, hashKey };
