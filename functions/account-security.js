const BLOCKLIST_PATH = 'security_private/blocklist';

function validBlocklist(value) {
    return value?.schemaVersion === 1 && Array.isArray(value.blockedUids) && Array.isArray(value.blockedEmails)
        && [...value.blockedUids, ...value.blockedEmails].every(item => typeof item === 'string' && item.length > 0);
}

function createAccountGuard({ db, now = Date.now, timeoutMs = 1500 }) {
    let cache = null, cachedAt = 0, reading = null;
    async function readBlocklist() {
        if (cache && now() - cachedAt >= 0 && now() - cachedAt < 30000) return cache;
        if (!reading) {
            reading = (async () => {
                let timer;
                try {
                    const snapshot = await Promise.race([db.doc(BLOCKLIST_PATH).get(),
                        new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('timeout')), timeoutMs); })]);
                    const data = snapshot.data();
                    if (!snapshot.exists || !validBlocklist(data)) throw new Error('Blocklist is not ready.');
                    cache = data;
                    cachedAt = now();
                    return data;
                } finally { clearTimeout(timer); }
            })().finally(() => { reading = null; });
        }
        return reading;
    }
    return async user => {
        let data;
        try { data = await readBlocklist(); }
        catch { throw Object.assign(new Error('現在アカウントを確認できません。時間をおいてお試しください。'), { status: 503 }); }
        if (data.blockedUids.includes(user.uid) || (typeof user.email === 'string' && data.blockedEmails.includes(user.email))) {
            throw Object.assign(new Error('このアカウントでは現在利用できません。'), { status: 403 });
        }
        return user;
    };
}

module.exports = { BLOCKLIST_PATH, validBlocklist, createAccountGuard };
