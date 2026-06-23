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
    // Deprecated: keep for backward compatibility in old saves/UI, but do not treat as source of truth.
    wordsLearned: 0,
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
    },
    // Phase A (SRS foundation)
    srsData: {},
    srsBootstrapped: false,
    srsSchemaVersion: 0,
    activeReviewLevels: ['junior', 'basic', 'daily', 'exam1', 'selection1400', 'selection1900', 'sys_2000'],
    reviewMode: 'random', // off | random | on
    lastReviewQueueHeadKey: null,
    pendingQueuePop: null,
    mixCycleCounter: 0
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

function applyIpaOverrides(database, overrides) {
    if (!database || !overrides) return;

    Object.entries(overrides).forEach(([level, entries]) => {
        if (!Array.isArray(entries) || !Array.isArray(database[level])) return;

        entries.forEach((override) => {
            if (!override || !override.word || !override.ipa) return;

            const targets = database[level].filter((word) => {
                if (!word || word.word !== override.word) return false;
                if (override.pos && word.pos !== override.pos) return false;
                if (override.meaning && word.meaning !== override.meaning) return false;
                if (override.phrase && word.phrase !== override.phrase) return false;
                return true;
            });

            targets.forEach((target) => {
                target.ipa = override.ipa;
            });
        });
    });
}

applyIpaOverrides(vocabularyDatabase, window.IPA_OVERRIDES);

// Merge Junior data if loaded via temp variable


var vocabulary = [];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatIpaForDisplay(ipaValue) {
    const raw = String(ipaValue ?? '').trim();
    if (!raw) return '';
    if (raw.startsWith('/') || raw.startsWith('[')) {
        return raw;
    }
    return `/${raw}/`;
}

function cleanMeaningForDisplay(meaningValue) {
    return String(meaningValue ?? '')
        .replace(/（[^）]*(?:⇔|⇒\s*\d+)[^）]*）/g, '')
        .replace(/\([^)]*(?:⇔|⇒\s*\d+)[^)]*\)/g, '')
        .replace(/\s+([；;,，])/g, '$1')
        .replace(/^[；;,，]\s*/, '')
        .trim();
}

function renderVocabWordMarkup(word) {
    if (!word) return '';

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
    const ipaDisplay = formatIpaForDisplay(word.ipa);

    return `
                <div class="vocab-word-stack" style="display: flex; flex-direction: column; align-items: center; transform: translateY(-4%);">
                    <div class="word-pos-label" style="font-size: 18px; color: #667eea; font-weight: normal; margin-bottom: 9px;">${escapeHtml(fullPos)}</div>
                    <div class="word-text-main" style="font-size: 42px; font-weight: bold; line-height: 1.2; text-align: center;">${escapeHtml(word.word)}</div>
                    ${ipaDisplay ? `<div class="word-ipa">${escapeHtml(ipaDisplay)}</div>` : ''}
                </div>
            `;
}

function renderMeaningMarkup(word) {
    const meaning = cleanMeaningForDisplay(word?.meaning);
    const phrase = String(word?.phrase ?? '').trim();
    const phraseLabel = `<span style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">PHRASE</span>`;

    return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="font-size: 32px; font-weight: bold; color: #333; margin-bottom: 20px;">${escapeHtml(meaning)}</div>
                    ${phrase ? `
                        <div style="text-align: center; background: #f8f9fa; padding: 10px 20px; border-radius: 12px; border: 1px solid #eef0f5;">
                            ${phraseLabel}
                            <div style="font-size: 18px; color: #444; font-weight: 500;">${escapeHtml(phrase)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
}
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
    const initialWbBtn = document.getElementById('wordbookBtn');
    if (initialWbBtn) initialWbBtn.classList.remove('active');
    // Check for standard level buttons
    const activeBtn = document.querySelector(`.level-btn[data-level="${gameState.currentLevel}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else if (isWordbookLevel(gameState.currentLevel)) {
        // Check for Wordbook button
        if (initialWbBtn) initialWbBtn.classList.add('active');
    }
    updateWordbookSelectionUI();
    updateLevelCurrentButton();

    setupEventListeners();
    setupPOSFilters(); // Need to call this to attach listeners to new checkboxes

    // MUST load vocabulary before updateDisplay
    if (vocabulary.length === 0 && vocabularyDatabase[gameState.currentLevel].length > 0) {
        loadVocabularyForLevel();
        // Fill omitted default states from compact cloud saves.
        initializeWordStates();
    }

    migrateSrsSchemaIfNeeded();
    bootstrapSrsFromWordStates();

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
            closeLevelSelector();
        });
    });

    document.addEventListener('click', (event) => {
        const selector = document.getElementById('levelContainer');
        const trigger = document.getElementById('levelCurrentBtn');
        if (!selector || !trigger) return;
        if (selector.contains(event.target) || trigger.contains(event.target)) return;
        closeLevelSelector();
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;

            // In review ON mode, category selection is locked (non-intuitive otherwise)
            if (gameState.reviewMode === 'on') {
                gameState.currentMode = 'unlearned';
                showNextWord();
                saveGame();
                return;
            }

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


    // POS Filter checkboxes
    setupPOSFilters();
    document.getElementById('speakerBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        speakCurrentExample();
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
    document.getElementById('fileInfo').textContent = `${vocabularyDatabase[level].length}語を読み込みました`;
    showNextWord();
    saveGame();
}

function switchLevel(level) {
    gameState.currentLevel = level;
    // v2.80: Reset Decks on Level Switch to prevent category mixing
    gameState.decks = null;

    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    const wbBtn = document.getElementById('wordbookBtn');
    if (wbBtn) wbBtn.classList.remove('active');

    const targetBtn = document.querySelector(`.level-btn[data-level="${level}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    } else if (isWordbookLevel(level)) {
        // Highlight Wordbook button if we are in a special wordbook mode
        if (wbBtn) wbBtn.classList.add('active');
    }
    updateWordbookSelectionUI();
    updateLevelCurrentButton();
    closeLevelSelector();

    loadVocabularyForLevel();
    initializeWordStates();
    updateDisplay();
    showNextWord();
    saveGame();
}

function isWordbookLevel(level) {
    return level === 'selection1400' || level === 'selection1900' || level === 'sys_2000';
}

function updateWordbookSelectionUI() {
    document.querySelectorAll('.wordbook-item-btn[data-level]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === gameState.currentLevel);
    });
    const wbBtn = document.getElementById('wordbookBtn');
    if (wbBtn) wbBtn.classList.toggle('active', isWordbookLevel(gameState.currentLevel));
}

const LEVEL_DISPLAY_LABELS = {
    junior: '中学',
    basic: '基礎',
    daily: '標準',
    exam1: '受験',
    selection1400: '単語帳',
    selection1900: '単語帳',
    sys_2000: '単語帳'
};

function updateLevelCurrentButton() {
    const label = document.getElementById('levelCurrentLabel');
    if (!label) return;
    label.textContent = LEVEL_DISPLAY_LABELS[gameState.currentLevel] || '基礎';
}

function toggleLevelSelector(event) {
    if (event) event.stopPropagation();
    const isOpen = document.body.classList.toggle('level-selector-open');
    const trigger = document.getElementById('levelCurrentBtn');
    if (trigger) trigger.setAttribute('aria-expanded', String(isOpen));
}

function closeLevelSelector() {
    document.body.classList.remove('level-selector-open');
    const trigger = document.getElementById('levelCurrentBtn');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
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
                            pos: refWord.pos,
                            ipa: v.ipa || refWord.ipa
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

function getWordBaseLevel(word, level) {
    if (word.__sourceLevel) return word.__sourceLevel;
    if (word.ref && word.ref !== level) {
        if (word.ref.includes(':')) {
            const parts = word.ref.split(':');
            return parts[0];
        }
        return word.ref;
    }
    return level;
}

function getWordKey(word, level) {
    const baseLevel = getWordBaseLevel(word, level);
    const baseWord = (word.ref && word.ref.includes(':')) ? word.ref.split(':')[1] : word.word;
    return `${baseLevel}_${baseWord}`;
}

function getWordKeySafe(word, levelHint) {
    return getWordKey(word, levelHint || gameState.currentLevel);
}

function initializeWordStates() {
    vocabulary.forEach(v => {
        const key = getWordKey(v, gameState.currentLevel);
        if (!gameState.wordStates[key]) {
            gameState.wordStates[key] = 'unlearned';
        }
        ensureSrsEntry(key);
    });
}

function ensureSrsEntry(key) {
    if (!gameState.srsData) gameState.srsData = {};
    if (!gameState.srsData[key]) {
        gameState.srsData[key] = {
            dueAt: Date.now(),
            stability: 1,
            successCount: 0,
            failCount: 0,
            streak: 0,
            lastReviewedAt: 0,
            reviewStep: 0,
            everWrong: false,
            firstTryPerfect: false
        };
    }
    return gameState.srsData[key];
}

function applyDueJitter(minutes) {
    // Spread same-day pileups: ±20%
    const ratio = 0.8 + (Math.random() * 0.4);
    return Math.max(5, Math.round(minutes * ratio));
}

function updateSrsForWord(key, isCorrect, currentState = null) {
    const s = ensureSrsEntry(key);
    const now = Date.now();

    // Table-based intervals (Anki-like cadence)
    // 1d -> 3d -> 7d -> 14d -> 30d -> 60d
    const STEP_MINUTES = [1440, 4320, 10080, 20160, 43200, 86400];

    if (isCorrect) {
        const prevTotal = (s.successCount || 0) + (s.failCount || 0);
        s.successCount = (s.successCount || 0) + 1;
        s.streak = (s.streak || 0) + 1;

        if (currentState === 'unlearned' && prevTotal === 0) {
            s.firstTryPerfect = true;
        }

        // Advance interval step on success
        s.reviewStep = Math.min(STEP_MINUTES.length - 1, (s.reviewStep || 0));
        const intervalMin = STEP_MINUTES[s.reviewStep];
        s.reviewStep = Math.min(STEP_MINUTES.length - 1, s.reviewStep + 1);

        // Keep stability for compatibility with existing UI/logic
        s.stability = Math.min(120, Math.max(1, (s.stability || 1) * 1.35));
        const jittered = applyDueJitter(intervalMin);
        s.dueAt = now + jittered * 60 * 1000;
    } else {
        s.failCount = (s.failCount || 0) + 1;
        s.streak = 0;
        s.everWrong = true;
        s.firstTryPerfect = false;

        // Quick relearn loop after fail
        s.reviewStep = Math.max(0, (s.reviewStep || 0) - 1);
        s.stability = Math.max(0.4, (s.stability || 1) * 0.6);
        s.dueAt = now + 5 * 60 * 1000;
    }

    s.lastReviewedAt = now;
}

function isReviewLevelEnabledForWord(word, level) {
    const active = gameState.activeReviewLevels || [];
    const base = getWordBaseLevel(word, level);
    return active.includes(base);
}

function renderReviewLevelCheckboxes() {
    const host = document.getElementById('reviewLevelCheckboxes');
    if (!host) return;

    const defs = [
        ['junior', '中学'],
        ['basic', '基礎'],
        ['daily', '標準'],
        ['exam1', '受験'],
        ['selection1400', '1400'],
        ['selection1900', '1900'],
        ['sys_2000', 'Sys2000'],
    ];

    host.innerHTML = '';
    defs.forEach(([key, label]) => {
        const checked = (gameState.activeReviewLevels || []).includes(key);
        const wrap = document.createElement('label');
        wrap.className = 'study-review-level-chip';
        wrap.innerHTML = `<input type="checkbox" data-review-level="${key}" ${checked ? 'checked' : ''}> <span>${label}</span>`;
        host.appendChild(wrap);
    });

    host.querySelectorAll('input[data-review-level]').forEach(el => {
        el.addEventListener('change', () => {
            const selected = Array.from(host.querySelectorAll('input[data-review-level]:checked')).map(i => i.dataset.reviewLevel);
            gameState.activeReviewLevels = selected.length ? selected : ['daily', 'exam1'];
            saveGame();
            updateReviewQueueBadge();
            updateReviewProgressUI();
        });
    });
}

window.openStudyModeModal = function () {
    const m = document.getElementById('studyModeModal');
    if (m) {
        renderReviewLevelCheckboxes();
        updateReviewProgressUI();
        m.style.display = 'flex';
    }
};

window.closeStudyModeModal = function () {
    const m = document.getElementById('studyModeModal');
    if (m) m.style.display = 'none';
};

window.toggleDueOnlyMode = function () {
    const order = ['off', 'random', 'on'];
    const cur = order.includes(gameState.reviewMode) ? gameState.reviewMode : 'random';
    gameState.reviewMode = order[(order.indexOf(cur) + 1) % order.length];
    saveGame();
    updateModeButtons();
    updateReviewQueueBadge();
    updateReviewProgressUI();
    showNextWord();
};

window.openReviewLevelSettings = function () {
    const all = ['junior', 'basic', 'daily', 'exam1', 'selection1400', 'selection1900', 'sys_2000'];
    const current = (gameState.activeReviewLevels || all).join(',');
    const raw = prompt('復習対象レベルをカンマ区切りで入力\n例: daily,exam1\n利用可能: ' + all.join(','), current);
    if (raw === null) return;
    const set = raw.split(',').map(s => s.trim()).filter(Boolean);
    const valid = set.filter(v => all.includes(v));
    gameState.activeReviewLevels = valid.length ? valid : ['daily', 'exam1'];
    saveGame();
    updateReviewQueueBadge();
    alert('復習対象: ' + gameState.activeReviewLevels.join(', '));
};

function getAccuracyStatsByKey(key) {
    const s = ensureSrsEntry(key);
    let success = s.successCount || 0;
    let fail = s.failCount || 0;

    // Migration fallback
    if (success + fail === 0) {
        const state = gameState.wordStates[key];
        if (state === 'perfect') {
            success = 1; fail = 0;
        } else if (state === 'learned') {
            success = 1; fail = 1;
        } else if (state === 'weak') {
            success = 0; fail = 1;
        }
    }

    const total = success + fail;
    const rate = total > 0 ? Math.round((success / total) * 100) : null;
    return { success, fail, total, rate };
}

function deriveStateFromAccuracy(key) {
    const prev = gameState.wordStates[key] || 'unlearned';
    const a = getAccuracyStatsByKey(key);
    if (a.total === 0) return prev === 'unlearned' ? 'unlearned' : prev;

    if (a.rate >= 80) return 'perfect';
    if (a.rate >= 50) return 'learned';
    return 'weak';
}

function getAccuracyTagInfoByKey(key) {
    const a = getAccuracyStatsByKey(key);
    if (a.total === 0 || a.rate == null) {
        return { text: '正答率 --', color: '#95a5a6' };
    }

    if (a.rate >= 80) {
        return { text: `正答率 ${a.rate}%`, color: '#f1c40f' };
    }
    if (a.rate >= 50) {
        return { text: `正答率 ${a.rate}%`, color: '#2ecc71' };
    }
    return { text: `正答率 ${a.rate}%`, color: '#e74c3c' };
}

const WORD_LIST_LEVELS = [
    ['junior', '中学', 'A1'],
    ['basic', '基礎', 'A2'],
    ['daily', '標準', 'B1'],
    ['exam1', '受験', 'B2']
];

const WORD_LIST_FILTERS = [
    ['all', 'すべて'],
    ['unlearned', '未学習'],
    ['learned', '得意'],
    ['perfect', '完璧'],
    ['weak', '苦手']
];

const WORD_LIST_POS_ORDER = ['名', '動', '形', '副', '助', '前', '接', '代', 'other'];

const WORD_LIST_POS_CLASS = {
    '名': 'word-list-pos-noun',
    '動': 'word-list-pos-verb',
    '形': 'word-list-pos-adj',
    '副': 'word-list-pos-adv',
    '助': 'word-list-pos-aux',
    '前': 'word-list-pos-prep',
    '接': 'word-list-pos-conj',
    '代': 'word-list-pos-pron',
    'other': 'word-list-pos-other'
};

const WORD_LIST_POS_LABEL = {
    '名': '名',
    '動': '動',
    '形': '形',
    '副': '副',
    '助': '助',
    '前': '前',
    '接': '接',
    '代': '代',
    'other': '他'
};

var wordListState = {
    level: 'basic',
    filter: 'all',
    sort: 'abc',
    showMeaning: localStorage.getItem('vocabGame_wordListShowMeaning') === 'true',
    searchOpen: false,
    query: ''
};

function normalizeWordListLevel(level) {
    return WORD_LIST_LEVELS.some(([key]) => key === level) ? level : 'basic';
}

function getWordListStateForKey(key) {
    return gameState.wordStates[key] || 'unlearned';
}

function getWordListAccuracyInfo(key) {
    const state = getWordListStateForKey(key);
    const s = gameState.srsData && gameState.srsData[key];
    const success = s ? Number(s.successCount || 0) : 0;
    const fail = s ? Number(s.failCount || 0) : 0;
    const total = success + fail;

    if (total > 0) {
        return {
            state,
            rate: Math.round((success / total) * 100)
        };
    }

    const fallback = {
        unlearned: 0,
        weak: 30,
        learned: 65,
        perfect: 100
    };
    return {
        state,
        rate: fallback[state] ?? 0
    };
}

function renderWordListControls() {
    const levelHost = document.getElementById('wordListLevelTabs');
    if (levelHost) {
        levelHost.innerHTML = WORD_LIST_LEVELS.map(([key, label, cefr]) => `
            <button type="button" class="word-list-level-btn ${wordListState.level === key ? 'active' : ''}"
                onclick="setWordListLevel('${key}')">
                ${escapeHtml(label)}<span>${escapeHtml(cefr)}</span>
            </button>
        `).join('');
    }

    const filterHost = document.getElementById('wordListFilterRow');
    if (filterHost) {
        filterHost.innerHTML = WORD_LIST_FILTERS.map(([key, label]) => `
            <button type="button" class="word-list-chip ${wordListState.filter === key ? 'active' : ''}"
                onclick="setWordListFilter('${key}')">${escapeHtml(label)}</button>
        `).join('');
    }

    const meaningState = document.getElementById('wordListMeaningState');
    if (meaningState) meaningState.textContent = wordListState.showMeaning ? 'ON' : 'OFF';

    document.querySelectorAll('.word-list-sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === wordListState.sort);
    });

    const searchRow = document.getElementById('wordListSearchRow');
    if (searchRow) searchRow.style.display = wordListState.searchOpen ? 'flex' : 'none';

    const searchInput = document.getElementById('wordListSearchInput');
    if (searchInput && searchInput.value !== wordListState.query) {
        searchInput.value = wordListState.query;
    }
}

function getSortedWordListItems() {
    const level = normalizeWordListLevel(wordListState.level);
    const query = String(wordListState.query || '').trim().toLowerCase();
    let words = [...(vocabularyDatabase[level] || [])];

    words = words.filter(word => {
        const key = getWordKey(word, level);
        const state = getWordListStateForKey(key);
        if (wordListState.filter !== 'all' && state !== wordListState.filter) return false;

        if (!query) return true;
        const haystack = [
            word.word,
            cleanMeaningForDisplay(word.meaning),
            word.phrase,
            word.pos
        ].join(' ').toLowerCase();
        return haystack.includes(query);
    });

    words.sort((a, b) => {
        if (wordListState.sort === 'pos') {
            const ai = WORD_LIST_POS_ORDER.indexOf(a.pos || 'other');
            const bi = WORD_LIST_POS_ORDER.indexOf(b.pos || 'other');
            const apos = ai === -1 ? WORD_LIST_POS_ORDER.length : ai;
            const bpos = bi === -1 ? WORD_LIST_POS_ORDER.length : bi;
            if (apos !== bpos) return apos - bpos;
        }
        return String(a.word || '').localeCompare(String(b.word || ''), 'en', { sensitivity: 'base' });
    });

    return words;
}

function renderWordList() {
    const modal = document.getElementById('wordListModal');
    if (!modal || modal.style.display === 'none') return;
    const denseCompareMode = new URLSearchParams(window.location.search).get('wordListDense') === '1';
    modal.classList.toggle('word-list-dense-compare', denseCompareMode);

    renderWordListControls();

    const grid = document.getElementById('wordListGrid');
    const count = document.getElementById('wordListCount');
    if (!grid) return;

    const level = normalizeWordListLevel(wordListState.level);
    const allCount = (vocabularyDatabase[level] || []).length;
    const words = getSortedWordListItems();
    if (count) count.textContent = `${words.length.toLocaleString()} / ${allCount.toLocaleString()}語`;

    if (words.length === 0) {
        grid.innerHTML = '<div class="word-list-empty">条件に合う単語がありません</div>';
        return;
    }

    grid.innerHTML = words.map(word => {
        const key = getWordKey(word, level);
        const info = getWordListAccuracyInfo(key);
        const pos = word.pos || 'other';
        const posClass = WORD_LIST_POS_CLASS[pos] || WORD_LIST_POS_CLASS.other;
        const posLabel = WORD_LIST_POS_LABEL[pos] || pos;
        const meaning = cleanMeaningForDisplay(word.meaning);
        const accuracy = Math.max(0, Math.min(100, Number(info.rate || 0)));
        const wordLength = String(word.word || '').length;
        const denseLengthClass = denseCompareMode
            ? (wordLength >= 13 ? 'word-list-word-xl' : wordLength >= 10 ? 'word-list-word-long' : '')
            : '';
        return `
            <button type="button"
                class="word-list-card word-list-card-state-${escapeHtml(info.state)} ${wordListState.showMeaning ? '' : 'hide-meaning'}"
                onclick="openWordFromList('${encodeURIComponent(level)}', '${encodeURIComponent(key)}')">
                <div class="word-list-card-word ${denseLengthClass}">${escapeHtml(word.word)}</div>
                ${wordListState.showMeaning ? `<div class="word-list-card-meaning">${escapeHtml(meaning || word.phrase || '')}</div>` : ''}
                <div class="word-list-card-meta">
                    <span class="word-list-pos-badge ${posClass}">${escapeHtml(posLabel)}</span>
                    <span class="word-list-accuracy" aria-label="正答度 ${accuracy}%">
                        <span class="word-list-accuracy-fill" style="--accuracy:${accuracy}%"></span>
                    </span>
                </div>
            </button>
        `;
    }).join('');
}

function findWordListItemByKey(level, key) {
    return (vocabularyDatabase[level] || []).find(word => getWordKey(word, level) === key) || null;
}

window.openWordListModal = function () {
    wordListState.level = normalizeWordListLevel(gameState.currentLevel);
    const modal = document.getElementById('wordListModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderWordList();
};

window.closeWordListModal = function () {
    const modal = document.getElementById('wordListModal');
    if (modal) modal.style.display = 'none';
};

window.setWordListLevel = function (level) {
    wordListState.level = normalizeWordListLevel(level);
    renderWordList();
};

window.setWordListFilter = function (filter) {
    wordListState.filter = WORD_LIST_FILTERS.some(([key]) => key === filter) ? filter : 'all';
    renderWordList();
};

window.setWordListSort = function (sort) {
    wordListState.sort = sort === 'pos' ? 'pos' : 'abc';
    renderWordList();
};

window.toggleWordListMeaning = function () {
    wordListState.showMeaning = !wordListState.showMeaning;
    localStorage.setItem('vocabGame_wordListShowMeaning', wordListState.showMeaning ? 'true' : 'false');
    renderWordList();
};

window.toggleWordListSearch = function () {
    wordListState.searchOpen = !wordListState.searchOpen;
    if (!wordListState.searchOpen) wordListState.query = '';
    renderWordList();
    if (wordListState.searchOpen) {
        setTimeout(() => {
            const input = document.getElementById('wordListSearchInput');
            if (input) input.focus();
        }, 0);
    }
};

window.setWordListSearch = function (value) {
    wordListState.query = value || '';
    renderWordList();
};

window.clearWordListSearch = function () {
    wordListState.query = '';
    wordListState.searchOpen = false;
    renderWordList();
};

window.openWordFromList = function (level, key) {
    const safeLevel = normalizeWordListLevel(decodeURIComponent(level || ''));
    const decodedKey = decodeURIComponent(key || '');
    const word = findWordListItemByKey(safeLevel, decodedKey);
    if (!word) return;

    if (gameState.currentLevel !== safeLevel) {
        gameState.currentLevel = safeLevel;
        gameState.decks = null;
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.level-btn[data-level="${safeLevel}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        const wbBtn = document.getElementById('wordbookBtn');
        if (wbBtn) wbBtn.classList.remove('active');
        updateWordbookSelectionUI();
        updateLevelCurrentButton();
        loadVocabularyForLevel();
        initializeWordStates();
    }

    clearAutoTimer();
    hideNoWordsMessage();
    gameState.isReviewWord = false;
    gameState.currentWordIndex = 0;
    gameState.currentWord = word;
    gameState.lastShownWordKey = getWordKey(word, safeLevel);
    showWord(word);
    updateDisplay();
    saveGame();
    closeWordListModal();
};

function isRetiredWordByKey(key) {
    const s = ensureSrsEntry(key);
    return !!(s.firstTryPerfect && !s.everWrong);
}

function getReviewWordsByModeAcrossLevels(mode) {
    const levels = gameState.activeReviewLevels || [];
    let out = [];
    levels.forEach(level => {
        const words = vocabularyDatabase[level] || [];
        words.forEach(w => {
            const wrapped = { ...w, __sourceLevel: level };
            const key = getWordKeySafe(wrapped, level);
            if (isRetiredWordByKey(key)) return; // first-try perfect words are permanently excluded
            if (gameState.wordStates[key] === mode) out.push(wrapped);
        });
    });
    return filterWordsByPOS(out);
}

function getCurrentReviewStats() {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const endMs = endOfDay.getTime();

    let dueNow = 0;
    let dueToday = 0;

    const pool = [...getReviewWordsByModeAcrossLevels('weak'), ...getReviewWordsByModeAcrossLevels('learned')];
    pool.forEach(v => {
        const key = getWordKeySafe(v, v.__sourceLevel);
        const s = ensureSrsEntry(key);
        if (s.dueAt <= now) dueNow++;
        if (s.dueAt <= endMs) dueToday++;
    });

    return { dueNow, dueToday };
}

function updateReviewQueueBadge() {
    const el = document.getElementById('dueCountBadge');
    if (!el) return;
    const s = getCurrentReviewStats();
    const display = s.dueNow > 999 ? '999+' : s.dueNow;
    el.textContent = `復習 ${display}`;
    el.style.background = s.dueNow > 0 ? '#e74c3c' : '#95a5a6';
    el.style.color = '#fff';
    el.style.boxShadow = '';
    el.title = `要復習: ${s.dueNow} / 今日予定: ${s.dueToday}`;
}

function getDueReviewWordsPool() {
    const weakDue = getDueOnlyPool('weak', getReviewWordsByModeAcrossLevels('weak'));
    const learnedDue = getDueOnlyPool('learned', getReviewWordsByModeAcrossLevels('learned'));

    // Deterministic order: weak first, then learned; each by dueAt asc
    const byDue = (a, b) => {
        const ak = getWordKeySafe(a, a.__sourceLevel || gameState.currentLevel);
        const bk = getWordKeySafe(b, b.__sourceLevel || gameState.currentLevel);
        const ad = (ensureSrsEntry(ak).dueAt || 0);
        const bd = (ensureSrsEntry(bk).dueAt || 0);
        return ad - bd;
    };

    weakDue.sort(byDue);
    learnedDue.sort(byDue);
    return [...weakDue, ...learnedDue];
}

function playQueuePopAnimation(container, text, kind = 'success') {
    return; // animation disabled by product decision
    if (!container) return;

    const color = kind === 'fail' ? '#5b9bd5' : '#8e9aaf';
    const bg = kind === 'fail' ? '#f2f8ff' : '#f8f9fb';
    const fg = kind === 'fail' ? '#2f5f8f' : '#5c6573';

    const chip = document.createElement('span');
    chip.textContent = text || '✓';
    chip.style.cssText = `position:absolute; left:0; top:0; display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; font-size:11px; font-weight:700; background:${bg}; border:1px solid ${color}; color:${fg}; pointer-events:none; z-index:3; filter:drop-shadow(0 1px 1px rgba(0,0,0,.06));`;
    container.appendChild(chip);

    // subtle trail for "task cleared" feel
    const trail = document.createElement('span');
    trail.style.cssText = `position:absolute; left:2px; top:4px; width:34px; height:16px; border-radius:999px; background:linear-gradient(90deg, ${color}22, transparent); pointer-events:none; z-index:2;`;
    container.appendChild(trail);

    chip.animate([
        { transform: 'translateX(0) scale(1)', opacity: 1 },
        { transform: 'translateX(-10px) scale(0.98)', opacity: 0.95, offset: 0.25 },
        { transform: 'translateX(-34px) scale(0.92)', opacity: 0 }
    ], { duration: 450, easing: 'cubic-bezier(.22,.61,.36,1)' }).onfinish = () => chip.remove();

    trail.animate([
        { transform: 'translateX(0)', opacity: 0.35 },
        { transform: 'translateX(-20px)', opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).onfinish = () => trail.remove();
}

function triggerReviewChipPop(wordText, isFail = false) {
    if (!wordText) return;
    // Defer until after UI re-render to avoid being wiped by innerHTML refresh
    gameState.pendingQueuePop = { text: wordText, kind: isFail ? 'fail' : 'success' };
}

function flashReviewQueueDecrease(total) {
    const badge = document.getElementById('dueCountBadge');
    const label = document.getElementById('reviewProgressLabel');
    if (badge) {
        badge.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(0.9)', filter: 'brightness(1.25)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], { duration: 260, easing: 'ease-out' });
    }
    if (label) {
        const prev = label.textContent;
        label.textContent = `復習キュー ${total}件 ✓`;
        label.style.color = '#2e7d32';
        setTimeout(() => {
            label.textContent = `復習キュー ${total}件`;
            label.style.color = '#555';
        }, 550);
    }
}

function updateReviewProgressUI() {
    const wrap = document.getElementById('reviewProgressWrap');
    const list = document.getElementById('reviewQueuePreview');
    const label = document.getElementById('reviewProgressLabel');
    const mode = document.getElementById('reviewModeInlineLabel');
    const modeModal = document.getElementById('dueOnlyModeLabelModal');
    if (!wrap || !list || !label) return;

    const dueWords = getDueReviewWordsPool();
    const total = dueWords.length;
    const prevCount = (typeof gameState.lastReviewQueueCount === 'number') ? gameState.lastReviewQueueCount : total;

    const newHeadKey = total > 0 ? getWordKey(dueWords[0], gameState.currentLevel) : null;
    const oldHeadKey = gameState.lastReviewQueueHeadKey;

    const modeMap = {
        on: { text: '復習モード:ON', color: '#b42318', bg: '#fff1f1', border: '#fecaca' },
        random: { text: '復習モード:MIX', color: '#a16207', bg: '#fffbeb', border: '#fde68a' },
        off: { text: '復習モード:OFF', color: '#475467', bg: '#f3f4f6', border: '#d1d5db' }
    };
    const m = modeMap[gameState.reviewMode] || modeMap.random;
    const modeText = m.text;
    const modeColor = m.color;
    if (mode) {
        mode.textContent = modeText;
        mode.style.color = modeColor;
        mode.style.background = m.bg;
        mode.style.borderColor = m.border;
    }
    if (modeModal) {
        modeModal.textContent = modeText;
        modeModal.style.color = modeColor;
    }

    label.textContent = `復習キュー ${total}件`;

    const preview = dueWords.slice(0, 10);
    list.innerHTML = '';
    preview.forEach((w, i) => {
        const chip = document.createElement('span');
        chip.textContent = w.word;
        chip.className = 'review-queue-chip';
        if (i === 0) {
            chip.classList.add('is-head');
        }
        list.appendChild(chip);
    });
    if (total > 10) {
        const more = document.createElement('span');
        more.textContent = `+${total - 10}`;
        more.className = 'review-queue-more';
        list.appendChild(more);
    }

    const isOn = gameState.reviewMode === 'on';
    wrap.style.display = total > 0 ? 'block' : (isOn ? 'block' : 'none');
    if (total === 0 && isOn) {
        list.innerHTML = '<span class="review-queue-empty">今は due 切れ復習がありません</span>';
    }

    // Keep head snapshot for debug/consistency checks
    gameState.lastReviewQueueHeadKey = newHeadKey;
    gameState.lastReviewQueueCount = total;

    if (total < prevCount) {
        flashReviewQueueDecrease(total);
    }

    // Play pending pop after render (currently disabled)
    if (gameState.pendingQueuePop) {
        const p = gameState.pendingQueuePop;
        gameState.pendingQueuePop = null;
        requestAnimationFrame(() => playQueuePopAnimation(list, p.text, p.kind));
    }
}

function getBootstrapParamsByState(state) {
    if (state === 'perfect') return { dueDelta: 30 * 24 * 60 * 60 * 1000, stability: 12 };
    if (state === 'learned') return { dueDelta: 3 * 24 * 60 * 60 * 1000, stability: 4 };
    if (state === 'weak') return { dueDelta: 0, stability: 1 };
    return { dueDelta: 0, stability: 1 };
}

function bootstrapSrsFromWordStates() {
    if (!gameState.srsData) gameState.srsData = {};
    const now = Date.now();

    for (const [key, state] of Object.entries(gameState.wordStates || {})) {
        if (gameState.srsData[key]) continue;
        const p = getBootstrapParamsByState(state);
        gameState.srsData[key] = {
            dueAt: now + p.dueDelta,
            stability: p.stability,
            successCount: 0,
            failCount: 0,
            streak: 0,
            lastReviewedAt: 0
        };
    }

    gameState.srsBootstrapped = true;
}

function migrateSrsSchemaIfNeeded() {
    const target = 3;
    if (!gameState.srsData) gameState.srsData = {};
    if ((gameState.srsSchemaVersion || 0) >= target) return;

    const now = Date.now();
    for (const [key, state] of Object.entries(gameState.wordStates || {})) {
        const p = getBootstrapParamsByState(state);
        const existing = gameState.srsData[key] || {};

        let success = existing.successCount || 0;
        let fail = existing.failCount || 0;

        // Migration normalization policy:
        // learned => at least 1/2 equivalent, weak => at least 0/1 equivalent
        const total = success + fail;
        if (state === 'learned' && total < 2) {
            success = 1;
            fail = 1;
        } else if (state === 'weak' && total === 0) {
            success = 0;
            fail = 1;
        } else if (state === 'perfect' && total === 0) {
            success = 1;
            fail = 0;
        }

        gameState.srsData[key] = {
            dueAt: existing.dueAt || (now + p.dueDelta),
            stability: existing.stability || p.stability,
            successCount: success,
            failCount: fail,
            streak: existing.streak || 0,
            lastReviewedAt: existing.lastReviewedAt || 0,
            reviewStep: existing.reviewStep || 0,
            everWrong: !!existing.everWrong,
            firstTryPerfect: !!existing.firstTryPerfect
        };
    }

    gameState.srsSchemaVersion = target;
}

function getDueOnlyPool(mode, pool, options = {}) {
    const now = Date.now();
    const { respectReviewLevels = true } = options;
    let basePool = pool;
    if (respectReviewLevels && (mode === 'weak' || mode === 'learned')) {
        basePool = pool.filter(w => isReviewLevelEnabledForWord(w, w.__sourceLevel || gameState.currentLevel));
    }
    return basePool.filter(w => {
        const key = getWordKeySafe(w, w.__sourceLevel || gameState.currentLevel);
        const s = ensureSrsEntry(key);
        return s.dueAt <= now;
    });
}

function getDueFilteredPool(mode, pool) {
    const basePool = pool;
    const due = getDueOnlyPool(mode, basePool, { respectReviewLevels: false });
    return due.length > 0 ? due : basePool;
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
        actionCounts: gameState.actionCounts, // Persist Detailed Action Counts
        srsData: gameState.srsData, // Phase A: SRS foundation
        srsBootstrapped: gameState.srsBootstrapped,
        srsSchemaVersion: gameState.srsSchemaVersion,
        activeReviewLevels: gameState.activeReviewLevels,
        reviewMode: gameState.reviewMode,
        mixCycleCounter: gameState.mixCycleCounter
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
        if (!gameState.srsData) {
            gameState.srsData = {};
        }
        if (typeof gameState.srsBootstrapped !== 'boolean') {
            gameState.srsBootstrapped = false;
        }
        if (typeof gameState.srsSchemaVersion !== 'number') {
            gameState.srsSchemaVersion = 0;
        }
        if (!Array.isArray(gameState.activeReviewLevels)) {
            gameState.activeReviewLevels = ['junior', 'basic', 'daily', 'exam1', 'selection1400', 'selection1900', 'sys_2000'];
        }
        // migrate old boolean dueOnlyMode -> reviewMode
        if (typeof gameState.reviewMode !== 'string') {
            gameState.reviewMode = gameState.dueOnlyMode ? 'on' : 'random';
        }
        if (!['off','random','on'].includes(gameState.reviewMode)) gameState.reviewMode = 'random';
        if (typeof gameState.lastReviewQueueHeadKey !== 'string') gameState.lastReviewQueueHeadKey = null;
        if (typeof gameState.mixCycleCounter !== 'number') gameState.mixCycleCounter = 0;
        gameState.randomMode = false; // random mode retired

        migrateSrsSchemaIfNeeded();
        bootstrapSrsFromWordStates();

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
        return (gameState.wordStates[key] || 'unlearned') === mode;
    });
    return filterWordsByPOS(modeWords);
}

function getPerfectCountsByCEFR() {
    if (window.StatsEngine && typeof window.StatsEngine.getPerfectCountsByCEFR === 'function') {
        return window.StatsEngine.getPerfectCountsByCEFR(gameState, vocabularyDatabase);
    }
    return { A1: 0, A2: 0, B1: 0, B2: 0, total: 0 };
}

// --- HISTORY SYNC (v2.46.33) ---
window.updateDailyHistory = function () {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Single source of truth: perfect-only snapshot counts
    const counts = getPerfectCountsByCEFR();

    // Back-compat mirror only (source of truth is computed counts)
    gameState.wordsLearned = counts.total;

    // Find Today's Entry
    if (!gameState.dailyHistory) gameState.dailyHistory = [];

    const existingIndex = gameState.dailyHistory.findIndex(h => h.date === todayStr);

    const entryData = (window.StatsEngine && typeof window.StatsEngine.buildDailySnapshot === 'function')
        ? window.StatsEngine.buildDailySnapshot(gameState, vocabularyDatabase, todayStr)
        : {
            date: todayStr,
            total_learned: counts.total,
            wordsLearned: counts.total,
            cefr_breakdown: { A1: counts.A1, A2: counts.A2, B1: counts.B1, B2: counts.B2 }
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
        const key = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
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

function getPreferredEnglishVoice() {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.name === 'Google US English') ||
        voices.find(v => v.name === 'Samantha') ||
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang && v.lang.startsWith('en'));
}

function speakEnglishText(text, options = {}) {
    const value = String(text || '').trim();
    if (!value) return;

    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        console.warn('Speech synthesis is not supported in this browser.');
        return;
    }

    // Ensure audio engine is awake
    if (!audioWakeLockSet) {
        enableAudioStayAwake();
    }
    if (typeof gameAudioContext !== 'undefined' && gameAudioContext && gameAudioContext.state === 'suspended') {
        gameAudioContext.resume();
    }

    const speak = () => {
        const utterance = new SpeechSynthesisUtterance(value);
        utterance.lang = 'en-US';

        const preferredVoice = getPreferredEnglishVoice();
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        speechSynthesis.speak(utterance);
    };

    if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
        setTimeout(speak, 25);
    } else {
        speechSynthesis.cancel();
        speak();
    }
}

function speakWord(word) {
    speakEnglishText(word);
}

function speakText(text) {
    speakEnglishText(text);
}

function speakCurrentExample() {
    if (!gameState.currentWord) return;
    speakText(gameState.currentWord.example || gameState.currentWord.word);
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
    gameState.meaningCardFlipped = false;
    clearAutoTimer();

    // In review ON mode, force unified mixed lane for intuition
    if (gameState.reviewMode === 'on' && gameState.currentMode !== 'unlearned') {
        gameState.currentMode = 'unlearned';
    }

    let words;
    let shouldShowReview = false;
    let reviewType = null;
    let selectedCategory = null; // 'unlearned', 'learned', 'weak'

    if (!gameState.randomMode) {
        // STANDARD MODE
        // For Review Modes (Weak/Learned/Perfect), use Deck Logic
        const mode = gameState.currentMode;
        if (mode === 'weak' || mode === 'learned') {
            const pool = getDueFilteredPool(mode, getWordsByMode(mode));
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
        } else if (mode === 'perfect') {
            // Perfect is not part of routine review queue; manual mode only
            words = getWordsByMode(mode);
            const word = getWordFromDeck(mode, words);
            words = word ? [word] : [];
            gameState.isReviewWord = true;
            reviewType = 'learned';
        } else {
            // Unlearned mode behaves as MIXED queue:
            // - reviewMode=on: review 100%
            // - reviewMode=random: review:new = 7:3 cycle
            // - reviewMode=off: new 100%
            const dueQueue = getDueReviewWordsPool();
            const newPool = getWordsByMode(mode);

            let pickReview = false;
            if (gameState.reviewMode === 'on') {
                pickReview = (dueQueue.length > 0);
            } else if (gameState.reviewMode === 'off') {
                pickReview = false;
            } else {
                const cycle = gameState.mixCycleCounter % 10; // 0..9
                const reviewSlot = cycle < 7;
                pickReview = reviewSlot && dueQueue.length > 0;
                if (!pickReview && newPool.length === 0 && dueQueue.length > 0) {
                    pickReview = true;
                }
            }

            if (pickReview) {
                const word = dueQueue[0]; // strict queue
                words = word ? [word] : [];
                const k = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);
                const st = gameState.wordStates[k];
                shouldShowReview = true;
                reviewType = (st === 'weak') ? 'weak' : 'learned';
                gameState.isReviewWord = true;
                gameState.mixCycleCounter = (gameState.mixCycleCounter + 1) % 10;
            } else {
                if (gameState.reviewMode === 'on') {
                    words = [];
                    gameState.isReviewWord = false;
                } else {
                    const word = getWordFromDeck(mode, newPool);
                    words = word ? [word] : [];
                    gameState.isReviewWord = false;
                    gameState.mixCycleCounter = (gameState.mixCycleCounter + 1) % 10;
                }
            }
        }

    } else {
        // NEW: Adaptive Weighted Probability Logic (v2.79)
        const unlearnedWords = getWordsByMode('unlearned');
        const learnedWords = getDueFilteredPool('learned', getEligibleLearnedWords());
        const weakWords = getDueFilteredPool('weak', getWordsByMode('weak'));

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
        updateReviewProgressUI();
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
    gameState.lastShownWordKey = getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel);

    document.getElementById('vocabWord').innerHTML = renderVocabWordMarkup(word);

    document.getElementById('meaningText').innerHTML = renderMeaningMarkup(word);

    document.getElementById('exampleSentence').textContent = word.example;
    document.getElementById('meaningCard').classList.remove('flipped');

    const vocabCard = document.getElementById('vocabCard');
    const existingBadge = vocabCard.querySelector('.review-badge');
    if (existingBadge) existingBadge.remove();

    if (gameState.isReviewWord) {
        const badge = document.createElement('div');
        badge.className = 'review-badge';
        const info = getAccuracyTagInfoByKey(gameState.lastShownWordKey || getWordKeySafe(word, word.__sourceLevel || gameState.currentLevel));
        badge.textContent = info.text;
        badge.style.backgroundColor = info.color;
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
    // Keep preview aligned with the next actual pick
    updateReviewProgressUI();
}

// NEW: Function to show a SPECIFIC word (for Undo/Restore)
function showWord(word) {
    if (!word) return;

    // Reset Card State
    gameState.meaningCardFlipped = false;
    document.getElementById('meaningCard').classList.remove('flipped');

    document.getElementById('vocabWord').innerHTML = renderVocabWordMarkup(word);

    document.getElementById('meaningText').innerHTML = renderMeaningMarkup(word);

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

    let message = `この${modeNames[gameState.currentMode] || gameState.currentMode}モードには単語がありません`;
    if (gameState.reviewMode === 'on' && gameState.currentMode === 'unlearned') {
        message = '復習集中モード中: 今はdue切れ復習がありません';
    }

    cardsArea.innerHTML = `<div class="no-words">${message}</div>`;
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
                            <div class="card-content">?</div>
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

    const key = getWordKeySafe(currentWord, currentWord.__sourceLevel || gameState.currentLevel);

    updateSrsForWord(key, true, gameState.wordStates[key]);

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

function recordLearningLogPerfectizedStrict(prevState, nextState) {
    if (!((prevState === 'weak' || prevState === 'learned') && nextState === 'perfect')) return;
    try {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const key = 'learningLog_daily_metrics_v1';
        const raw = localStorage.getItem(key) || '{}';
        const metrics = JSON.parse(raw);
        if (!metrics[today]) metrics[today] = { answers: 0, review: 0, perfectized: 0, perfectizedStrict: 0 };
        metrics[today].perfectizedStrict = Number(metrics[today].perfectizedStrict || 0) + 1;
        localStorage.setItem(key, JSON.stringify(metrics));
    } catch (e) {
        console.warn('recordLearningLogPerfectizedStrict failed', e);
    }
}

function handleVocabCardClick() {
    if (typeof window.liveTutorialEvent === 'function') window.liveTutorialEvent('vocab_correct');

    const currentWord = gameState.currentWord;
    if (!currentWord) return;

    if (gameState.isReviewWord) {
        triggerReviewChipPop(currentWord.word, false);
    }

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

    const key = getWordKeySafe(currentWord, currentWord.__sourceLevel || gameState.currentLevel);
    let basePoints = 1;
    let msg = "";

    const currentState = gameState.wordStates[key];

    if (currentState === 'unlearned') {
        gameState.actionCounts.unlearned_correct++;
        checkLevelUp();
    } else if (currentState === 'weak') {
        gameState.actionCounts.weak_correct++;
        basePoints = 2;
        msg = "克服！";
        gameState.learnedWordIntervals[key] = 0;
        gameState.learnedWordIntervals[`${key}_last`] = gameState.globalQuestionCount;
    } else if (currentState === 'learned') {
        gameState.actionCounts.learned_correct++;
        msg = "👍 進捗アップ！";
    } else if (currentState === 'perfect') {
        gameState.actionCounts.perfect_correct++;
        msg = "✨ 完璧維持！";
    }

    checkDailyReset();
    updateSrsForWord(key, true, currentState);
    gameState.wordStates[key] = deriveStateFromAccuracy(key);
    recordLearningLogPerfectizedStrict(currentState, gameState.wordStates[key]);

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
    const card = e.currentTarget;
    clearAutoTimer();

    if (!gameState.meaningCardFlipped) {
        // Save state for Undo
        saveState();
        checkDailyReset(); // Track interaction for Growth Pace

        // Flip = Incorrect / Check
        card.classList.add('flipped');
        gameState.meaningCardFlipped = true;
        if (typeof window.liveTutorialEvent === 'function') window.liveTutorialEvent('meaning_open');

        const currentWord = gameState.currentWord;
        if (!currentWord) return;

        if (gameState.isReviewWord) {
            triggerReviewChipPop(currentWord.word, true);
        }

        const key = getWordKeySafe(currentWord, currentWord.__sourceLevel || gameState.currentLevel);
        const currentState = gameState.wordStates[key];

        updateSrsForWord(key, false, currentState);

        if (currentState === 'perfect') {
            gameState.actionCounts.perfect_incorrect++;
            gameState.learnedWordIntervals[key] = 0;
            gameState.learnedWordIntervals[`${key}_last`] = gameState.globalQuestionCount;
        } else if (currentState === 'learned') {
            gameState.actionCounts.learned_incorrect++;
        } else if (currentState === 'unlearned') {
            gameState.actionCounts.unlearned_incorrect++;
            checkLevelUp();
        } else if (currentState === 'weak') {
            gameState.actionCounts.weak_incorrect++;
        }

        gameState.wordStates[key] = deriveStateFromAccuracy(key);

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
    updateReviewQueueBadge();
    updateReviewProgressUI();
    renderWordList();
}

// --- RPG Animation Logic ---
// --- RPG Animation Logic ---
const ENABLE_BATTLE_ANIMATION = false;
let animTimer = null;

function playAnimation(type) {
    if (!ENABLE_BATTLE_ANIMATION) return;
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
    if (gameState.reviewMode === 'on') {
        gameState.currentMode = 'unlearned';
    }

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === gameState.currentMode) {
            btn.classList.add('active');
        }
    });

    // Random mode retired
    gameState.randomMode = false;
    const randomNotice = document.getElementById('randomNotice');
    if (randomNotice) randomNotice.style.display = 'none';
    const lockModeSelect = gameState.reviewMode === 'on';
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (lockModeSelect) {
            btn.classList.add('disabled');
            btn.disabled = true;
        } else {
            btn.classList.remove('disabled');
            btn.disabled = false;
        }
    });

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

// --- Leaderboard & Cloud Modal UI Logic (Moved from Module) ---
async function openLeaderboard() {
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
    }

    const topList = document.getElementById('lb-list-top');
    const aroundList = document.getElementById('lb-list-around');

    // Standard display toggle (CSS classes handle visibility, but explicit inline style ensures logic works)
    if (topList) topList.style.display = (tab === 'top') ? 'block' : 'none';
    if (aroundList) aroundList.style.display = (tab === 'around') ? 'block' : 'none';

    loadRankingData(tab);
}

async function loadRankingData(type, force = false) {
    console.log("[Debug] loadRankingData called for:", type); // DEBUG
    let container;
    if (type === 'top') container = document.getElementById('lb-list-top');
    else if (type === 'around') container = document.getElementById('lb-list-around');

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
                <div style="font-size:12px; color:#888;">学習を進めるとランキングに反映されます</div>
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
        closeLevelSelector();
        updateWordbookSelectionUI();
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

const wordListModalGlobal = document.getElementById('wordListModal');
if (wordListModalGlobal) {
    wordListModalGlobal.onclick = function (e) {
        if (e.target === wordListModalGlobal) closeWordListModal();
    };
}
