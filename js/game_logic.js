// Safe declaration to prevent duplicate errors
var gameState = window.gameState || {
    points: 0,
    currentMode: 'unlearned',
    currentLevel: 'basic',
    currentWordIndex: 0,
    currentWord: null,
    wordStates: {},
    learnedWordIntervals: {},
    globalQuestionCount: 0,
    sessionStartTime: Date.now(),
    meaningCardFlipped: false,
    isReviewWord: false,
    autoMode: false,
    randomMode: false,
    posFilters: ['名', '動', '形', '副', '助', '前', '接', '代', 'other'], // Active POS filters
    vocabLevel: 1,
    wordsLearned: 0, // Total words moved from unlearned
    dailyStats: { date: null }, // Only date tracking needed for Daily Reset logic
    dailyHistory: [], // New: Track past daily stats for averages
    firstPlayedAt: null, // New: Track start date for Real Average calc
    actionCounts: { // New: Detailed Action Tracking for Stats
        unlearned_correct: 0,
        unlearned_incorrect: 0,
        weak_correct: 0,
        weak_incorrect: 0,
        learned_correct: 0,
        learned_incorrect: 0,
        perfect_correct: 0,
        perfect_incorrect: 0
    }
};
window.gameState = gameState; // Expose for fallback scripts

// Initialize with default or empty
var vocabularyDatabase = (typeof vocabularyDatabase !== 'undefined') ? vocabularyDatabase : ((typeof DEFAULT_VOCABULARY !== 'undefined') ? JSON.parse(JSON.stringify(DEFAULT_VOCABULARY)) : {
    basic: [],
    daily: [],
    exam1: [],
    exam2: [],
    junior: []
});


// Merge Junior data if loaded via temp variable


var vocabulary = [];
var autoTimer = null;
var gameAudioContext = null; // Renamed to avoid collisions
var gameStateHistory = []; // Stack to store previous states

// Save current state to history (Max 1 step for now)
function saveState() {
    // Deep copy gameState
    const stateSnapshot = JSON.parse(JSON.stringify(gameState));
    gameStateHistory.push(stateSnapshot);
    // Limit history to 1 step as per requirement (can be increased)
    if (gameStateHistory.length > 5) {
        gameStateHistory.shift();
    }
    updateUndoButton();
}

// Restore last state
function undoLastAction() {
    if (gameStateHistory.length === 0) return;

    const previousState = gameStateHistory.pop();
    gameState = previousState;

    // Restore UI
    showWord(gameState.currentWord);
    updateDisplay();
    updateUndoButton();

    // Re-apply current mode button styles if needed
    updateModeButtons();
}

function updateUndoButton() {
    const btn = document.getElementById('undoBtn');
    if (btn) {
        btn.disabled = gameStateHistory.length === 0;
    }
}

// --- Trial System Config ---
var TRIAL_CONFIG = (typeof TRIAL_CONFIG !== 'undefined') ? TRIAL_CONFIG : {
    LIMIT_SECONDS: 600, // 10 minutes

    STORAGE_KEY: "vocabGame_trialState_v2" // Changed key to force reset/migration if needed, or just keep same
};

var trialState = (typeof trialState !== 'undefined') ? trialState : {
    unlocked: false,
    lastPlayDate: null,
    playTimeSeconds: 0
};

var lastTickTime = (typeof lastTickTime !== 'undefined') ? lastTickTime : Date.now();

// Initialize Trial
function initTrialSystem() {
    try {
        const savedTrial = localStorage.getItem(TRIAL_CONFIG.STORAGE_KEY);

        // Get Current Date in JST (Robust)
        let today;
        if (window.GameUtils && window.GameUtils.getJSTDateString) {
            today = window.GameUtils.getJSTDateString();
        } else {
            const d = new Date();
            today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        if (savedTrial) {
            try {
                const parsed = JSON.parse(savedTrial);
                trialState = { ...trialState, ...parsed };
            } catch (e) {
                console.error("Trial save corrupted", e);
            }
        }

        // Expose for debugging
        window.trialState = trialState;

        // Daily Reset (JST Midnight)
        if (trialState.lastPlayDate !== today) {
            console.log("New Day detected for Trial:", today);
            trialState.lastPlayDate = today;
            // Only reset time if we confirm it's a new day and not a glitch
            if (!trialState.unlocked) {
                trialState.playTimeSeconds = 0;
            }
            saveTrialState();
        }

        // Initialize Tick Time
        lastTickTime = Date.now();

        // Toggle UI based on state
        updateTrialUI();

        // Check if already over limit
        checkTrialLimit();

        // Add Safety Saves
        window.addEventListener('beforeunload', saveTrialState);
        window.addEventListener('pagehide', saveTrialState); // Mobile safeguard
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveTrialState();
        });

        // Start Timer Loop
        setInterval(updateTrialTimer, 1000);
    } catch (e) {
        console.error("Trial System Init Failed:", e);
        // Fallback: Start timer anyway to ensure limits enforced if possible
        setInterval(updateTrialTimer, 1000);
    }
}

function saveTrialState() {
    localStorage.setItem(TRIAL_CONFIG.STORAGE_KEY, JSON.stringify(trialState));
}

function updateTrialTimer() {
    // 1. Sync with global unlock status (Authority from Cloud/Login)
    const globalUnlock = localStorage.getItem('vocabGame_isUnlocked') === 'true';

    // Force sync if mismatch (Fixes "Timer Unlocked but Stats Locked" bug)
    if (trialState.unlocked !== globalUnlock) {
        // Only allow auto-lock/unlock if it's a clear mismatch with authority
        console.log(`Syncing Trial State: ${trialState.unlocked} -> ${globalUnlock}`);
        trialState.unlocked = globalUnlock;
        saveTrialState();
        updateTrialUI();
    }

    if (trialState.unlocked) {
        updateTrialUI(); // Ensure UI is hidden
        return;
    }

    const now = Date.now();
    const deltaSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    // Only count logical time flow. 
    if (deltaSeconds > 0) {
        // Cap absurdly large deltas (e.g. system clock change) to avoid instant lock
        // But we want to prevent cheating. 
        // For now, trust the delta unless it's > 1 day.
        trialState.playTimeSeconds += deltaSeconds;
    }

    // Save every ~5 seconds
    if (Math.floor(trialState.playTimeSeconds) % 5 === 0) {
        saveTrialState();
    }

    updateTrialUI();
    checkTrialLimit();
}

function updateTrialUI() {
    const timerDisplay = document.getElementById('trialTimerDisplay');
    if (!timerDisplay) return;

    if (trialState.unlocked) {
        timerDisplay.style.display = 'none';
        return;
    }

    timerDisplay.style.display = 'block';

    const remaining = Math.max(0, TRIAL_CONFIG.LIMIT_SECONDS - Math.floor(trialState.playTimeSeconds));
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60);

    // Format mm:ss
    timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // Warning color if low
    if (remaining < 60) {
        timerDisplay.style.color = '#d63031';
        timerDisplay.style.borderColor = '#d63031';
        timerDisplay.style.backgroundColor = 'rgba(214, 48, 49, 0.1)';
    }
}

function checkTrialLimit() {
    if (trialState.unlocked) return;

    if (trialState.playTimeSeconds >= TRIAL_CONFIG.LIMIT_SECONDS) {
        showLockScreen();
    }
}

function showLockScreen() {
    const overlay = document.getElementById('trialOverlay');
    if (overlay.style.display !== 'flex') {
        overlay.style.display = 'flex';
        // Stop any game audio or timers here if needed
        clearAutoTimer();
    }
}

// Old unlockGame removed. Now using bridge function at bottom.

function init() {
    loadGame();

    // Ensure compatibility with old saves if level names changed
    if (!vocabularyDatabase[gameState.currentLevel]) {
        gameState.currentLevel = 'basic';
    }

    document.addEventListener('click', () => {
        // Initialize audio context on first interaction
        if (!audioWakeLockSet) {
            enableAudioStayAwake();
        }
        if (typeof gameAudioContext !== 'undefined' && gameAudioContext && gameAudioContext.state === 'suspended') {
            gameAudioContext.resume();
        }
    }, { once: true }); // Only needs to run once

    // BUG FIX: Sync Level Buttons with Loaded State
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    // Check for standard level buttons
    const activeBtn = document.querySelector(`.level-btn[data-level="${gameState.currentLevel}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else if (gameState.currentLevel.startsWith('selection')) {
        // Check for Wordbook button
        const wbBtn = document.getElementById('wordbookBtn');
        if (wbBtn) wbBtn.classList.add('active');
    }

    setupEventListeners();
    setupPOSFilters(); // Need to call this to attach listeners to new checkboxes

    // MUST load vocabulary before updateDisplay
    if (vocabulary.length === 0 && vocabularyDatabase[gameState.currentLevel].length > 0) {
        loadVocabularyForLevel();
        // If states are empty, init them
        if (Object.keys(gameState.wordStates).filter(k => k.startsWith(gameState.currentLevel)).length === 0) {
            initializeWordStates();
        }
    }

    updateDisplay();
    updateDisplay();
    // Initialize Daily Stats date if missing
    checkDailyReset();

    // Initialize Trial System (Time Limit)
    if (typeof initTrialSystem === 'function') {
        initTrialSystem();
    }

    showNextWord();
}

function checkDailyReset() {
    // Robust YYYY-MM-DD format (Local Time)
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Ensure dailyStats object exists
    if (!gameState.dailyStats) {
        gameState.dailyStats = { date: today, answers: 0 };
    }

    if (gameState.dailyStats.date !== today) {
        console.log("Resetting Daily Stats for new day:", today);

        // Push yesterday's stats to history if valid (using wordsLearned diff if needed, but for now just date)
        // Actually, updateDailyHistory() handles history sync. This just resets the temp tracker.

        gameState.dailyStats = {
            date: today
        };
        // Trigger save to persist the reset state
        saveGame();
    }
}



function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const level = btn.dataset.level;
            if (!level) return; // Skip buttons like Wordbook that don't switch level directly
            switchLevel(level);
        });
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const mode = btn.dataset.mode;
            gameState.currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showNextWord();
            saveGame();
        });
    });

    document.getElementById('autoModeToggle').addEventListener('click', () => {
        gameState.autoMode = !gameState.autoMode;
        const checkbox = document.getElementById('autoCheckbox');
        if (gameState.autoMode) {
            checkbox.classList.add('checked');
            startAutoTimer();
        } else {
            checkbox.classList.remove('checked');
            clearAutoTimer();
        }
    });

    document.getElementById('randomToggle').addEventListener('click', () => {
        gameState.randomMode = !gameState.randomMode;
        const checkbox = document.getElementById('randomCheckbox');
        if (gameState.randomMode) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
        updateModeButtons();
        showNextWord();
        saveGame();
    });

    // POS Filter checkboxes
    setupPOSFilters();
    document.getElementById('speakerBtn').addEventListener('click', () => {
        if (gameState.currentWord) {
            speakWord(gameState.currentWord.word);
        }
    });

    document.getElementById('addWordsBtn').addEventListener('click', addNextWordSet);

    setupCardListeners();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.split('\n');
    const level = gameState.currentLevel;
    vocabularyDatabase[level] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // CSV format: word, meaning, pos, example, set
        // If 6 columns, assume 6th is phrase, otherwise fallback
        const parts = line.split(',');
        if (parts.length >= 5) {
            const wordObj = {
                word: parts[0].trim(),
                meaning: parts[1].trim(),
                pos: parts[2].trim(),
                example: parts[3].trim(),
                set: parseInt(parts[4].trim())
            };

            if (parts.length >= 6) {
                wordObj.phrase = parts[5].trim();
            } else {
                // Fallback logic if phrase is missing
                wordObj.phrase = wordObj.meaning;
            }

            vocabularyDatabase[level].push(wordObj);
        }
    }

    loadVocabularyForLevel();
    initializeWordStates();
    document.getElementById('fileInfo').textContent = `✅ ${vocabularyDatabase[level].length}語を読み込みました`;
    showNextWord();
    saveGame();
}

function switchLevel(level) {
    gameState.currentLevel = level;
    // v2.80: Reset Decks on Level Switch to prevent category mixing
    gameState.decks = null;

    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));

    const targetBtn = document.querySelector(`.level-btn[data-level="${level}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    } else if (level.startsWith('selection')) {
        // Highlight Wordbook button if we are in a special wordbook mode
        const wbBtn = document.getElementById('wordbookBtn');
        if (wbBtn) wbBtn.classList.add('active');
    }

    loadVocabularyForLevel();
    initializeWordStates();
    updateDisplay();
    showNextWord();
    saveGame();
}

function loadVocabularyForLevel() {
    if (gameState.currentLevel.startsWith('selection') || gameState.currentLevel === 'sys_2000') {
        const rawWords = vocabularyDatabase[gameState.currentLevel] || [];
        vocabulary = rawWords.map(v => {
            let processed = v;
            if (v.ref && v.ref !== gameState.currentLevel) {
                let refCategory = v.ref;
                let refWordText = v.word;

                if (v.ref.includes(':')) {
                    const parts = v.ref.split(':');
                    refCategory = parts[0];
                    refWordText = parts[1];
                }

                const refArray = vocabularyDatabase[refCategory];
                if (refArray) {
                    // Find match by word text
                    const refWord = refArray.find(r => r.word === refWordText);
                    if (refWord) {
                        // Merge referenced data (meanings, examples) but keep selection-specific metadata (set, id)
                        processed = {
                            ...v,
                            meaning: refWord.meaning,
                            phrase: refWord.phrase,
                            example: refWord.example,
                            pos: refWord.pos
                        };
                    }
                }
            }

            // Fallback for missing data
            if (!processed.pos || processed.pos === 'unknown') {
                processed.pos = 'other';
            }
            if (!processed.meaning) {
                processed.meaning = '（データ準備中）';
            }

            return processed;
        }).filter(v => {
            // Always include if set is not a number (e.g. "system") or matches current level logic
            if (typeof v.set !== 'number') return true;
            return v.set <= gameState.vocabLevel;
        });

    } else {
        // Standard Categories (Basic, Daily, etc.)
        vocabulary = vocabularyDatabase[gameState.currentLevel] || [];
    }
    // Expose Total for UI Prediction
    gameState.currentLevelTotal = vocabulary.length;
}

function getWordKey(word, level) {
    // Generalize shared progress for any word with a reference
    if (word.ref && word.ref !== level) {
        let refCategory = word.ref;
        let refWordText = word.word;

        if (word.ref.includes(':')) {
            const parts = word.ref.split(':');
            refCategory = parts[0];
            refWordText = parts[1];
        }

        return `${refCategory}_${refWordText}`;
    }
    return `${level}_${word.word}`;
}

function initializeWordStates() {
    vocabulary.forEach(v => {
        const key = getWordKey(v, gameState.currentLevel);
        if (!gameState.wordStates[key]) {
            gameState.wordStates[key] = 'unlearned';
        }
    });
}

// --- CLOUD SYNC HELPERS (v2.15) ---
window.isDirty = false; // Tracks if local changes need saving

function saveGame() {
    const data = {
        points: gameState.points,
        wordStates: gameState.wordStates,
        learnedWordIntervals: gameState.learnedWordIntervals,
        globalQuestionCount: gameState.globalQuestionCount,
        currentLevel: gameState.currentLevel,
        currentMode: gameState.currentMode,
        vocabLevel: gameState.vocabLevel,
        wordsLearned: gameState.wordsLearned, // Ensure wordsLearned is saved
        dailyStats: gameState.dailyStats, // Fix: Persist Daily Stats
        dailyHistory: gameState.dailyHistory, // Persist History
        lastSaveTime: Date.now(), // Track local save time for Sync Logic
        firstPlayedAt: gameState.firstPlayedAt, // Persist Start Date
        actionCounts: gameState.actionCounts // Persist Detailed Action Counts
    };
    localStorage.setItem('vocabClickerSave', JSON.stringify(data));

    // Mark as Dirty for Cloud Sync
    window.isDirty = true;

    // Leaderboard Sync (Reference defined at bottom)
    if (typeof attemptScoreSync === 'function') {
        attemptScoreSync();
    }
}

function loadGame() {
    const saved = localStorage.getItem('vocabClickerSave');
    if (saved) {
        const data = JSON.parse(saved);
        gameState = { ...gameState, ...data };

        // Backfill firstPlayedAt if missing
        if (!gameState.firstPlayedAt) {
            gameState.firstPlayedAt = Date.now();
        }
        if (!gameState.actionCounts) {
            gameState.actionCounts = {
                unlearned_correct: 0,
                unlearned_incorrect: 0,
                weak_correct: 0,
                weak_incorrect: 0,
                learned_correct: 0,
                learned_incorrect: 0,
                perfect_correct: 0,
                perfect_incorrect: 0
            };
        }

        // Fix: Update global reference for fallback scripts
        window.gameState = gameState;

        // Initialize Decks if missing (v2.79)
        if (!gameState.decks) {
            gameState.decks = {
                weak: [],
                learned: [],
                perfect: [],
                unlearned: [] // Optional
            };
        }
    } else {
        // First ever launch
        if (!gameState.firstPlayedAt) {
            gameState.firstPlayedAt = Date.now();
        }
    }
}

// Hard Reset for Logout
window.resetGameData = function () {
    console.log("Hard Resetting Game Data...");
    localStorage.removeItem('vocabClickerSave');
    localStorage.removeItem('vocabGame_userId');
    localStorage.removeItem('vocabGame_playerName');
    localStorage.removeItem('vocabGame_isUnlocked');
    localStorage.removeItem('vocabGame_expiry');
    localStorage.removeItem('vocabGame_trialState_v2');
    // We don't clear 'vocabGame_skipWelcome' so guests don't see tutorial every time if they just relog
};

function startPlayTimeCounter() {
    gameState.sessionStartTime = Date.now();
    playTimeInterval = setInterval(updatePlayTime, 1000);
}

function updatePlayTime() {
    const elapsed = Date.now() - gameState.sessionStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('playTime').textContent =
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function setupPOSFilters() {
    const checkboxes = document.querySelectorAll('.pos-filter');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updatePOSFilters();
            showNextWord();
            saveGame();
        });
    });
}

function updatePOSFilters() {
    const checkboxes = document.querySelectorAll('.pos-filter');
    gameState.posFilters = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            gameState.posFilters.push(checkbox.dataset.pos);
        }
    });
    // v2.80: Reset Decks on Filter Change to prevent filtered words from lingering
    gameState.decks = null;
}

function filterWordsByPOS(words) {
    if (gameState.posFilters.length === 0) return [];
    return words.filter(word => {
        const pos = word.pos || 'other';
        return gameState.posFilters.includes(pos) ||
            (pos !== '名' && pos !== '動' && pos !== '形' && pos !== '副' &&
                pos !== '助' && pos !== '前' && pos !== '接' && pos !== '代' && gameState.posFilters.includes('other'));
    });
}

function checkVocabLevelUp() {
    // Re-calculate World Level
    const categories = ['junior', 'basic', 'daily', 'exam1'];
    let newWorldLevel = 0;
    categories.forEach(cat => {
        newWorldLevel += getCategoryLevel(cat);
    });

    if (newWorldLevel > gameState.vocabLevel) {
        gameState.vocabLevel = newWorldLevel;
        showCoinPopup(`🎉 ワールドレベル ${gameState.vocabLevel} にアップ！`, true);
    }
    updateVocabLevelDisplay();
}

function updateVocabLevelDisplay() {
    document.querySelectorAll('.js-vocab-level-value').forEach(el => {
        el.textContent = gameState.vocabLevel;
    });
}

function getWordsByMode(mode) {
    const modeWords = vocabulary.filter(v => {
        const key = getWordKey(v, gameState.currentLevel);
        return gameState.wordStates[key] === mode;
    });
    return filterWordsByPOS(modeWords);
}

// --- HISTORY SYNC (v2.46.33) ---
window.updateDailyHistory = function () {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Robust Count Logic (Mirrors Chart Logic)
    let countA1 = 0, countA2 = 0, countB1 = 0, countB2 = 0;

    // Iterate specific categories to ensure accuracy
    const getCount = (cat) => {
        const words = vocabularyDatabase[cat] || [];
        let c = 0;
        words.forEach(w => {
            const k = getWordKey(w, cat);
            if (gameState.wordStates[k] === 'perfect') c++;
        });
        return c;
    };

    countA1 = getCount('junior');
    countA2 = getCount('basic');
    countB1 = getCount('daily');
    countB2 = getCount('exam1');
    const total = countA1 + countA2 + countB1 + countB2;

    // Update Global WordsLearned just in case
    gameState.wordsLearned = total;

    // Find Today's Entry
    if (!gameState.dailyHistory) gameState.dailyHistory = [];

    const existingIndex = gameState.dailyHistory.findIndex(h => h.date === todayStr);

    const entryData = {
        date: todayStr,
        wordsLearned: total,
        // answers: gameState.dailyStats ? gameState.dailyStats.answers : 0, // Removed usage
        cefr_breakdown: {
            A1: countA1,
            A2: countA2,
            B1: countB1,
            B2: countB2
        }
    };

    if (existingIndex !== -1) {
        // Update
        gameState.dailyHistory[existingIndex] = { ...gameState.dailyHistory[existingIndex], ...entryData };
    } else {
        // Create
        gameState.dailyHistory.push(entryData);
    }

    // Persist immediately
    saveGame();
    console.log("History Synced:", entryData);
};

function getEligibleLearnedWords() {
    const learnedWords = getWordsByMode('learned');
    const eligibleWords = [];

    for (const word of learnedWords) {
        const key = getWordKey(word, gameState.currentLevel);
        const interval = gameState.learnedWordIntervals[key] || 0;
        const requiredInterval = Math.pow(2, interval) * 12;
        const lastShown = gameState.learnedWordIntervals[`${key}_last`] || 0;

        if (gameState.globalQuestionCount - lastShown >= requiredInterval) {
            eligibleWords.push(word);
        }
    }

    if (eligibleWords.length === 0 && learnedWords.length > 0) {
        return learnedWords;
    }

    return eligibleWords;
}

// Web Audio API Context for keeping hardware awake
// let audioContext = null; // Removed to avoid collision with global
let audioWakeLockSet = false;

function enableAudioStayAwake() {
    if (audioWakeLockSet) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        gameAudioContext = new AudioContext();

        // OPTIMIZATION: Use a looped empty buffer instead of an oscillator.
        // Oscillators can cause high CPU usage or "denormal" math issues on some PCs,
        // leading to slow/robotic speech. Buffers are lighter.
        const buffer = gameAudioContext.createBuffer(1, 1, 22050); // 1 sample
        const source = gameAudioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Connect to destination (no gain node needed for empty buffer, but safety first)
        const gainNode = gameAudioContext.createGain();
        gainNode.gain.value = 0.0001; // Just enough to be "active" but silent

        source.connect(gainNode);
        gainNode.connect(gameAudioContext.destination);

        source.start(0);
        audioWakeLockSet = true;
        console.log("Audio Wake Lock engaged (Buffer Mode).");
    } catch (e) {
        console.error("Audio Wake Lock failed:", e);
    }
}

function speakWord(word) {
    // Ensure audio engine is awake
    if (!audioWakeLockSet) {
        enableAudioStayAwake();
    }
    if (typeof gameAudioContext !== 'undefined' && gameAudioContext && gameAudioContext.state === 'suspended') {
        gameAudioContext.resume();
    }

    // Cancel previous speech
    speechSynthesis.cancel();

    // Small delay to allow cancellation to clear
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';

        // Try to select a better voice
        const voices = speechSynthesis.getVoices();
        // Priority list: Google US English, Samantha (iOS/Mac), Microsoft Zira (Win)
        const preferredVoice = voices.find(v => v.name === 'Google US English') ||
            voices.find(v => v.name === 'Samantha') ||
            voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
            voices.find(v => v.lang === 'en-US');

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        speechSynthesis.speak(utterance);
    }, 50);
}

// --- SHUFFLE BAG HELPERS (v2.79) ---
function createShuffledDeck(words) {
    // Clone array to avoid modifying source
    const deck = [...words];
    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function getWordFromDeck(category, sourceWords) {
    // Ensure deck structure exists
    if (!gameState.decks) gameState.decks = {};
    if (!gameState.decks[category]) gameState.decks[category] = [];

    const deck = gameState.decks[category];

    // Refill if empty
    if (deck.length === 0) {
        if (sourceWords.length === 0) return null;
        console.log(`[Deck] Refilling deck for ${category} (${sourceWords.length} words)`);

        const newDeck = createShuffledDeck(sourceWords);

        // Continuity Check: Prevent immediate repeat after refill
        // If the new first card is the same as the LAST shown word
        if (gameState.lastShownWordKey && newDeck.length > 1) {
            const firstWordKey = getWordKey(newDeck[0], gameState.currentLevel);
            if (firstWordKey === gameState.lastShownWordKey) {
                console.log(`[Deck] Prevented immediate repeat for ${firstWordKey}. Swapping top card.`);
                // Swap first and last
                [newDeck[0], newDeck[newDeck.length - 1]] = [newDeck[newDeck.length - 1], newDeck[0]];
            }
        }

        gameState.decks[category] = newDeck;
    }

    // Pop the next word
    return gameState.decks[category].pop();
}

function showNextWord() {
    if (window.resetFocusTimer) window.resetFocusTimer();

    gameState.meaningCardFlipped = false;
    clearAutoTimer();


    let words;
    let shouldShowReview = false;
    let reviewType = null;
    let selectedCategory = null; // 'unlearned', 'learned', 'weak'

    if (!gameState.randomMode) {
        // STANDARD MODE
        // For Review Modes (Weak/Learned/Perfect), use Deck Logic
        const mode = gameState.currentMode;
        if (mode === 'weak' || mode === 'learned' || mode === 'perfect') {
            const pool = getWordsByMode(mode);
            const word = getWordFromDeck(mode, pool);
            if (word) {
                words = [word]; // Wrap in array to match downstream logic
                selectedCategory = mode;
                if (mode === 'learned' || mode === 'perfect') {
                    shouldShowReview = true;
                    reviewType = 'learned'; // Use 'learned' badge for both learned/perfect
                } else if (mode === 'weak') {
                    shouldShowReview = true;
                    reviewType = 'weak';
                }
            } else {
                words = [];
            }
            gameState.isReviewWord = shouldShowReview;
        } else {
            // Unlearned or other modes -> Keep standard behavior (or use Deck if desired)
            // User specific request was for Review modes. Unlearned is transient.
            // Standard unlearned selection:
            words = getWordsByMode(mode);
            // We still shuffle/random pick from this list below?
            // Existing logic: currentWordIndex = Random * length.
            // That logic is potentially repetitive for small unlearned pools too.
            // Let's use Deck for Unlearned too for consistency?
            // A: Yes, let's use Deck for EVERYTHING to be safe.

            // BUT: 'getWordsByMode' returns a fresh array.
            // If we use deck logic, we must pass that fresh array to refill.
            const word = getWordFromDeck(mode, words);
            if (word) words = [word];
            else words = [];
            gameState.isReviewWord = false;
        }

    } else {
        // NEW: Adaptive Weighted Probability Logic (v2.79)
        const unlearnedWords = getWordsByMode('unlearned');
        const learnedWords = getEligibleLearnedWords();
        const weakWords = getWordsByMode('weak');

        // Weights defaults: Unlearned(75), Learned(10), Weak(15)
        let weightUnlearned = 75;
        let weightLearned = 10;
        let weightWeak = 15;

        const weakCount = weakWords.length;

        // Dynamic Adjustment based on Weak Count
        if (weakCount >= 150) {
            weightUnlearned = 5; weightLearned = 5; weightWeak = 90;
        } else if (weakCount >= 100) {
            weightUnlearned = 20; weightLearned = 10; weightWeak = 70;
        } else if (weakCount >= 50) {
            weightUnlearned = 50; weightLearned = 10; weightWeak = 40;
        }

        if (unlearnedWords.length === 0) weightUnlearned = 0;
        if (learnedWords.length === 0) weightLearned = 0;
        if (weakWords.length === 0) weightWeak = 0;

        const totalWeight = weightUnlearned + weightLearned + weightWeak;

        if (totalWeight === 0) {
            words = [];
        } else {
            const r = Math.random() * totalWeight;

            if (r < weightUnlearned) {
                // Select Unlearned
                // words = unlearnedWords; // OLD
                const word = getWordFromDeck('unlearned', unlearnedWords);
                words = word ? [word] : [];
                gameState.isReviewWord = false;
            } else if (r < weightUnlearned + weightLearned) {
                // Select Learned
                const word = getWordFromDeck('learned', learnedWords); // Note: Eligible subset
                words = word ? [word] : [];
                shouldShowReview = true;
                reviewType = 'learned';
            } else {
                // Select Weak
                const word = getWordFromDeck('weak', weakWords);
                words = word ? [word] : [];
                shouldShowReview = true;
                reviewType = 'weak';
            }
        }
    }

    gameState.isReviewWord = shouldShowReview;
    gameState.globalQuestionCount++;

    if (words.length === 0) {
        showNoWordsMessage();
        return;
    }

    hideNoWordsMessage();
    // Since we now select a SINGLE word via Deck, existing logic needs adjustment
    // Old: words = array, index = random.
    // New: words = [singleWord]. index = 0.

    gameState.currentWordIndex = 0;
    const word = words[0];
    gameState.currentWord = word;

    // Track Last Shown (for next continuity check)
    gameState.lastShownWordKey = getWordKey(word, gameState.currentLevel);

    // MAP POS to Full Name
    const posMap = {
        "名": "名詞",
        "動": "動詞",
        "形": "形容詞",
        "副": "副詞",
        "助": "助動詞",
        "接": "接続詞",
        "前": "前置詞",
        "代": "代名詞"
    };
    const fullPos = posMap[word.pos] || word.pos;

    // UPDATE: Display POS above Word (Full Name)
    // Visual Adjustment: shift up slightly so the WORD looks centered, not the whole block
    document.getElementById('vocabWord').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-10%);">
                    <div style="font-size: 18px; color: #667eea; font-weight: normal; margin-bottom: 5px;">${fullPos}</div>
                    <div style="font-size: 42px; font-weight: bold; line-height: 1.2;">${word.word}</div>
                </div>
            `;

    // UPDATE: Display Meaning (Large) + Minimal Phrase (Small below)

    // Label Idea: Use English "Phrase" in small caps for a cleaner look
    const phraseLabel = `<span style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">PHRASE</span>`;

    // Layout: Meaning (Center/Large) -> Phrase (Below/Small)
    document.getElementById('meaningText').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="font-size: 32px; font-weight: bold; color: #333; margin-bottom: 20px;">${word.meaning}</div>
                    ${word.phrase ? `
                        <div style="text-align: center; background: #f8f9fa; padding: 10px 20px; border-radius: 12px; border: 1px solid #eef0f5;">
                            ${phraseLabel}
                            <div style="font-size: 18px; color: #444; font-weight: 500;">${word.phrase}</div>
                        </div>
                    ` : ''}
                </div>
            `;

    document.getElementById('exampleSentence').textContent = word.example;
    document.getElementById('meaningCard').classList.remove('flipped');

    const vocabCard = document.getElementById('vocabCard');
    const existingBadge = vocabCard.querySelector('.review-badge');
    if (existingBadge) existingBadge.remove();

    if (gameState.isReviewWord) {
        const badge = document.createElement('div');
        badge.className = 'review-badge';
        if (reviewType === 'learned') {
            badge.textContent = '得意';
            badge.style.backgroundColor = '#4caf50'; // Green
        } else {
            badge.textContent = '苦手';
            badge.style.backgroundColor = '#f44336'; // Red
        }
        vocabCard.appendChild(badge);
    }

    // DOM更新後、少し待ってから音声再生
    setTimeout(() => {
        speakWord(word.word);
    }, 200);

    if (gameState.autoMode) {
        startAutoTimer();
    }

    checkLevelUp();
}

// NEW: Function to show a SPECIFIC word (for Undo/Restore)
function showWord(word) {
    if (!word) return;

    // Reset Card State
    gameState.meaningCardFlipped = false;
    document.getElementById('meaningCard').classList.remove('flipped');

    // Map POS
    const posMap = {
        "名": "名詞",
        "動": "動詞",
        "形": "形容詞",
        "副": "副詞",
        "助": "助動詞",
        "接": "接続詞",
        "前": "前置詞",
        "代": "代名詞"
    };
    const fullPos = posMap[word.pos] || word.pos;

    // Update DOM (MATCHING showNextWord STRUCTURE EXACTLY)
    document.getElementById('vocabWord').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-10%);">
                    <div style="font-size: 18px; color: #667eea; font-weight: normal; margin-bottom: 5px;">${fullPos}</div>
                    <div style="font-size: 42px; font-weight: bold; line-height: 1.2;">${word.word}</div>
                </div>
            `;

    // Update Meaning (MATCHING showNextWord STRUCTURE)
    // Label Idea: Use English "Phrase" in small caps for a cleaner look
    const phraseLabel = `<span style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">PHRASE</span>`;

    document.getElementById('meaningText').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="font-size: 32px; font-weight: bold; color: #333; margin-bottom: 20px;">${word.meaning}</div>
                    ${word.phrase ? `
                        <div style="text-align: center; background: #f8f9fa; padding: 10px 20px; border-radius: 12px; border: 1px solid #eef0f5;">
                            ${phraseLabel}
                            <div style="font-size: 18px; color: #444; font-weight: 500;">${word.phrase}</div>
                        </div>
                    ` : ''}
                </div>
            `;

    document.getElementById('exampleSentence').textContent = word.example;

    // Re-bind speaker button for this word
    const speakerBtn = document.getElementById('speakerBtn');
    const newBtn = speakerBtn.cloneNode(true);
    speakerBtn.parentNode.replaceChild(newBtn, speakerBtn);

    newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakText(word.example);
    });

    updateProgress();
}

function showNoWordsMessage() {
    const cardsArea = document.getElementById('cardsArea');
    const modeNames = {
        'unlearned': '未学習',
        'learned': '得意',
        'perfect': '完璧',
        'weak': '苦手'
    };
    cardsArea.innerHTML = `<div class="no-words">この${modeNames[gameState.currentMode] || gameState.currentMode}モードには単語がありません</div>`;
    document.getElementById('exampleArea').style.display = 'none';
}

function hideNoWordsMessage() {
    const cardsArea = document.getElementById('cardsArea');
    if (cardsArea.querySelector('.no-words')) {
        cardsArea.innerHTML = `
                    <div class="card vocab-card" id="vocabCard">
                        <div class="card-label">英単語カード</div>
                        <div class="card-content" id="vocabWord">Loading...</div>
                    </div>
                    <div class="card meaning-card" id="meaningCard">
                        <div class="card-label">意味カード</div>
                        <div class="card-front">
                            <div class="card-content">❓</div>
                        </div>
                        <div class="card-back">
                            <div class="card-content" id="meaningText">意味</div>
                        </div>
                    </div>
                `;
        setupCardListeners();
    }
    document.getElementById('exampleArea').style.display = 'flex';
}

function clearAutoTimer() {
    if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
    }
}

function startAutoTimer() {
    clearAutoTimer();
    autoTimer = setTimeout(() => {
        if (!gameState.meaningCardFlipped && gameState.autoMode) {
            autoOpenMeaningCard();
        }
    }, 3000);
}

function autoOpenMeaningCard() {
    const meaningCard = document.getElementById('meaningCard');
    if (!meaningCard || gameState.meaningCardFlipped) return;

    meaningCard.classList.add('flipped');
    gameState.meaningCardFlipped = true;

    const currentWord = gameState.currentWord;
    if (!currentWord) return;

    const key = getWordKey(currentWord, gameState.currentLevel);


    const basePoints = 2;
    const finalPoints = basePoints * gameState.vocabLevel;
    gameState.points += finalPoints;

    showCoinPopup(finalPoints);
    updateDisplay();
    animateCharacter();
    saveGame();

    autoTimer = setTimeout(() => {
        if (gameState.autoMode) {
            showNextWord();
        }
    }, 2000);
}

function setupCardListeners() {
    const vocabCard = document.getElementById('vocabCard');
    const meaningCard = document.getElementById('meaningCard');

    if (vocabCard) {
        const newVocab = vocabCard.cloneNode(true);
        vocabCard.parentNode.replaceChild(newVocab, vocabCard);
        newVocab.addEventListener('click', handleVocabCardClick);
    }

    if (meaningCard) {
        const newMeaning = meaningCard.cloneNode(true);
        meaningCard.parentNode.replaceChild(newMeaning, meaningCard);
        newMeaning.addEventListener('click', handleMeaningCardClick);
    }
}

function handleVocabCardClick() {
    if (window.resetFocusTimer) window.resetFocusTimer();

    const currentWord = gameState.currentWord;
    if (!currentWord) return;

    clearAutoTimer();

    // Ignore click if card is already flipped (user should click Next or Meaning card)
    // Actually, if flipped, clicking vocab card usually means "Next" in this design?
    // User said: "Click vocab card = Correct".
    // If already flipped, maybe "Correct" doesn't make sense anymore because they saw the answer.
    // But let's assume clicking Vocab Card (Front) is the primary "I know this" action.
    // If flipped, it's hidden behind checks usually. 
    // In the provided code, vocabCard is FRONT. meaningCard is BACK.
    // If flipped, Vocab Card is HIDDEN.
    // So this handler only fires if NOT flipped.

    if (gameState.meaningCardFlipped) {
        // Should not happen if UI hides it, but safety:
        showNextWord();
        return;
    }

    // Save state for Undo
    saveState();
    // incrementDailyStats(); // Moved below to exclude "Unlearned -> Perfect" cases

    const key = getWordKey(currentWord, gameState.currentLevel);
    let basePoints = 1;
    let msg = "";

    // LOGIC: Unlearned -> Perfect, Weak -> Learned, Learned -> Perfect, Perfect -> Perfect
    const currentState = gameState.wordStates[key];

    if (currentState === 'unlearned') {
        gameState.actionCounts.unlearned_correct++;
        gameState.wordStates[key] = 'perfect';
        gameState.wordsLearned++;
        checkLevelUp();
        checkDailyReset(); // Count effort
        // Track 'Known' (Unlearned->Perfect) to exclude from Velocity
    } else if (currentState === 'weak') {
        gameState.actionCounts.weak_correct++;
        checkDailyReset(); // Count effort
        gameState.wordStates[key] = 'learned';
        basePoints = 2; // User Request: 2 points for weak (Priority)
        msg = "✅ 克服！";
        gameState.learnedWordIntervals[key] = 0;
        gameState.learnedWordIntervals[`${key}_last`] = gameState.globalQuestionCount;
    } else if (currentState === 'learned') {
        gameState.actionCounts.learned_correct++;
        gameState.wordStates[key] = 'perfect';
        basePoints = 1; // Default 1
        msg = "🏆 完璧マスター！";
        checkDailyReset(); // Count effort
    } else if (currentState === 'perfect') {
        gameState.actionCounts.perfect_correct++;
        // Stay perfect
        basePoints = 1; // Default 1
        msg = "✨ 完璧維持！";
        checkDailyReset(); // Count effort
    } else {
        // Fallback
        gameState.wordStates[key] = 'perfect';
        basePoints = 1;
        checkDailyReset();
    }

    const finalPoints = basePoints * gameState.vocabLevel;
    gameState.points += finalPoints;

    // RPG Animation Trigger
    // RPG Animation Trigger
    if (currentState === 'weak') {
        playAnimation('attack'); // Weakness Overcome -> Battle
        //} else if (msg.includes('完璧')) {
        //    // Perfect -> Victory
        //    playAnimation('victory');
    } else {
        playAnimation('idle'); // Standard
    }

    showCoinPopup(finalPoints); // Optionally show text? Currently logic only shows number.

    updateDisplay();
    showNextWord();
    animateCharacter();
    saveGame();
}

function handleMeaningCardClick(e) {
    // If in Focus Mode, Pause Timer instead of reset
    if (gameState.focusState && gameState.focusState.active) {
        gameState.focusState.paused = true;
    }

    const card = e.currentTarget;
    clearAutoTimer();

    if (!gameState.meaningCardFlipped) {
        // Save state for Undo
        saveState();
        checkDailyReset(); // Track interaction for Growth Pace

        // Flip = Incorrect / Check
        card.classList.add('flipped');
        gameState.meaningCardFlipped = true;

        const currentWord = gameState.currentWord;
        if (!currentWord) return;

        const key = getWordKey(currentWord, gameState.currentLevel);
        const currentState = gameState.wordStates[key];

        // LOGIC: Learned -> Weak. Unlearned -> Weak. Perfect -> Learned (Soft landing).

        if (currentState === 'perfect') {
            gameState.actionCounts.perfect_incorrect++;
            gameState.wordStates[key] = 'learned';
            // Reset learned interval as it's a "new" learned word effectively
            gameState.learnedWordIntervals[key] = 0;
            gameState.learnedWordIntervals[`${key}_last`] = gameState.globalQuestionCount;
        } else if (currentState === 'learned') {
            gameState.actionCounts.learned_incorrect++;
            gameState.wordStates[key] = 'weak';
        } else if (currentState === 'unlearned') {
            gameState.actionCounts.unlearned_incorrect++;
            gameState.wordStates[key] = 'weak';
            gameState.wordsLearned++;
            // Track Daily Learned for Weakness Stats
            gameState.wordsLearned++;
            checkLevelUp();
        }
        // If already weak, stay weak.
        else if (currentState === 'weak') {
            gameState.actionCounts.weak_incorrect++;
        }

        // Points Logic: Unlearned=1, Weak=2, Others=1
        let basePoints = 1;
        if (currentState === 'weak') {
            basePoints = 2;
        } else if (currentState === 'unlearned') {
            basePoints = 1;
        } else {
            basePoints = 1;
        }
        const finalPoints = basePoints * gameState.vocabLevel;
        gameState.points += finalPoints;

        // showCoinPopup(finalPoints); // Maybe don't show popup for "Incorrect"? 
        // Let's keep it positive. Learning is earning.

        updateDisplay();
        animateCharacter();
        saveGame();
    } else {
        // If already flipped, clicking it again = Next Word
        showNextWord();
    }
}

// ... checkLevelUp ...
// ... addNextWordSet ...

// FIX: Remove legacy function inside loop or whatever caused issues

function checkLevelUp() {
    const unlearnedCount = getWordsByMode('unlearned').length;
    const addWordsContainer = document.getElementById('addWordsContainer');
    if (!addWordsContainer) return;

    let maxSet = 0;
    if (vocabularyDatabase[gameState.currentLevel] && vocabularyDatabase[gameState.currentLevel].length > 0) {
        maxSet = Math.max(...vocabularyDatabase[gameState.currentLevel].map(v => v.set));
    }

    if (unlearnedCount === 0 && gameState.vocabLevel < maxSet) {
        addWordsContainer.style.display = 'block';
    } else {
        addWordsContainer.style.display = 'none';
    }
}

function addNextWordSet() {
    let maxSet = 0;
    if (vocabularyDatabase[gameState.currentLevel] && vocabularyDatabase[gameState.currentLevel].length > 0) {
        maxSet = Math.max(...vocabularyDatabase[gameState.currentLevel].map(v => v.set));
    }
    if (gameState.vocabLevel >= maxSet) {
        alert('すでに全てのセットが追加されています！');
        return;
    }

    gameState.vocabLevel++;
    loadVocabularyForLevel();
    initializeWordStates();
    showCoinPopup(`🎉 レベルアップ！語彙レベル ${gameState.vocabLevel}`, true);
    updateDisplay();
    saveGame();
    showNextWord();
}

function animateCharacter() {
    // Character UI removed. No-op.
}

function updateDisplay() {
    const rawPoints = Math.floor(gameState.points);
    let displayPoints = rawPoints;
    if (rawPoints >= 100000) {
        // 100k notation
        displayPoints = Math.floor(rawPoints / 1000) + 'k';
    }
    document.getElementById('points').textContent = displayPoints;
    updateWordStats();
    updateModeButtons();
    updateProgress();
}

// --- RPG Animation Logic ---
// --- RPG Animation Logic ---
let animTimer = null;

function playAnimation(type) {
    const hero = document.getElementById('heroCharacter');
    const slime = document.getElementById('enemySlime');

    // Clear previous timers to prevent overlap
    if (animTimer) {
        clearTimeout(animTimer);
        animTimer = null;
    }

    // Default State: Idle (Row 1), Slime hidden
    // Reset to ensure clean transition
    hero.className = 'pixel-art';

    if (type === 'idle') {
        hero.classList.add('anim-idle');
        slime.style.opacity = '0';
        return;
    }

    if (type === 'attack') {
        hero.className = 'pixel-art anim-attack';
        slime.className = 'pixel-art anim-slime'; // Ensure animation runs
        slime.style.opacity = '1';

        // Duration: 0.8s * 2 loops = 1600ms
        animTimer = setTimeout(() => {
            // Revert to Idle
            hero.className = 'pixel-art anim-idle';
            // Hide Slime
            slime.style.opacity = '0';
        }, 1600);

    } else if (type === 'victory') {
        hero.className = 'pixel-art anim-cheer';
        // Slime should be hidden
        slime.style.opacity = '0';

        // Duration: 0.8s * 2 loops = 1600ms
        animTimer = setTimeout(() => {
            hero.className = 'pixel-art anim-idle';
        }, 1600);
    }
}

function getCategoryLevel(category) {
    // Fix: Iterate over the actual vocabulary list for this category
    // instead of relying on key prefixes (which fail for referenced words).
    const words = vocabularyDatabase[category] || [];
    let count = 0;

    words.forEach(word => {
        // Use the shared helper to get the correct key (handles refs)
        const key = getWordKey(word, category);
        const state = gameState.wordStates[key];
        if (state === 'learned' || state === 'perfect' || state === 'weak') {
            count++;
        }
    });

    return Math.floor(count / 20) + 1;
}

function updateProgress() {
    // Calculate Progress based on Valid Words in current level
    const validWords = vocabulary; // Currently loaded vocabulary array
    if (!validWords || validWords.length === 0) {
        document.querySelectorAll('.js-progress-percent').forEach(el => el.textContent = "0");
        document.querySelectorAll('.js-progress-bar-fill').forEach(el => el.style.width = "0%");
    } else {
        const total = validWords.length;
        const learnedCount = getWordsByMode('learned').length;
        const perfectCount = getWordsByMode('perfect').length;
        const learnedTotal = learnedCount + perfectCount;

        const percent = Math.floor((learnedTotal / total) * 100);

        // Update DOM - Support multiple instances (PC/Mobile)
        document.querySelectorAll('.js-progress-percent').forEach(el => el.textContent = percent);
        document.querySelectorAll('.js-progress-bar-fill').forEach(el => el.style.width = `${percent}%`);

        // Determine Title (Mage Theme) based on percentage
        // Determine Title (Mage Theme) based on percentage
        let title = "見習い魔術師"; // Default
        const configTitles = (window.GameConfig && window.GameConfig.TITLES) ? window.GameConfig.TITLES : [];

        for (const t of configTitles) {
            if (percent >= t.percent) {
                title = t.title;
                break;
            }
        }

        document.querySelectorAll('.js-current-title').forEach(el => el.textContent = title);
    }

    // --- World Level Calculation ---
    // Sum of levels from Junior, Basic, Daily, Exam1
    const categories = (window.GameConfig && window.GameConfig.CATEGORIES) ? window.GameConfig.CATEGORIES : ['junior', 'basic', 'daily', 'exam1'];
    let worldLevel = 0;
    categories.forEach(cat => {
        worldLevel += getCategoryLevel(cat);
    });

    // Update Game State
    gameState.vocabLevel = worldLevel;

    // Update World Level Display (Support multiple instances)
    document.querySelectorAll('.js-vocab-level-value').forEach(el => {
        el.textContent = worldLevel;
    });

    // --- Local Level Calculation (for current category) ---
    const localLevel = getCategoryLevel(gameState.currentLevel);
    document.querySelectorAll('.js-local-level-value').forEach(el => {
        el.textContent = localLevel;
    });

    const vocabLevelDisplay = document.getElementById('vocabLevelDisplay');
    if (vocabLevelDisplay) {
        vocabLevelDisplay.textContent = worldLevel;
    }

    // Update Label to "ワールドレベル"
    const labelContainer = document.querySelector('.vocab-level-display');
    if (labelContainer && labelContainer.childNodes[0].nodeType === 3) {
        labelContainer.childNodes[0].textContent = "ワールドレベル: ";
    }

    // --- Local Level Calculation ---
    // Level for the current category
    const currentLocalLevel = getCategoryLevel(gameState.currentLevel);

    const titleDisplay = document.querySelector('.title-display');
    if (titleDisplay) {
        // Removed Lv display appending as per user request
        let levelSpan = document.getElementById('playerLevelDisplay');
        if (levelSpan) {
            levelSpan.style.display = 'none'; // Ensure hidden if it exists
        }
    }
}



function updateWordStats() {
    // Unlearned
    document.getElementById('unlearnedCount').textContent = getWordsByMode('unlearned').length;
    // Learned
    document.getElementById('learnedCount').textContent = getWordsByMode('learned').length;
    // Perfect (New)
    document.getElementById('perfectCount').textContent = getWordsByMode('perfect').length;
    // Weak
    document.getElementById('weakCount').textContent = getWordsByMode('weak').length;
}

function updateModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === gameState.currentMode) {
            btn.classList.add('active');
        }
    });

    if (gameState.randomMode) {
        document.getElementById('randomCheckbox').classList.add('checked');
        // document.getElementById('randomNotice').style.display = 'inline'; // Removed as requested
        // Disable mode buttons visually
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.add('disabled');
        });
    } else {
        document.getElementById('randomCheckbox').classList.remove('checked');
        document.getElementById('randomNotice').style.display = 'none';
        // Enable mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('disabled');
        });
    }

    if (gameState.autoMode) {
        document.getElementById('autoCheckbox').classList.add('checked');
    } else {
        document.getElementById('autoCheckbox').classList.remove('checked');
    }
}

function showCoinPopup(amount, isLevelUp = false) {
    // Disable normal gold popups (User Request)
    if (!isLevelUp) return;

    const popup = document.createElement('div');
    popup.className = 'coin-popup';

    if (isLevelUp) {
        popup.textContent = amount;
    } else {
        popup.textContent = `+${Math.floor(amount)} gold`;
    }

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 600);
}

// --- PURCHASE MODAL LOGIC ---
window.openPurchaseModal = function () {
    const modal = document.getElementById('purchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        // Analytics or specific init if needed
    }
};

window.closePurchaseModal = function () {
    const modal = document.getElementById('purchaseModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// --- SIMPLE MODE LOGIC ---
function openSimpleModeModal() {
    document.getElementById('simpleModeModal').style.display = 'flex';
}

function startSimpleMode(level) {
    document.getElementById('simpleModeModal').style.display = 'none';
    document.body.classList.add('simple-mode');

    if (level === 'wordbook') {
        // Open Wordbook Selection Modal
        // Assuming openWordbookModal() exists or we find the logic.
        // Re-using existing button click logic is safest if function undefined.
        const wbBtn = document.getElementById('wordbookBtn');
        if (wbBtn) wbBtn.click();
    } else {
        // Set Level
        const btn = document.querySelector(`.level-btn[data-level="${level}"]`);
        if (btn) btn.click();
    }
}

function exitSimpleMode() {
    document.body.classList.remove('simple-mode');
}

// --- Leaderboard & Cloud Modal UI Logic (Moved from Module) ---
async function openLeaderboard() {
    // Version Check (Semi-Auto Update)
    if (typeof checkForUpdates === 'function') {
        if (await checkForUpdates()) {
            const updateModal = document.getElementById('updatePromptModal');
            if (updateModal) {
                updateModal.style.display = 'flex';
                return; // Stop execution
            }
        }
    }

    document.getElementById('leaderboardModal').style.display = 'flex';

    // Check Auth State (Global auth object exposed in window.firebaseAuth)
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;

    if (!currentUser) {
        // Not Logged In
        document.getElementById('loginRequiredMessage').style.display = 'block';
        document.getElementById('nameInputParams').style.display = 'none';
        document.getElementById('leaderboardContent').style.display = 'none';
        document.getElementById('renameBtn').style.display = 'none';
    } else {
        // Logged In
        document.getElementById('loginRequiredMessage').style.display = 'none';
        checkNameRegistration();
    }
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'none';
}

function openCloudModal() {
    document.getElementById('cloudModal').style.display = 'flex';
}

let playerName = localStorage.getItem('vocabGame_playerName');
let lastSyncTime = 0;

function checkNameRegistration() {
    if (!playerName) {
        document.getElementById('nameInputParams').style.display = 'block';
        document.getElementById('leaderboardContent').style.display = 'none';
        document.getElementById('renameBtn').style.display = 'none';
    } else {
        document.getElementById('nameInputParams').style.display = 'none';
        document.getElementById('leaderboardContent').style.display = 'block';
        document.getElementById('renameBtn').style.display = 'block';

        // Sync Score (attempt)
        if (typeof attemptScoreSync === 'function') attemptScoreSync(true);
        loadRankingData('top');
    }
}

function renamePlayer() {
    // Store current name temporarily in case of cancel
    document.getElementById('playerNameInput').value = playerName;

    // Show input, hide content
    document.getElementById('nameInputParams').style.display = 'block';
    document.getElementById('leaderboardContent').style.display = 'none';
    document.getElementById('renameBtn').style.display = 'none';

    // Show cancel button
    document.getElementById('cancelRenameBtn').style.display = 'inline-block';
}

function cancelRename() {
    checkNameRegistration(); // Restore view
}

function registerName() {
    const input = document.getElementById('playerNameInput');
    const val = input.value.trim();
    if (val.length > 0 && val.length <= 8) {
        playerName = val;
        localStorage.setItem('vocabGame_playerName', playerName);

        // Sync Score (attempt)
        if (typeof attemptScoreSync === 'function') attemptScoreSync(true);
        checkNameRegistration();
    } else {
        alert("名前は1〜8文字で入力してください");
    }
}

// Global function for saveGame hook
window.attemptScoreSync = function (force = false) {
    if (!playerName) return;
    const now = Date.now();
    if (force || (now - lastSyncTime > 60000)) {
        if (window.uploadScore) {
            window.uploadScore(playerName, gameState.points);
            lastSyncTime = now;
        }
    }
};

// Fallback Stubs for Cloud Functions (in case module fails to load)
if (!window.uploadSaveData) {
    window.uploadSaveData = function () { alert("機能の読み込み中、または通信環境により無効化されています。\n(ローカルファイルで開いている場合は動作しないことがあります)"); };
}
if (!window.restoreSaveData) {
    window.restoreSaveData = function () { alert("機能の読み込み中、または通信環境により無効化されています。"); };
}

let currentLeaderboardTab = 'top';

function switchTab(tab) {
    console.log("[Debug] Switching to tab:", tab); // DEBUG
    currentLeaderboardTab = tab;
    document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
    const buttons = document.querySelectorAll('.lb-tab');
    if (buttons.length > 0) {
        if (tab === 'top') buttons[0].classList.add('active');
        else if (buttons[1] && tab === 'around') buttons[1].classList.add('active');
        else if (buttons[2] && tab === 'focus') buttons[2].classList.add('active');
    }

    const topList = document.getElementById('lb-list-top');
    const aroundList = document.getElementById('lb-list-around');
    const focusList = document.getElementById('lb-list-focus');

    // Standard display toggle (CSS classes handle visibility, but explicit inline style ensures logic works)
    if (topList) topList.style.display = (tab === 'top') ? 'block' : 'none';
    if (aroundList) aroundList.style.display = (tab === 'around') ? 'block' : 'none';
    if (focusList) focusList.style.display = (tab === 'focus') ? 'block' : 'none';

    loadRankingData(tab);
}

async function loadRankingData(type, force = false) {
    console.log("[Debug] loadRankingData called for:", type); // DEBUG
    let container;
    if (type === 'top') container = document.getElementById('lb-list-top');
    else if (type === 'around') container = document.getElementById('lb-list-around');
    else if (type === 'focus') container = document.getElementById('lb-list-focus');

    if (!container) {
        console.error("[Debug] Container not found for:", type);
        return;
    }

    // Reset content but keep display style valid
    container.innerHTML = '<div style="padding:10px; color:#999;">データ取得中...</div>';

    if (window.fetchLeaderboard) {
        const data = await window.fetchLeaderboard(type, force);
        console.log("[Debug] Data fetched for", type, ":", data); // DEBUG

        if (data.error) {
            container.innerHTML = `<div style="color:red; padding:10px;">エラー: ${data.error}</div>`;
            return;
        }

        if (!data.results || data.results.length === 0) {
            container.innerHTML = `<div style="padding:20px; color:#555; text-align:center;">
                <div style="font-size:40px; margin-bottom:10px;">📉</div>
                <div style="font-weight:bold; margin-bottom:5px;">まだランキングデータがありません</div>
                <div style="font-size:12px; color:#888;">集中力モードをプレイして<br>最初のスコアを登録しましょう！</div>
            </div>`;
            return;
        }

        let html = '';
        data.results.forEach(item => {
            const rankDisplay = (typeof item.rank === 'number') ? item.rank : item.rank;
            const isTop3 = (typeof item.rank === 'number' && item.rank <= 3);

            html += `
                    <div class="ranking-item ${item.isMe ? 'is-me' : ''}">
                        <span class="rank-num ${isTop3 ? 'top3' : ''}">${rankDisplay}</span>
                        <span class="rank-name">${window.GameUtils.escapeHtml(item.name)}</span>
                        <span class="rank-score">${item.score.toLocaleString()}${typeof item.score === 'number' ? ' G' : ''}</span>
                    </div>`;
        });
        container.innerHTML = html;
        console.log("[Debug] HTML updated for", type); // DEBUG
    } else {
        container.innerHTML = `<div style="padding:10px;">接続できません (オフライン)</div>`;
    }
    document.getElementById('lb-loading').style.display = 'none';
}

// escapeHtml removed: Use window.GameUtils.escapeHtml

init();

window.openProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Attempt to update premium status display if function exists
    if (window.updatePremiumStatusDisplay) {
        try { window.updatePremiumStatusDisplay(); } catch (e) { }
    }

    // Attempt to render chart if function exists (Chart.js / Firebase)
    if (window.updateChart) {
        setTimeout(() => { window.updateChart('total'); }, 100);
    } else {
        const canvas = document.getElementById('learningChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = "12px sans-serif";
            ctx.fillStyle = "#666";
            ctx.fillText("読み込み中...", 20, 50);
        }
    }
};

window.closeProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
};

// Help Modal Fix
const helpBtnGlobal = document.getElementById('helpBtn');
if (helpBtnGlobal) {
    helpBtnGlobal.onclick = function () {
        const hModal = document.getElementById('helpModal');
        if (hModal) hModal.style.display = 'flex';
    };
}
const closeHelpBtnGlobal = document.getElementById('closeHelpModal');
if (closeHelpBtnGlobal) {
    closeHelpBtnGlobal.onclick = function () {
        const hModal = document.getElementById('helpModal');
        if (hModal) hModal.style.display = 'none';
    };
}
const helpModalGlobal = document.getElementById('helpModal');
if (helpModalGlobal) {
    helpModalGlobal.onclick = function (e) {
        if (e.target === helpModalGlobal) helpModalGlobal.style.display = 'none';
    }
}

// Wordbook Modal Fix
const wbBtnGlobal = document.getElementById('wordbookBtn');
const wbModalGlobal = document.getElementById('wordbookModal');
const closeWbGlobal = document.getElementById('closeWordbookModal');

if (wbBtnGlobal && wbModalGlobal) {
    wbBtnGlobal.onclick = function () {
        wbModalGlobal.style.display = 'flex';
    };
}
if (closeWbGlobal && wbModalGlobal) {
    closeWbGlobal.onclick = function () {
        wbModalGlobal.style.display = 'none';
    };
}
if (wbModalGlobal) {
    wbModalGlobal.onclick = function (e) {
        if (e.target === wbModalGlobal) wbModalGlobal.style.display = 'none';
    };
}




// --- INFINITE FOCUS MODE LOGIC ---
let focusInterval = null;
let lastFocusTick = 0;

window.startFocusMode = function (customDuration = 7) {
    const duration = Number(customDuration) || 7;

    // Initialize or Reset State
    if (!gameState.focusState) {
        gameState.focusState = { active: false, initialTimer: duration, timer: duration, startTime: 0, currentDuration: 0, paused: false };
    }

    gameState.focusState.active = true;
    gameState.focusState.initialTimer = duration;
    gameState.focusState.timer = duration;
    gameState.focusState.startTime = Date.now();
    gameState.focusState.currentDuration = 0;
    gameState.focusState.paused = false;

    // Disable Auto Mode if active to prevent cheating/conflict
    if (gameState.autoMode) {
        toggleAutoMode();
    }

    // Show UI Overlay
    if (window.updateFocusOverlay) window.updateFocusOverlay(true, duration, "00:00", false);

    // Start Loop
    lastFocusTick = Date.now();
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = setInterval(updateFocusLoop, 100);

    // prompt filtered out
};

window.stopFocusMode = function (reason) {
    if (!gameState.focusState || !gameState.focusState.active) return;

    gameState.focusState.active = false;
    if (focusInterval) clearInterval(focusInterval);

    // Submit Score (Weekly Focus Leaderboard)
    if (window.submitFocusScore) {
        window.submitFocusScore(gameState.focusState.currentDuration);
    }

    // Show Game Over Modal
    if (window.showFocusGameOver) {
        window.showFocusGameOver(gameState.focusState.currentDuration, reason);
    } else {
        alert(`Game Over! Duration: ${gameState.focusState.currentDuration.toFixed(1)}s`);
    }

    // Hide Overlay
    if (window.updateFocusOverlay) window.updateFocusOverlay(false);
};

function updateFocusLoop() {
    if (!gameState.focusState || !gameState.focusState.active) return;

    const now = Date.now();
    const delta = (now - lastFocusTick) / 1000;
    lastFocusTick = now;

    // Pause Check
    if (gameState.focusState.paused) {
        if (window.updateFocusOverlay) {
            const fmt = formatDuration(gameState.focusState.currentDuration);
            window.updateFocusOverlay(true, gameState.focusState.timer, fmt, true);
        }
        return; // Skip timer decrement
    }

    gameState.focusState.timer -= delta;
    gameState.focusState.currentDuration = (now - gameState.focusState.startTime) / 1000; // Total survival time continues? 
    // Wait, if paused, survival time should PROBABLY pause too?
    // "Meaning time" shouldn't count towards "Survival High Score" if it pauses the death timer.
    // Let's pause survival duration accumulation too.
    gameState.focusState.currentDuration += delta; // Accumulate manually instead of diff? No, easier to just offset start time or pause duration.
    // Let's fix this logic:
    // If paused, we don't update currentDuration either.

    // Re-calculating:
    // Actually, simple way: only update if !paused.
    // But `currentDuration` was based on `now - startTime`.
    // If we pause, `now` advances.
    // So on unpause, we must shift `startTime` forward by the paused amount.
    // Or just switch to delta accumulation.
    // Let's Switch to Delta Accumulation for currentDuration to be safe with pause.
}
// Rewriting updateFocusLoop properly below:

function updateFocusLoop() {
    if (!gameState.focusState || !gameState.focusState.active) return;

    const now = Date.now();
    const delta = (now - lastFocusTick) / 1000;
    lastFocusTick = now;

    if (gameState.focusState.paused) {
        if (window.updateFocusOverlay) {
            const fmt = formatDuration(gameState.focusState.currentDuration);
            window.updateFocusOverlay(true, gameState.focusState.timer, fmt, true);
        }
        return;
    }

    gameState.focusState.timer -= delta;
    gameState.focusState.currentDuration += delta; // Delta accumulation logic

    if (gameState.focusState.timer <= 0) {
        gameState.focusState.timer = 0;
        window.stopFocusMode("timeup");
    }

    // Update UI
    if (window.updateFocusOverlay) {
        const fmt = formatDuration(gameState.focusState.currentDuration);
        window.updateFocusOverlay(true, gameState.focusState.timer, fmt, false);
    }
}

window.resetFocusTimer = function () {
    if (gameState.focusState && gameState.focusState.active) {
        gameState.focusState.timer = gameState.focusState.initialTimer || 7.00;
        gameState.focusState.paused = false;
    }
};

function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
