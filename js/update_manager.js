// Network-based update checker. Service Worker updates can be delayed by cached
// HTML, so the app also compares the remote version file directly.
(function (global) {
    const VERSION_FILE = 'js/version.js';
    const CHECK_INTERVAL_MS = 10 * 60 * 1000;
    const AUTO_RELOAD_LIMIT = 2;
    const RELOAD_COUNT_KEY = 'vocabGame_updateReloadCount';
    const TARGET_VERSION_KEY = 'vocabGame_updateTargetVersion';

    function parseVersionParts(version) {
        return String(version || '')
            .replace(/^v/i, '')
            .split('.')
            .map((part) => parseInt(part, 10))
            .filter((part) => Number.isFinite(part));
    }

    function compareVersions(a, b) {
        const left = parseVersionParts(a);
        const right = parseVersionParts(b);
        const len = Math.max(left.length, right.length);
        for (let i = 0; i < len; i++) {
            const av = left[i] || 0;
            const bv = right[i] || 0;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }
        return 0;
    }

    function parseGameVersion(source) {
        const match = String(source || '').match(/GAME_VERSION\s*=\s*["'](v?\d+(?:\.\d+)*)["']/);
        return match ? match[1] : null;
    }

    async function fetchRemoteVersion() {
        const url = `${VERSION_FILE}?update-check=${Date.now()}`;
        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) {
            throw new Error(`Version check failed: HTTP ${response.status}`);
        }
        const source = await response.text();
        const remoteVersion = parseGameVersion(source);
        if (!remoteVersion) {
            throw new Error('Version check failed: GAME_VERSION not found');
        }
        return remoteVersion;
    }

    function noteReloadAttempt(targetVersion) {
        const previousTarget = sessionStorage.getItem(TARGET_VERSION_KEY);
        const previousCount = parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0', 10);
        const nextCount = previousTarget === targetVersion ? previousCount + 1 : 1;
        sessionStorage.setItem(TARGET_VERSION_KEY, targetVersion);
        sessionStorage.setItem(RELOAD_COUNT_KEY, String(nextCount));
        return nextCount;
    }

    function resetReloadAttemptIfCurrent() {
        const targetVersion = sessionStorage.getItem(TARGET_VERSION_KEY);
        if (targetVersion && compareVersions(global.GAME_VERSION, targetVersion) >= 0) {
            sessionStorage.removeItem(TARGET_VERSION_KEY);
            sessionStorage.removeItem(RELOAD_COUNT_KEY);
        }
    }

    async function clearAppCaches() {
        if (!('caches' in global)) return;
        const keys = await caches.keys();
        await Promise.all(keys
            .filter((key) => key.startsWith('vocab-game-'))
            .map((key) => caches.delete(key)));
    }

    async function requestServiceWorkerUpdate() {
        if (!('serviceWorker' in navigator)) return false;
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return false;
        await reg.update().catch(() => {});
        const waiting = reg.waiting || reg.installing;
        if (waiting) {
            waiting.postMessage({ type: 'SKIP_WAITING' });
            return true;
        }
        return false;
    }

    function reloadForUpdate(remoteVersion) {
        const url = new URL(global.location.href);
        url.searchParams.set('appVersion', remoteVersion);
        url.searchParams.set('updatedAt', String(Date.now()));
        global.location.replace(url.toString());
    }

    async function applyAppUpdate(remoteVersion, options = {}) {
        if (global.saveGame) {
            try { global.saveGame(); } catch (_) {}
        }

        const attempts = noteReloadAttempt(remoteVersion);
        if (attempts > AUTO_RELOAD_LIMIT && !options.force) {
            const modal = document.getElementById('updatePromptModal');
            if (modal) modal.style.display = 'flex';
            return false;
        }

        await requestServiceWorkerUpdate();
        await clearAppCaches();
        reloadForUpdate(remoteVersion);
        return true;
    }

    async function checkForUpdates(options = {}) {
        const currentVersion = global.GAME_VERSION || 'v0.0';
        const remoteVersion = await fetchRemoteVersion();
        const hasUpdate = compareVersions(remoteVersion, currentVersion) > 0;
        if (hasUpdate && options.apply) {
            await applyAppUpdate(remoteVersion, options);
        }
        return hasUpdate;
    }

    async function checkAndAutoApply() {
        try {
            resetReloadAttemptIfCurrent();
            await checkForUpdates({ apply: true });
        } catch (error) {
            console.log('Update check skipped:', error && error.message ? error.message : error);
        }
    }

    global.appUpdateManager = {
        compareVersions,
        fetchRemoteVersion,
        checkForUpdates,
        applyAppUpdate,
        checkAndAutoApply,
    };
    global.checkForUpdates = checkForUpdates;

    if (localStorage.getItem('vocabGame_disableAutoUpdate') !== 'true') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(checkAndAutoApply, 1500);
            });
        } else {
            setTimeout(checkAndAutoApply, 1500);
        }

        global.addEventListener('focus', checkAndAutoApply);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkAndAutoApply();
        });
        setInterval(checkAndAutoApply, CHECK_INTERVAL_MS);
    }
})(window);
