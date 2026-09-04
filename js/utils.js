/**
 * Utils.js
 * Common utility functions shared across the application.
 */

const WORD_KEY_PREFIX = 'word-v2';
const vocabularyLookupCache = new WeakMap();

function getVocabularyLookup(vocabularyDatabase) {
    if (!vocabularyDatabase || typeof vocabularyDatabase !== 'object') return null;
    if (vocabularyLookupCache.has(vocabularyDatabase)) {
        return vocabularyLookupCache.get(vocabularyDatabase);
    }

    const lookup = new Map();
    Object.entries(vocabularyDatabase).forEach(([level, words]) => {
        if (!Array.isArray(words)) return;
        const wordsBySpelling = new Map();
        words.forEach(item => {
            if (item && item.word && !wordsBySpelling.has(item.word)) {
                wordsBySpelling.set(item.word, item);
            }
        });
        lookup.set(level, wordsBySpelling);
    });
    vocabularyLookupCache.set(vocabularyDatabase, lookup);
    return lookup;
}

function resolveWordIdentity(word, level, vocabularyDatabase) {
    const sourceLevel = (word && word.__sourceLevel) || level || '';
    let baseLevel = sourceLevel;
    let baseWord = String((word && word.word) || '');
    const reference = String((word && word.ref) || '').trim();

    if (reference.includes(':')) {
        const separator = reference.indexOf(':');
        baseLevel = reference.slice(0, separator) || sourceLevel;
        baseWord = reference.slice(separator + 1) || baseWord;
    } else if (reference && reference !== sourceLevel && reference !== level) {
        baseLevel = reference;
    }

    let pos = String((word && word.pos) || '').trim();
    if (!pos || pos === 'unknown') {
        const database = vocabularyDatabase || window.vocabularyDatabase;
        const referencedWord = getVocabularyLookup(database)?.get(baseLevel)?.get(baseWord) || null;
        pos = String((referencedWord && referencedWord.pos) || pos).trim();
    }

    return {
        level: baseLevel,
        word: baseWord,
        pos: (!pos || pos === 'unknown') ? 'other' : pos,
        sourceLevel,
    };
}

function getWordKey(word, level, vocabularyDatabase) {
    const identity = resolveWordIdentity(word, level, vocabularyDatabase);
    return [WORD_KEY_PREFIX, identity.level, identity.word, identity.pos]
        .map(value => encodeURIComponent(String(value)))
        .join(':');
}

function getLegacyWordKeys(word, level, vocabularyDatabase) {
    const identity = resolveWordIdentity(word, level, vocabularyDatabase);
    const keys = [`${identity.level}_${identity.word}`];
    const sourceWord = String((word && word.word) || '');
    if (identity.sourceLevel && sourceWord) {
        keys.push(`${identity.sourceLevel}_${sourceWord}`);
    }
    return [...new Set(keys)];
}

function hasMeaningfulLocalLearningData(saveData) {
    if (!saveData || typeof saveData !== 'object') return false;

    const hasPositiveNumber = value => Number.isFinite(Number(value)) && Number(value) > 0;
    if ([
        saveData.points,
        saveData.globalQuestionCount,
        saveData.wordsLearned
    ].some(hasPositiveNumber)) return true;

    if (Object.values(saveData.wordStates || {}).some(state => state && state !== 'unlearned')) {
        return true;
    }
    if (Object.values(saveData.actionCounts || {}).some(hasPositiveNumber)) return true;

    const hasSrsHistory = Object.values(saveData.srsData || {}).some(entry => {
        if (!entry || typeof entry !== 'object') return false;
        return hasPositiveNumber(entry.successCount)
            || hasPositiveNumber(entry.failCount)
            || hasPositiveNumber(entry.lastReviewedAt)
            || entry.everWrong === true
            || entry.firstTryPerfect === true
            || entry.isRelearning === true
            || Boolean(entry.lastReviewScoreDate);
    });
    if (hasSrsHistory) return true;

    const reviewScore = saveData.reviewScore;
    if (!reviewScore || typeof reviewScore !== 'object') return false;
    return [
        reviewScore.total,
        reviewScore.todayPoints,
        reviewScore.todayReviewed,
        reviewScore.todayCorrect
    ].some(hasPositiveNumber)
        || (Array.isArray(reviewScore.pendingEvents) && reviewScore.pendingEvents.length > 0)
        || Object.values(reviewScore.history || {}).some(day => (
            day && typeof day === 'object' && [day.points, day.reviewed, day.correct].some(hasPositiveNumber)
        ));
}

function getLoginCloudSyncDecision({
    hadExistingSaveAtBoot = false,
    localData = null,
    cloudData = null
} = {}) {
    const localTime = Number(localData && localData.lastSaveTime) || 0;
    const cloudTime = Number(cloudData && cloudData.lastSaveTime) || 0;

    // Initialization creates a timestamped empty save before Firebase auth resolves.
    // On a truly clean device, that timestamp must never outrank an existing cloud save.
    if (cloudData && hadExistingSaveAtBoot !== true && !hasMeaningfulLocalLearningData(localData)) {
        return 'restore-clean-device';
    }
    if (cloudTime > localTime) return 'prompt-restore-cloud';
    if (localTime > cloudTime) return 'keep-local';
    return 'same';
}

window.GameUtils = {
    WORD_KEY_PREFIX,
    resolveWordIdentity,
    getWordKey,
    getLegacyWordKeys,
    hasMeaningfulLocalLearningData,
    getLoginCloudSyncDecision,

    // --- SECURITY / FORMATTING ---
    escapeHtml: function (str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    },

    // --- PREMIUM STATUS ---
    // Centralized check for Premium status
    // Returns true if User is Unlocked AND Not Expired
    checkPremiumStatus: function () {
        const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
        const expiryTime = parseInt(localStorage.getItem('vocabGame_expiry') || '0');
        const now = Date.now();

        // Permanent users have year > 3000
        return (isUnlocked && (expiryTime > now));
    },

    // --- DATE / TIME ---
    // Get JST Date string YYYY-MM-DD
    getJSTDateString: function () {
        try {
            const jstFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            return jstFormatter.format(new Date());
        } catch (e) {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }
};

// Aliases for backward compatibility (Optional, or replace usage)
// window.escapeHtml = window.GameUtils.escapeHtml;
// Better to replace usage to be explicit.
