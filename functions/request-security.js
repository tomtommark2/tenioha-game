const crypto = require('node:crypto');

const SENSITIVE_ACTION_WINDOW_MS = 60000;
const SENSITIVE_ACTION_LIMIT = 5;
const SENSITIVE_ACTIONS = new Set(['checkout', 'promo']);

class SensitiveActionLimitError extends Error {
    constructor(retryAfter) {
        super('操作が続いています。1分ほど待ってからお試しください。');
        this.name = 'SensitiveActionLimitError';
        this.retryAfter = retryAfter;
    }
}

// Call only after verifying a registered Firebase identity. A fixed document
// per user/action keeps attempts bounded without trusting IP forwarding headers.
async function enforceSensitiveActionLimit(db, action, uid, clock = Date.now) {
    if (!SENSITIVE_ACTIONS.has(action) || typeof uid !== 'string' || !uid) throw new Error('Invalid sensitive action scope.');
    const userHash = crypto.createHash('sha256').update(uid).digest('hex');
    const ref = db.collection('sensitive_action_limits').doc(`${action}-${userHash}`);
    await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        // Re-evaluate time on transaction retries; a slightly slower server clock
        // must not reset another instance's already-started window.
        const now = typeof clock === 'function' ? clock() : clock;
        if (!Number.isFinite(now) || now < 0) throw new Error('Invalid sensitive action time.');
        const previous = snapshot.data() || {};
        const elapsed = Math.max(0, now - previous.startedAt);
        const sameWindow = Number.isFinite(previous.startedAt)
            && elapsed < SENSITIVE_ACTION_WINDOW_MS;
        const count = sameWindow && Number.isInteger(previous.count) && previous.count >= 0 ? previous.count : 0;
        if (count >= SENSITIVE_ACTION_LIMIT) {
            throw new SensitiveActionLimitError(Math.max(1, Math.ceil((SENSITIVE_ACTION_WINDOW_MS - elapsed) / 1000)));
        }
        transaction.set(ref, { startedAt: sameWindow ? previous.startedAt : now, count: count + 1 });
    });
}

function respondToSensitiveActionLimit(error, res) {
    if (!(error instanceof SensitiveActionLimitError)) return false;
    res.set('Retry-After', String(error.retryAfter));
    res.status(429).json({ error: error.message });
    return true;
}

module.exports = { enforceSensitiveActionLimit, respondToSensitiveActionLimit };
