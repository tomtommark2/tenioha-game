// Today's activity is device-local and independent of the free-plan allowance.
window.DailyStudy = (() => {
    const STORAGE_KEY = 'vocabGame_dailyStudy_v1';
    const SETTINGS_KEY = 'vocabGame_dailyStudySettings_v1';
    const IDLE_MS = 10000;
    const SAVE_INTERVAL_MS = 15000;
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const DAY_MS = 86400000;
    let state;
    let showTimer = true;
    let dirty = false;
    let lastSaveAt = 0;
    let activeUntil = 0;
    let accountedAt = Date.now();
    let initialized = false;
    let panel;
    let button;

    const dayKey = now => new Date(now + JST_OFFSET_MS).toISOString().slice(0, 10);
    const empty = date => ({ date, elapsedMs: 0, answered: 0, perfectKeys: new Set(), weakKeys: new Set(), recoveredKeys: new Set() });
    const cleanKeys = value => new Set(Array.isArray(value)
        ? value.filter(key => typeof key === 'string' && key.length < 500).slice(0, 20000) : []);

    function load() {
        const now = Date.now();
        state = empty(dayKey(now));
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved?.date === state.date) {
                state.elapsedMs = Math.min(DAY_MS, Math.max(0, Number(saved.elapsedMs) || 0));
                state.answered = Math.min(1000000, Math.max(0, Math.floor(Number(saved.answered) || 0)));
                state.perfectKeys = cleanKeys(saved.perfectKeys);
                state.weakKeys = cleanKeys(saved.weakKeys);
                state.recoveredKeys = new Set([...cleanKeys(saved.recoveredKeys)].filter(key => state.perfectKeys.has(key)));
            }
            const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
            showTimer = settings?.showTimer !== false;
        } catch { /* Corrupt optional statistics must not prevent learning. */ }
        dirty = false;
        accountedAt = now;
        activeUntil = 0;
    }

    function save() {
        if (!dirty) return;
        lastSaveAt = Date.now();
        try {
            // Keep the existing on-disk arrays; Sets are only an in-memory lookup.
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state,
                perfectKeys: [...state.perfectKeys], weakKeys: [...state.weakKeys], recoveredKeys: [...state.recoveredKeys]
            }));
            dirty = false;
        } catch {
            setText('dailyStudyStorageStatus', 'この端末に保存できません。');
        }
    }

    function settle(now = Date.now()) {
        if (!state) load();
        if (now < accountedAt) activeUntil = 0;
        const today = dayKey(now);
        if (state.date !== today) {
            state = empty(today);
            // Only today's total is retained; no need to iterate over past days.
            const midnight = Math.floor((now + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS;
            accountedAt = Math.max(accountedAt, midnight);
            dirty = true;
        }
        const elapsed = Math.max(0, Math.min(now, activeUntil) - accountedAt);
        if (elapsed > 0) {
            state.elapsedMs = Math.min(DAY_MS, state.elapsedMs + elapsed);
            dirty = true;
        }
        accountedAt = now;
    }

    function canStudy() {
        return typeof learningSessionStarted !== 'undefined' && learningSessionStarted
            && !!window.gameState?.currentWord && !document.hidden
            && !document.body.classList.contains('dismissible-modal-open')
            && document.getElementById('trialOverlay')?.style.display !== 'flex';
    }

    function touch() {
        settle();
        if (canStudy()) activeUntil = Date.now() + IDLE_MS;
        render();
    }

    function pause() {
        settle();
        activeUntil = 0;
        save();
        render();
    }

    function captureAnswer(key) {
        settle();
        return {
            date: state.date, answered: state.answered,
            perfect: state.perfectKeys.has(key), weak: state.weakKeys.has(key),
            recovered: state.recoveredKeys.has(key)
        };
    }

    function recordAnswer(key, previous, next) {
        settle();
        state.answered++;
        if (previous === 'weak') state.weakKeys.add(key);
        if (previous !== 'perfect' && next === 'perfect') {
            state.perfectKeys.add(key);
            if (state.weakKeys.has(key)) state.recoveredKeys.add(key);
        }
        dirty = true;
        save();
        touch();
    }

    function undoAnswer(key, snapshot) {
        settle();
        // Yesterday's Undo must not modify today's counters or rewind real time.
        if (!snapshot || snapshot.date !== state.date) return;
        state.answered = snapshot.answered;
        for (const [property, present] of [
            ['perfectKeys', snapshot.perfect], ['weakKeys', snapshot.weak], ['recoveredKeys', snapshot.recovered]
        ]) {
            if (present) state[property].add(key);
            else state[property].delete(key);
        }
        dirty = true;
        save();
        touch();
    }

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element && element.textContent !== value) element.textContent = value;
    }

    function renderTime() {
        if (!state || document.hidden) return;
        const time = formatTime(state.elapsedMs);
        if (panel?.style.display !== 'none') setText('dailyStudyElapsed', time);
        if (showTimer) {
            setText('dailyStudyTimerValue', time);
            document.getElementById('dailyStudyTimerDisplay')?.classList.toggle('is-paused', Date.now() >= activeUntil);
        }
    }

    function render() {
        if (!state || document.hidden) return;
        renderTime();
        setText('dailyStudyAnswered', state.answered.toLocaleString('ja-JP'));
        setText('dailyStudyPerfect', state.perfectKeys.size.toLocaleString('ja-JP'));
        setText('dailyStudyRecovered', state.recoveredKeys.size.toLocaleString('ja-JP'));
        const timer = document.getElementById('dailyStudyTimerDisplay');
        if (timer) timer.hidden = !showTimer;
        const toggle = document.getElementById('dailyStudyShowTimer');
        if (toggle) toggle.checked = showTimer;
    }

    function positionPanel() {
        if (!panel || panel.style.display === 'none') return;
        const sheet = panel.querySelector('.daily-study-panel');
        const hero = document.getElementById('heroCharacter').getBoundingClientRect();
        const categories = document.getElementById('modeButtonsShell').getBoundingClientRect();
        const shell = document.querySelector('.app-shell').getBoundingClientRect();
        const width = Math.min(320, innerWidth - 24);
        sheet.style.width = `${width}px`;
        const left = Math.max(12, Math.min(shell.left + 12, innerWidth - width - 12));
        // The sprite box contains transparent padding; categories share its drawn foot line.
        const top = Math.max(12, Math.min(categories.bottom + 14, innerHeight - sheet.offsetHeight - 12));
        sheet.style.left = `${left}px`;
        sheet.style.top = `${top}px`;
        sheet.style.setProperty('--daily-pointer-left', `${Math.max(24, Math.min(width - 24, hero.left + hero.width / 2 - left))}px`);
    }

    function open() {
        pause();
        if (typeof closeLevelSelector === 'function') closeLevelSelector();
        const menu = document.getElementById('otherMenuDropdown');
        if (menu?.style.display === 'block' && typeof toggleOtherMenu === 'function') toggleOtherMenu();
        if (typeof focusWithoutScrolling === 'function') focusWithoutScrolling(button);
        panel.style.display = 'block';
        button.setAttribute('aria-expanded', 'true');
        renderTime();
        positionPanel();
    }

    function close() {
        panel.style.display = 'none';
        button.setAttribute('aria-expanded', 'false');
    }

    function reset() {
        state = empty(dayKey(Date.now()));
        activeUntil = 0;
        accountedAt = Date.now();
        dirty = true;
        save();
        render();
    }

    function tick() {
        if (document.hidden) return;
        const now = Date.now();
        const dayChanged = state.date !== dayKey(now);
        if (!activeUntil && !dirty && !dayChanged) return;
        if (!canStudy()) activeUntil = Math.min(activeUntil, accountedAt);
        settle(now);
        if (now >= activeUntil) activeUntil = 0;
        if (dirty && now - lastSaveAt >= SAVE_INTERVAL_MS) save();
        if (dayChanged) render();
        else renderTime();
    }

    function init() {
        if (initialized) return;
        initialized = true;
        load();
        panel = document.getElementById('dailyStudyModal');
        button = document.getElementById('dailyStudyButton');
        button.addEventListener('click', open);
        document.getElementById('dailyStudyTimerDisplay').addEventListener('click', open);
        document.getElementById('dailyStudyClose').addEventListener('click', close);
        document.getElementById('dailyStudyShowTimer').addEventListener('change', event => {
            showTimer = event.target.checked;
            try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ showTimer })); }
            catch { setText('dailyStudyStorageStatus', '設定を保存できません。'); }
            render();
        });
        // No mousemove/scroll tracking: only deliberate interaction with the lesson.
        const studyAction = event => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('#cardsArea, #exampleArea, #wordIllustrationSlot')) touch();
            else pause();
        };
        document.addEventListener('pointerdown', studyAction, true);
        document.addEventListener('keydown', event => {
            if (['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) studyAction(event);
        }, true);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pause();
            else { settle(); render(); }
        });
        window.addEventListener('blur', pause);
        window.addEventListener('pagehide', pause);
        window.addEventListener('beforeunload', pause);
        window.addEventListener('resize', positionPanel);
        window.addEventListener('scroll', positionPanel, { passive: true });
        window.addEventListener('storage', event => {
            if (event.key === STORAGE_KEY || event.key === SETTINGS_KEY || event.key === null) {
                load();
                render();
            }
        });
        setInterval(tick, 1000);
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
    return { touch, pause, captureAnswer, recordAnswer, undoAnswer, open, close, reset };
})();
window.closeDailyStudy = () => window.DailyStudy.close();
