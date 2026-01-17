let gameState = {
    points: 0,
    currentMode: 'unlearned',
    currentLevel: 'basic',
    currentWordIndex: 0,
    currentWord: null,
    wordStates: {},
    weakWordProgress: {},
    learnedWordIntervals: {},
    globalQuestionCount: 0,
    sessionStartTime: Date.now(),
    meaningCardFlipped: false,
    isReviewWord: false,
    questionCount: 0,
    autoMode: false,
    randomMode: true,
    posFilters: ['名', '動', '形', '副', '助', '前', '接', '代', 'other'], // Active POS filters
    vocabLevel: 1,
    wordsLearned: 0, // Total words moved from unlearned
    dailyStats: { date: null, answers: 0 }, // New: Track daily interactions for Growth Pace
    dailyHistory: [] // New: Track past daily stats for averages
};

// Initialize with default or empty
let vocabularyDatabase = (typeof DEFAULT_VOCABULARY !== 'undefined') ? JSON.parse(JSON.stringify(DEFAULT_VOCABULARY)) : {
    basic: [],
    daily: [],
    exam1: [],
    exam2: [],
    junior: []
};

// Merge Junior data if loaded via temp variable


let vocabulary = [];
let autoTimer = null;
let gameStateHistory = []; // Stack to store previous states

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
const TRIAL_CONFIG = {
    LIMIT_SECONDS: 600, // 10 minutes

    STORAGE_KEY: "vocabGame_trialState_v2" // Changed key to force reset/migration if needed, or just keep same
};

let trialState = {
    unlocked: false,
    lastPlayDate: null,
    playTimeSeconds: 0
};

let lastTickTime = Date.now();

// Initialize Trial
function initTrialSystem() {
    try {
        const savedTrial = localStorage.getItem(TRIAL_CONFIG.STORAGE_KEY);

        // Get Current Date in JST (Japan Standard Time)
        let today;
        try {
            const jstFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            today = jstFormatter.format(new Date());
        } catch (e) {
            // Fallback to local date if JST fails (e.g. invalid timeZone)
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

        // Daily Reset (JST Midnight)
        if (trialState.lastPlayDate !== today) {
            trialState.lastPlayDate = today;
            if (!trialState.unlocked) {
                trialState.playTimeSeconds = 0; // Reset time if not unlocked
            }
            saveTrialState();
        }

        // Initialize Tick Time
        lastTickTime = Date.now();

        // Toggle UI based on state
        updateTrialUI();

        // Check if already over limit
        checkTrialLimit();

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
    if (trialState.unlocked) {
        updateTrialUI(); // Ensure UI is hidden
        return;
    }

    const now = Date.now();
    const deltaSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    // Only count logical time flow. 
    // If delta is huge (e.g. computer slept for 10 days), it will add that time.
    // This effectively solves "background tab throttling" because next tick will just add the large difference.

    if (deltaSeconds > 0) {
        trialState.playTimeSeconds += deltaSeconds;
    }

    // Save every ~5 seconds (or if huge jump)
    if (Math.floor(trialState.playTimeSeconds) % 5 === 0 || deltaSeconds > 5) {
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
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
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

        // Push yesterday's stats to history if valid
        if (gameState.dailyStats.answers > 0) {
            if (!gameState.dailyHistory) gameState.dailyHistory = [];
            gameState.dailyHistory.push({
                ...gameState.dailyStats,
                wordsLearned: gameState.wordsLearned // Save cumulative words count
            });
        }

        gameState.dailyStats = {
            date: today,
            answers: 0
        };
        // Trigger save to persist the reset state
        saveGame();
    }
}

function incrementDailyStats() {
    checkDailyReset();
    if (!gameState.dailyStats.answers) gameState.dailyStats.answers = 0;
    gameState.dailyStats.answers++;
    // console.log("Daily Stats Incremented:", gameState.dailyStats.answers);
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
    if (gameState.currentLevel.startsWith('selection')) {
        const rawWords = vocabularyDatabase[gameState.currentLevel] || [];
        vocabulary = rawWords.map(v => {
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
                        return {
                            ...v,
                            meaning: refWord.meaning,
                            phrase: refWord.phrase,
                            example: refWord.example,
                            pos: refWord.pos
                        };
                    }
                }
            }
            return v;
        }).filter(v => {
            // Always include if set is not a number (e.g. "system") or matches current level logic
            if (typeof v.set !== 'number') return true;
            return v.set <= gameState.vocabLevel;
        });
    } else {
        vocabulary = vocabularyDatabase[gameState.currentLevel].filter(v => {
            if (typeof v.set !== 'number') return true;
            return v.set <= gameState.vocabLevel;
        });
    }
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
        weakWordProgress: gameState.weakWordProgress,
        learnedWordIntervals: gameState.learnedWordIntervals,
        globalQuestionCount: gameState.globalQuestionCount,
        currentLevel: gameState.currentLevel,
        currentMode: gameState.currentMode,
        vocabLevel: gameState.vocabLevel,
        questionCount: gameState.questionCount,
        wordsLearned: gameState.wordsLearned, // Ensure wordsLearned is saved
        dailyStats: gameState.dailyStats, // Fix: Persist Daily Stats
        dailyHistory: gameState.dailyHistory, // Persist History
        lastSaveTime: Date.now() // Track local save time for Sync Logic
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
    }
}

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
let audioContext = null;
let audioWakeLockSet = false;

function enableAudioStayAwake() {
    if (audioWakeLockSet) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        audioContext = new AudioContext();

        // OPTIMIZATION: Use a looped empty buffer instead of an oscillator.
        // Oscillators can cause high CPU usage or "denormal" math issues on some PCs,
        // leading to slow/robotic speech. Buffers are lighter.
        const buffer = audioContext.createBuffer(1, 1, 22050); // 1 sample
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Connect to destination (no gain node needed for empty buffer, but safety first)
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.0001; // Just enough to be "active" but silent

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

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
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
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

function showNextWord() {
    gameState.meaningCardFlipped = false;
    clearAutoTimer();

    let words;
    let shouldShowReview = false;
    let reviewType = null;

    if (!gameState.randomMode) {
        words = getWordsByMode(gameState.currentMode);
        gameState.isReviewWord = false;
    } else {
        // NEW: Adaptive Weighted Probability Logic
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
            // Critical: Block new words almost entirely
            weightUnlearned = 5;
            weightLearned = 5;
            weightWeak = 90;
        } else if (weakCount >= 100) {
            // Warning: High priority on cleanup
            weightUnlearned = 20;
            weightLearned = 10;
            weightWeak = 70;
        } else if (weakCount >= 50) {
            // Caution: Shift balance
            weightUnlearned = 50;
            weightLearned = 10;
            weightWeak = 40;
        }

        // If a category is empty, set its weight to 0 to avoid selecting it

        if (unlearnedWords.length === 0) weightUnlearned = 0;
        if (learnedWords.length === 0) weightLearned = 0;
        if (weakWords.length === 0) weightWeak = 0;

        const totalWeight = weightUnlearned + weightLearned + weightWeak;

        if (totalWeight === 0) {
            // Fallback if absolutely nothing is available
            words = [];
        } else {
            const r = Math.random() * totalWeight;

            if (r < weightUnlearned) {
                words = unlearnedWords;
                gameState.isReviewWord = false;
            } else if (r < weightUnlearned + weightLearned) {
                words = learnedWords;
                shouldShowReview = true;
                reviewType = 'learned';
            } else {
                words = weakWords;
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
    gameState.currentWordIndex = Math.floor(Math.random() * words.length);
    const word = words[gameState.currentWordIndex];
    gameState.currentWord = word;

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
    if (!gameState.isReviewWord && (gameState.currentMode === 'unlearned' || gameState.currentMode === 'weak')) {
        gameState.questionCount++;
    }

    gameState.wordStates[key] = 'weak';

    if (gameState.weakWordProgress[key]) {
        delete gameState.weakWordProgress[key];
    }

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
        vocabCard.addEventListener('click', handleVocabCardClick);
    }

    if (meaningCard) {
        meaningCard.addEventListener('click', handleMeaningCardClick);
    }
}

function handleVocabCardClick() {
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
    // Save state for Undo
    saveState();
    saveState();
    // incrementDailyStats(); // Moved below to exclude "Unlearned -> Perfect" cases

    const key = getWordKey(currentWord, gameState.currentLevel);
    let basePoints = 1;
    let msg = "";

    // LOGIC: Unlearned -> Perfect, Weak -> Learned, Learned -> Perfect, Perfect -> Perfect
    const currentState = gameState.wordStates[key];

    if (currentState === 'unlearned') {
        gameState.wordStates[key] = 'perfect';
        gameState.wordsLearned++;
        checkLevelUp();
        // Do NOT increment daily stats here (User logic: Known words don't count for growth)
    } else if (currentState === 'weak') {
        incrementDailyStats(); // Count effort
        gameState.wordStates[key] = 'learned';
        basePoints = 2; // User Request: 2 points for weak (Priority)
        msg = "✅ 克服！";
        if (gameState.weakWordProgress[key]) delete gameState.weakWordProgress[key];
        gameState.learnedWordIntervals[key] = 0;
        gameState.learnedWordIntervals[`${key}_last`] = gameState.globalQuestionCount;
    } else if (currentState === 'learned') {
        gameState.wordStates[key] = 'perfect';
        basePoints = 1; // Default 1
        msg = "🏆 完璧マスター！";
        incrementDailyStats(); // Count effort
    } else if (currentState === 'perfect') {
        // Stay perfect
        basePoints = 1; // Default 1
        msg = "✨ 完璧維持！";
        incrementDailyStats(); // Count effort
    } else {
        // Fallback
        gameState.wordStates[key] = 'perfect';
        basePoints = 1;
        incrementDailyStats();
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
    const card = e.currentTarget;
    clearAutoTimer();

    if (!gameState.meaningCardFlipped) {
        // Save state for Undo
        // Save state for Undo
        saveState();
        incrementDailyStats(); // Track interaction for Growth Pace

        // Flip = Incorrect / Check
        card.classList.add('flipped');
        gameState.meaningCardFlipped = true;

        const currentWord = gameState.currentWord;
        if (!currentWord) return;

        const key = getWordKey(currentWord, gameState.currentLevel);
        const currentState = gameState.wordStates[key];

        // LOGIC: Learned -> Weak. Unlearned -> Weak. Perfect -> Learned (Soft landing).

        if (currentState === 'perfect') {
            gameState.wordStates[key] = 'learned';
            // Reset learned interval as it's a "new" learned word effectively
            gameState.learnedWordIntervals[key] = 0;
            gameState.learnedWordIntervals[`${key}_last`] = gameState.globalQuestionCount;
        } else if (currentState === 'learned') {
            gameState.wordStates[key] = 'weak';
        } else if (currentState === 'unlearned') {
            gameState.wordStates[key] = 'weak';
            gameState.wordsLearned++;
            checkLevelUp();
        }
        // If already weak, stay weak.

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
        let title = "見習い魔術師"; // 0-9
        if (percent >= 100) title = "魔法の神";
        else if (percent >= 90) title = "賢者";
        else if (percent >= 70) title = "大魔導士";
        else if (percent >= 50) title = "王宮魔術師";
        else if (percent >= 30) title = "手練れの魔導士";
        else if (percent >= 10) title = "駆け出しの魔法使い";

        document.querySelectorAll('.js-current-title').forEach(el => el.textContent = title);
    }

    // --- World Level Calculation ---
    // Sum of levels from Junior, Basic, Daily, Exam1
    const categories = ['junior', 'basic', 'daily', 'exam1'];
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
    currentLeaderboardTab = tab;
    document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
    const buttons = document.querySelectorAll('.lb-tab');
    if (buttons.length > 0) {
        if (tab === 'top') buttons[0].classList.add('active');
        else if (buttons[1]) buttons[1].classList.add('active');
    }

    document.getElementById('lb-list-top').style.display = (tab === 'top') ? 'block' : 'none';
    document.getElementById('lb-list-around').style.display = (tab === 'around') ? 'block' : 'none';

    loadRankingData(tab);
}

async function loadRankingData(type, force = false) {
    const container = (type === 'top') ? document.getElementById('lb-list-top') : document.getElementById('lb-list-around');
    container.innerHTML = '<div style="padding:10px; color:#999;">データ取得中...</div>';

    if (window.fetchLeaderboard) {
        const data = await window.fetchLeaderboard(type, force);

        if (data.error) {
            container.innerHTML = `<div style="color:red; padding:10px;">エラー: ${data.error}</div>`;
            return;
        }

        if (!data.results || data.results.length === 0) {
            container.innerHTML = `<div style="padding:10px;">ランキングデータがありません</div>`;
            return;
        }

        let html = '';
        data.results.forEach(item => {
            const rankDisplay = (typeof item.rank === 'number') ? item.rank : item.rank;
            const isTop3 = (typeof item.rank === 'number' && item.rank <= 3);

            html += `
                    <div class="ranking-item ${item.isMe ? 'is-me' : ''}">
                        <span class="rank-num ${isTop3 ? 'top3' : ''}">${rankDisplay}</span>
                        <span class="rank-name">${escapeHtml(item.name)}</span>
                        <span class="rank-score">${item.score.toLocaleString()} G</span>
                    </div>`;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = `<div style="padding:10px;">接続できません (オフライン)</div>`;
    }
    document.getElementById('lb-loading').style.display = 'none';
}

function escapeHtml(str) {
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
}

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

