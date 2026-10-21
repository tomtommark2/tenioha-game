const EXPECTED_APP_ID = '1:183973262426:web:eb54502c744666f07a9463';

function createAppCheckGuard({ verifyToken, mode = () => 'observe', report = () => {}, timeoutMs = 2500 }) {
    const lastReports = new Map();
    return async (req, res) => {
        const currentMode = mode();
        if (currentMode === 'off') return true;
        if (!['observe', 'enforce'].includes(currentMode)) {
            res.status(503).json({ error: '接続を確認できません。時間をおいてお試しください。', code: 'app-check/config', retryable: true });
            return false;
        }
        const token = req.headers['x-firebase-appcheck'];
        let state = 'missing', timer;
        if (token !== undefined) {
            state = 'invalid';
            if (typeof token === 'string' && token.length > 0 && token.length <= 8192) {
                try {
                    const claims = await Promise.race([Promise.resolve().then(() => verifyToken(token)),
                        new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('timeout')), timeoutMs); })]);
                    if (claims?.appId === EXPECTED_APP_ID) state = 'valid';
                } catch { /* Never log tokens, claims, identities, or verifier errors. */ }
                finally { clearTimeout(timer); }
            }
        }
        const key = `${currentMode}:${state}`, now = Date.now();
        if (!lastReports.has(key) || now - lastReports.get(key) >= 60000) {
            lastReports.set(key, now);
            try { report({ mode: currentMode, state }); } catch { /* Logging must not affect a request. */ }
        }
        if (currentMode === 'observe' || state === 'valid') return true;
        res.status(403).json({ error: '接続を確認できません。アプリを更新して再度お試しください。', code: 'app-check/invalid', retryable: true });
        return false;
    };
}

module.exports = { createAppCheckGuard, EXPECTED_APP_ID };
