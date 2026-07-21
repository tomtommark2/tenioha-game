const crypto = require("crypto");

const REVIEW_SCORE_INTERVALS = new Set([1, 3, 7, 14, 30, 60]);
const REVIEW_SCORE_OUTCOMES = new Set(["incorrect", "relearning-correct", "scheduled-correct"]);

function firebaseSignInProvider(userRecord = {}) {
    return userRecord.firebase?.sign_in_provider || "";
}

function isAnonymousFirebaseUser(userRecord = {}) {
    return firebaseSignInProvider(userRecord) === "anonymous";
}

function guestRankingName(uid) {
    const suffix = String(uid || "guest").slice(-4).padStart(4, "0");
    return `ゲスト${suffix}`;
}

function calculateReviewEventPoints(outcome, intervalDays) {
    if (outcome === "incorrect") return 1;
    if (outcome === "relearning-correct") return 2;
    if (outcome !== "scheduled-correct") return 0;

    const pointsByInterval = new Map([
        [1, 3],
        [3, 3],
        [7, 4],
        [14, 5],
        [30, 6],
        [60, 7],
    ]);
    return pointsByInterval.get(intervalDays) || 0;
}

function reviewWordKeyHash(wordKey) {
    return crypto.createHash("sha256").update(wordKey).digest("hex").slice(0, 40);
}

function reviewEventIdHash(eventId) {
    return crypto.createHash("sha256").update(eventId).digest("hex").slice(0, 32);
}

function nextRecentReviewEventIds(values, eventIdHash, limit = 10) {
    const recent = Array.isArray(values)
        ? values.filter((value) => typeof value === "string").slice(-(limit - 1))
        : [];
    if (recent.includes(eventIdHash)) return null;
    return [...recent, eventIdHash];
}

module.exports = {
    REVIEW_SCORE_INTERVALS,
    REVIEW_SCORE_OUTCOMES,
    calculateReviewEventPoints,
    firebaseSignInProvider,
    guestRankingName,
    isAnonymousFirebaseUser,
    nextRecentReviewEventIds,
    reviewEventIdHash,
    reviewWordKeyHash,
};
