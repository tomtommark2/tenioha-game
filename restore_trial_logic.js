
// --- TRIAL SYSTEM (Restored) ---
var trialState = {
    active: true,
    startTime: null,
    unlocked: false
};

window.initTrialSystem = function () {
    // 1. Check if globally unlocked
    const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
    if (isUnlocked) {
        trialState.unlocked = true;
        updateTrialUI();
        return;
    }

    // 2. Load Start Time
    const storedStart = localStorage.getItem('vocabGame_trialStart');
    if (storedStart) {
        trialState.startTime = parseInt(storedStart);
    } else {
        trialState.startTime = Date.now();
        localStorage.setItem('vocabGame_trialStart', trialState.startTime);
    }

    // 3. Start Timer Loop
    setInterval(updateTrialUI, 1000);
    updateTrialUI();
};

window.updateTrialUI = function () {
    const timerDisplay = document.getElementById('trialTimerDisplay');
    const overlay = document.getElementById('trialOverlay');

    // Check Unlock Status (Memory or Storage)
    if (trialState.unlocked || localStorage.getItem('vocabGame_isUnlocked') === 'true') {
        if (timerDisplay) timerDisplay.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        return;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - trialState.startTime) / 1000);
    const limit = 600; // 10 minutes
    const remaining = limit - elapsed;

    if (remaining <= 0) {
        // Time Up
        if (overlay) overlay.style.display = 'flex';
        if (timerDisplay) {
            timerDisplay.style.display = 'block';
            timerDisplay.textContent = "終了";
        }
    } else {
        // Active
        if (overlay) overlay.style.display = 'none';
        if (timerDisplay) {
            timerDisplay.style.display = 'block';
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            timerDisplay.textContent = `残り ${m}:${s.toString().padStart(2, '0')}`;
        }
    }
};

window.saveTrialState = function () {
    if (trialState.unlocked) {
        localStorage.setItem('vocabGame_isUnlocked', 'true');
    }
};

// Expose trialState global
window.trialState = trialState;

