
// --- UI MANAGER ---
// Handles Modals, PWA, and non-Firebase UI logic.
// Loaded as a standard script, ensuring critical UI works even if Firebase fails.

console.log("UI Manager Loaded");

// --- VERSION & PWA INIT ---
// const APP_VERSION_UI = 'v2.51'; // NOW USING GLOBAL GAME_VERSION
window.addEventListener('load', () => {
    // Version Display
    const v1 = document.getElementById('helpVersionDisplay');
    const v2 = document.getElementById('leaderboardVersionDisplay');
    if (v1) v1.textContent = GAME_VERSION;
    if (v2) v2.textContent = `現在のバージョン: ${GAME_VERSION}`;

    // Init PWA/Welcome
    initWelcomeSequence();

    // Init Simple UI Listeners
    initGlobalUIListeners();
});

function initGlobalUIListeners() {
    // Help Modal Overlay Logic
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpModal');
    if (helpModal) {
        helpModal.onclick = (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; };
        if (closeHelpBtn) closeHelpBtn.onclick = () => helpModal.style.display = 'none';
    }

    const wbModal = document.getElementById('wordbookModal');
    const closeWbBtn = document.getElementById('closeWordbookModal');
    if (wbModal) {
        wbModal.onclick = (e) => { if (e.target === wbModal) wbModal.style.display = 'none'; };
        if (closeWbBtn) closeWbBtn.onclick = () => wbModal.style.display = 'none';

        // Removed JS loop for wordbook-item-btn to allow inline onclick to work
    }
}

// --- PROFILE MODAL ---
window.toggleProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    if (modal.style.display === 'flex') {
        window.closeProfileModal();
    } else {
        window.openProfileModal();
    }
};

window.openProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Attempt update premium display (if logic exists elsewhere or we move it here)
    if (window.updatePremiumStatusDisplay) {
        try { window.updatePremiumStatusDisplay(); } catch (e) { }
    }
    // Chart logic moved to Learning Log Modal
};

// Robust Wordbook Selector (Called via inline onclick)
window.selectWordbook = function (level) {
    if (!level) return;
    if (typeof gameState === 'undefined') {
        alert("ゲームデータの読み込みが完了していません。少々お待ちください。");
        return;
    }

    // Confirmation removed as per user request

    // Check if switchLevel function is available (defined in game_logic.js)
    if (typeof switchLevel === 'function') {
        // Use Soft Switch for smoother experience (No Reload)
        switchLevel(level);

        // Close the modal
        const modal = document.getElementById('wordbookModal');
        if (modal) modal.style.display = 'none';

    } else {
        // Fallback to reload if game_logic not fully ready
        gameState.currentLevel = level;

        if (typeof saveGame === 'function') {
            saveGame();
        } else {
            localStorage.setItem('vocabClickerSave', JSON.stringify(gameState));
        }
        window.location.reload();
    }
};

window.openLearningLogModal = function () {
    const modal = document.getElementById('learningLogModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // 1. Calculate Eiken Level Diagnosis
    let levelCounts = { junior: 0, basic: 0, daily: 0, exam1: 0 }; // Mastered
    let playedCounts = { junior: 0, basic: 0, daily: 0, exam1: 0 }; // Played (Any interaction)
    let levelTotals = { junior: 0, basic: 0, daily: 0, exam1: 0 };

    // Helper: Robust Key Generation (Matches game_logic.js)
    const resolveWordKey = (word, level) => {
        if (typeof getWordKey === 'function') return getWordKey(word, level);
        // Fallback Logic (Must match game_logic.js)
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
    };

    // Count Mastery and Played
    if (typeof vocabularyDatabase !== 'undefined') {
        const cats = ['junior', 'basic', 'daily', 'exam1'];
        cats.forEach(cat => {
            const words = vocabularyDatabase[cat] || [];
            levelTotals[cat] = words.length;
            words.forEach(w => {
                const key = resolveWordKey(w, cat);
                const st = gameState.wordStates[key];

                // Fix: 'unlearned' is default, so only count if state changed (weak, learned, perfect)
                if (st && st !== 'unlearned') {
                    playedCounts[cat]++;
                }
                if (st === 'learned' || st === 'perfect') {
                    levelCounts[cat]++;
                }
            });
        });
    }

    // --- NEW LOGIC: Total Vocabulary Estimation ---
    let totalEstVocab = 0;
    let breakdown = {};

    ['junior', 'basic', 'daily', 'exam1'].forEach(cat => {
        const total = levelTotals[cat] || 0;
        const played = playedCounts[cat] || 0;
        const mastered = levelCounts[cat] || 0;

        // 1. Accuracy (Played > 0 ? Mastered / Played : 0)
        const accuracy = played > 0 ? (mastered / played) : 0;

        // 2. Confidence (0.8 ~ 1.0)
        // linear from 0.8 at 0 play, to 1.0 at 200 play
        let confidence = 0.8 + (0.2 * Math.min(played, 200) / 200);

        // 3. Estimated Count for this level
        // User Req: Ignore if played < 100
        let estCount = 0;
        if (played >= 100) {
            estCount = Math.floor(total * accuracy * confidence);
        }

        totalEstVocab += estCount;
        breakdown[cat] = estCount;
    });

    // Estimate Eiken Level based on Total Count (approx 8000 max)
    let eikenLabel = "";
    let eikenColor = "#95a5a6"; // Gray

    if (totalEstVocab >= 6500) {
        eikenLabel = "英検準1級 相当";
        eikenColor = "#f1c40f"; // Gold
    } else if (totalEstVocab >= 4500) {
        eikenLabel = "英検2級 相当";
        eikenColor = "#bdc3c7"; // Silver
    } else if (totalEstVocab >= 3000) {
        eikenLabel = "英検準2級 相当";
        eikenColor = "#e67e22"; // Bronze
    } else if (totalEstVocab >= 1500) {
        eikenLabel = "英検3級 相当";
        eikenColor = "#2ecc71"; // Green
    } else {
        eikenLabel = "英検4級〜5級";
        eikenColor = "#3498db"; // Blue
    }

    const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
    const lockAction = 'onclick="window.openPurchaseModal(); event.stopPropagation();"';
    const lockIcon = '<span style="font-size: 0.8em; opacity:0.7;">🔒</span>';

    // Total: Blur effect (Mosaic) instead of Lock Icon
    const displayTotal = isUnlocked ?
        `約 ${totalEstVocab.toLocaleString()}語` :
        `<span ${lockAction} title="プレミアム機能" style="cursor:pointer;">約 <span style="filter: blur(5px); user-select: none; pointer-events: none; display:inline-block;">${totalEstVocab.toLocaleString()}</span> 語</span>`;

    // Other locks remain as icons
    const displayEiken = isUnlocked ? eikenLabel : `<span ${lockAction} style="cursor:pointer; display:flex; align-items:center; gap:4px; justify-content:center;">${lockIcon} <span style="font-size:0.8em;">分析完了</span></span>`;

    // Mask Breakdown
    const mkBd = (val) => isUnlocked ? `<b>${val}語</b>` : `<b ${lockAction} style="cursor:pointer;">${lockIcon}</b>`;
    const bdA1 = mkBd(breakdown.junior);
    const bdA2 = mkBd(breakdown.basic);
    const bdB1 = mkBd(breakdown.daily);
    const bdB2 = mkBd(breakdown.exam1);

    // Adjust colors for Locked state (Gray out)
    const finalEikenColor = isUnlocked ? eikenColor : '#bdc3c7';
    const finalEikenStyle = isUnlocked ? `color: ${finalEikenColor}; border:1px solid ${finalEikenColor};` : `color: #7f8c8d; border:1px dashed #bdc3c7; background:#f0f3f4;`;

    // 2. Inject UI (Vocab Diagnosis)
    const container = document.getElementById('vocabDiagnosisContainer');

    if (container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px; text-align: center; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); padding: 15px; border-radius: 12px; border: 1px solid #dfe6e9; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; color: #7f8c8d; font-weight: bold; margin-bottom: 5px; letter-spacing: 1px;">推定語彙数</div>
                <div style="font-size: 28px; font-weight: 900; color: #2c3e50; text-shadow: 1px 1px 0px rgba(0,0,0,0.1); margin-bottom: 2px;">
                    ${displayTotal}
                </div>
                <div style="font-size: 14px; font-weight:bold; ${finalEikenStyle} margin-bottom: 8px; background:white; display:inline-block; padding:2px 10px; border-radius:10px; box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    ${displayEiken}
                </div>
                <div style="display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; margin-top:5px;">
                    <span style="font-size: 10px; color: #666; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc;">A1:${bdA1}</span>
                    <span style="font-size: 10px; color: #666; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc;">A2:${bdA2}</span>
                    <span style="font-size: 10px; color: #666; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc;">B1:${bdB1}</span>
                    <span style="font-size: 10px; color: #666; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc;">B2:${bdB2}</span>
                </div>
                <div style="font-size: 10px; color: #999; margin-top: 8px; text-align: right;">
                    ※推定の為に、各レベルで最低100語はプレイしてください。
                </div>
            </div>
        `;
    }


    // --- Real Data Calculation (Lifetime & Recent) ---
    // CLEANED: Removed legacy fallback logic as per user request (v2.65+)
    let total = 0; // Daily Average
    let pace = 0; // Velocity


    // 1. Calculate Play Days
    const now = Date.now();
    const start = gameState.firstPlayedAt || now;
    let realDays = Math.floor((now - start) / 86400000) + 1; // Days + 1 as allowed
    if (realDays < 1) realDays = 1;

    // 2. Calculate Stats from Action Counts (Strict Mode)
    if (gameState.actionCounts) {
        const ac = gameState.actionCounts;

        // A. Average Learning Count (Total Actions / Days)
        const sumAll = ac.unlearned_correct + ac.unlearned_incorrect +
            ac.weak_correct + ac.weak_incorrect +
            ac.learned_correct + ac.learned_incorrect +
            ac.perfect_correct + ac.perfect_incorrect;
        total = sumAll / realDays;

        // B. Velocity (New Words Acquisition Capability) - EXCLUDES 'unlearned_correct'
        const acquisitionSum = ac.unlearned_incorrect +
            ac.weak_correct + ac.weak_incorrect +
            ac.learned_correct + ac.learned_incorrect +
            ac.perfect_incorrect;
        pace = acquisitionSum / realDays;


    }

    // --- UI Updates ---

    // 3. UI Updates

    // Daily Average Display
    const avgDisplay = document.getElementById('statDailyAverage');
    if (avgDisplay) {
        avgDisplay.textContent = total.toFixed(1);

        // --- Completion Prediction (New) ---
        // Formula: Remaining / (DailyAvg + Velocity)
        const currentLvl = gameState.currentLevel || 'basic';

        let tgtTotal = 0;
        let tgtDone = 0;

        // Try to get Dynamic Total (for Wordbooks)
        if (gameState.currentLevelTotal) {
            tgtTotal = gameState.currentLevelTotal;
            // Get Done count from DOM (Active Wordbook Stats) if available
            const learnedEl = document.getElementById('learnedCount');
            const perfectEl = document.getElementById('perfectCount');
            if (learnedEl && perfectEl) {
                tgtDone = parseInt(learnedEl.textContent) + parseInt(perfectEl.textContent);
            } else {
                // Fallback to levelCounts map if DOM not ready (unlikely)
                tgtDone = levelCounts[currentLvl] || 0;
            }
        } else if (levelTotals && levelTotals[currentLvl]) {
            // Fallback to static totals
            tgtTotal = levelTotals[currentLvl] || 0;
            tgtDone = levelCounts[currentLvl] || 0;
        }

        if (tgtTotal > 0) {
            const remaining = tgtTotal - tgtDone;
            const speed = total + pace; // User Formula: Avg + Velocity

            // Name Mapping
            const LEVEL_NAMES = {
                'junior': 'Junior (A1)', 'basic': 'Basic (A2)', 'daily': 'Daily (B1)', 'exam1': 'Exam (B2)',
                'selection1900': '厳選1900+', 'selection1400': '厳選1400+', 'sys_2000': 'システムWORDS'
            };
            const lvlName = LEVEL_NAMES[currentLvl] || currentLvl;

            const predContainer = document.getElementById('completionPredictionContainer');

            if (predContainer) {
                // Premium Lock Check
                const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';

                if (!isUnlocked) {
                    // Locked State (Teaser)
                    predContainer.innerHTML = `
                        <div style="cursor: pointer;" onclick="window.openPurchaseModal();">
                            <div style="font-size: 10px; color: #7f8c8d; margin-bottom:2px;">達成予測</div>
                            <div style="font-size: 12px; color: #2c3e50; font-weight: bold; background: #ecf0f1; border-radius: 4px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;">
                                <span>あと 🔒 日</span>
                            </div>
                            <div style="font-size: 9px; color: #e67e22; margin-top:2px;">プレミアムで表示</div>
                        </div>`;
                } else if (remaining > 0 && speed > 0.1) {
                    const daysLeft = Math.ceil(remaining / speed);
                    predContainer.innerHTML = `
                        <div style="line-height:1.2;">
                            あと<b style="font-size:14px; color:#2980b9;">${daysLeft}日</b>で<br>
                            <span style="font-size:9px; color:#7f8c8d;">${lvlName}制覇</span>
                        </div>`;
                } else if (remaining <= 0) {
                    // Already done
                    predContainer.innerHTML = `
                        <div style="line-height:1.2; font-weight:bold; color:#f39c12;">
                            🎉 ${lvlName}<br>制覇済み！
                        </div>`;
                } else {
                    // Too slow or no data
                    predContainer.innerHTML = `<span style="color:#dcdcdc;">--</span>`;
                }
            }
        }
    }

    // 2. Velocity & Breakdown
    const velDisplay = document.getElementById('statVelocity');
    if (velDisplay) {
        // Re-check lock status for this block scope (or use existing)
        const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
        const lockAction = 'onclick="window.openPurchaseModal(); event.stopPropagation();"';

        // Locked Velocity
        if (!isUnlocked) {
            velDisplay.innerHTML = `<span ${lockAction} style="font-size:0.8em; color:#95a5a6; cursor:pointer;">🔒</span>`;
        } else {
            velDisplay.textContent = pace.toFixed(1);
        }



        // Future Prediction Logic
        if (document.getElementById('statFutureMilestone')) {
            const futureGain = Math.floor(pace * 30);
            let evaluation = "";
            let color = "#aaa";

            if (pace < 3) {
                evaluation = "🚶 マイペース";
                color = "#95a5a6";
            } else if (pace < 5) {
                evaluation = "🏃 良い調子！";
                color = "#f1c40f";
            } else if (pace < 10) {
                evaluation = "🚴 急上昇中！";
                color = "#e67e22";
            } else {
                evaluation = "🚀 ゾーン突入！";
                color = "#e74c3c";
            }

            // Locked Future
            if (!isUnlocked) {
                document.getElementById('statFutureMilestone').innerHTML =
                    `<div style="display: flex; align-items: baseline; gap: 3px; justify-content: center; cursor:pointer;" ${lockAction}>` +
                    `<span style="font-size: 24px; font-weight: bold; color: #bdc3c7;">+🔒</span>` +
                    `<span style="font-size: 12px; color: #bdc3c7;">語</span>` +
                    `</div>` +
                    `<div style="font-size:12px; color:#95a5a6; font-weight:bold; margin-top:5px;">プレミアムで表示</div>`;
            } else {
                document.getElementById('statFutureMilestone').innerHTML =
                    `<div style="display: flex; align-items: baseline; gap: 3px;">` +
                    `<span style="font-size: 24px; font-weight: bold; color: ${color};">+${futureGain.toLocaleString()}</span>` +
                    `<span style="font-size: 12px; color: #666;">語</span>` +
                    `</div>` +
                    `<div style="font-size:12px; color:${color}; font-weight:bold; margin-top:5px;">${evaluation}</div>`;
            }
        }
    }

    // Chart Render safely
    if (window.updateChart) {
        setTimeout(() => { window.updateChart('total'); }, 100);
    } else {
        // Fallback removed as per user request to avoid confusion
        console.error("updateChart function not found. Graph scripts may have failed to load.");
        const chartContainer = document.getElementById('learningGraphSection');
        if (chartContainer) {
            // Optional: Show error or just leave blank?
            // User prefers no misleading graph.
            // We can just leave it or show a text indicating loading error.
            // For now, let's just log it. 
        }
    }
};



function renderRealChart(canvas) {
    if (typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    // Destroy previous
    if (window.myChartInstance) window.myChartInstance.destroy();

    // Used for current day plot
    const today = new Date();

    const simpleLabels = [];
    const simpleData = [];

    if (gameState.dailyHistory) {
        gameState.dailyHistory.slice(-30).forEach(h => {
            simpleLabels.push(h.date ? h.date.slice(5) : '');
            simpleData.push(h.wordsLearned);
        });
    }
    simpleLabels.push((today.getMonth() + 1) + '/' + today.getDate());
    simpleData.push(gameState.wordsLearned || 0);

    // Gradient
    let grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, "#6c5ce7");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    window.myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: simpleLabels,
            datasets: [
                {
                    label: '習得単語数',
                    data: simpleData,
                    borderColor: '#6c5ce7',
                    backgroundColor: grad,
                    fill: 'start',
                    tension: 0, // Straight
                    pointRadius: 5,
                    pointBackgroundColor: '#6c5ce7',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#6c5ce7',
                    bodyFont: { weight: 'bold' }
                }
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 10 }
                },
                y: { beginAtZero: true }
            }
        }
    });
}

// Basic Chart Logic removed (renderMockChart)

// --- OTHER MENU (New Toggle) ---
window.toggleOtherMenu = function () {
    const menu = document.getElementById('otherMenuDropdown');
    const overlay = document.getElementById('otherMenuOverlay'); // Optional: for clicking outside

    if (menu) {
        if (menu.style.display === 'none') {
            menu.style.display = 'block';
            // Add click-outside listener if needed, or simple toggle
            setTimeout(() => {
                document.addEventListener('click', closeOtherMenuOutside);
            }, 0);
        } else {
            menu.style.display = 'none';
            document.removeEventListener('click', closeOtherMenuOutside);
        }
    }
};

function closeOtherMenuOutside(e) {
    const menu = document.getElementById('otherMenuDropdown');
    const btn = document.getElementById('otherMenuBtn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeOtherMenuOutside);
    }
}


window.closeProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
};

// --- PURCHASE MODAL ---
window.openPurchaseModal = function () {
    const modal = document.getElementById('purchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        // Check for userId for Stripe link (userId is in localStorage usually)
        const userId = localStorage.getItem('vocabGame_userId');
        const link = document.getElementById('stripePurchaseLink');
        if (link && userId) {
            const STRIPE_BASE_URL = "https://buy.stripe.com/9B66oIbMidxG5M32Kl7ok01";
            link.href = `${STRIPE_BASE_URL}?client_reference_id = ${userId} `;
        }
    }
};

window.closePurchaseModal = function () {
    const modal = document.getElementById('purchaseModal');
    if (modal) modal.style.display = 'none';
};

// --- LEADERBOARD MODAL ---
window.openLeaderboard = async function () {
    // Check for updates first
    if (window.checkForceUpdate) {
        const canProceed = await window.checkForceUpdate();
        if (!canProceed) return;
    }

    const modal = document.getElementById('leaderboardModal');
    if (modal) modal.style.display = 'flex';

    // UI State based on Auth
    // We check window.firebaseAuth or localStorage?
    // Let's rely on the DOM state set by firebase_app.js or default to Guest
    const isAuth = (window.firebaseAuth && window.firebaseAuth.currentUser);

    if (!isAuth) {
        // Show "Login Required" but maybe allow viewing top? 
        // User logic says: "Login Required"
        const msg = document.getElementById('loginRequiredMessage');
        const content = document.getElementById('leaderboardContent');
        const nameInput = document.getElementById('nameInputParams');

        if (msg) msg.style.display = 'block';
        if (content) content.style.display = 'none';
        if (nameInput) nameInput.style.display = 'none';
    } else {
        const msg = document.getElementById('loginRequiredMessage');
        if (msg) msg.style.display = 'none';

        if (typeof checkNameRegistration === 'function') {
            checkNameRegistration(); // Should define this global or move here?
        } else {
            // Minimal Fallback
            document.getElementById('leaderboardContent').style.display = 'block';
        }
    }
};

window.closeLeaderboard = function () {
    const modal = document.getElementById('leaderboardModal');
    if (modal) modal.style.display = 'none';
};

window.switchTab = function (tab) {
    if (window.fetchLeaderboard) {
        window.switchTabFB(tab); // Call the firebase one if exists
    } else {
        // Fallback UI update only
        document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
    }
};

// --- SIMPLE MODE ---
window.openSimpleModeModal = function () {
    document.getElementById('simpleModeModal').style.display = 'flex';
};

window.startSimpleMode = function (level) {
    document.getElementById('simpleModeModal').style.display = 'none';
    document.body.classList.add('simple-mode');

    if (level === 'wordbook') {
        const wbBtn = document.getElementById('wordbookBtn');
        if (wbBtn) wbBtn.click();
        else {
            const wbModal = document.getElementById('wordbookModal');
            if (wbModal) wbModal.style.display = 'flex';
        }
    } else {
        const btn = document.querySelector(`.level - btn[data - level="${level}"]`);
        if (btn) btn.click();
        else if (typeof switchLevel === 'function') switchLevel(level);
    }
};

window.exitSimpleMode = function () {
    document.body.classList.remove('simple-mode');
};

// --- PWA / WELCOME ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("PWA Install Prompt ready (UI Manager)");

    const btnHelper = document.getElementById('pwaInstallBtn');
    const btnProfile = document.getElementById('profileInstallBtn');

    if (btnHelper) {
        btnHelper.style.background = "#e17055";
        btnHelper.style.cursor = "pointer";
    }
    if (btnProfile) {
        btnProfile.style.display = 'block';
        btnProfile.style.background = "#e17055";
    }
});

window.installApp = () => {
    if (!deferredPrompt) {
        alert("このブラウザでは自動インストールが利用できません。\nブラウザのメニューからインストールしてください。");
        return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
            window.dismissWelcome();
        }
        deferredPrompt = null;
    });
};

window.dismissWelcome = function () {
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const checkbox = document.getElementById('dontShowWelcomeAgain');
    if (welcomeOverlay) {
        welcomeOverlay.style.opacity = '0';
        setTimeout(() => { welcomeOverlay.style.display = 'none'; }, 300);
    }
    if (checkbox && checkbox.checked) {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
    }
};

// Also logic for buttons that call installApp
window.triggerInstall = window.installApp; // Alias

function initWelcomeSequence() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hasSkipped = localStorage.getItem('vocabGame_skipWelcome');
    const welcomeOverlay = document.getElementById('welcomeOverlay');

    // Invite Code Logic (Keep basic parsing here)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || urlParams.get('promo');
    if (inviteCode) {
        const mainInput = document.getElementById('promoCodeInput');
        if (mainInput) mainInput.value = inviteCode;
        const msg = document.getElementById('inviteMessage');
        const span = document.getElementById('welcomeInviteCode');
        if (msg && span) { span.textContent = inviteCode; msg.style.display = 'block'; }
    }

    if (isStandalone) {
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';
        return;
    }
    if (!hasSkipped && welcomeOverlay) {
        welcomeOverlay.style.display = 'flex';
    } else if (welcomeOverlay) {
        welcomeOverlay.style.display = 'none';
    }
}

// --- SHARE / QR ---
window.openShareModal = function () {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'flex';
        const urlDisplay = document.getElementById('shareUrlDisplay');
        if (urlDisplay) urlDisplay.textContent = window.location.href;
    }
};

window.shareApp = async function () {
    const data = { title: '英単語学習クリッカー', text: '一緒にやろう！', url: window.location.href };
    if (navigator.share) {
        try { await navigator.share(data); } catch (e) { }
    } else {
        navigator.clipboard.writeText(data.url).then(() => alert("URLをコピーしました！"));
    }
};

window.toggleQRCode = function () {
    const main = document.getElementById('shareMainContent');
    const qrSec = document.getElementById('qrSection');
    const qrCont = document.getElementById('qrcode');

    if (qrSec.style.display === 'none') {
        main.style.display = 'none';
        qrSec.style.display = 'flex';
        qrCont.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrCont, { text: window.location.href, width: 180, height: 180 });
        } else {
            qrCont.textContent = "QRライブラリ読み込み中";
        }
    } else {
        qrSec.style.display = 'none';
        main.style.display = 'block';
    }
};

// --- SERVICE WORKER UPDATE ---
window.forceUpdateApp = async () => {
    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    reg.update().then(() => {
                        alert('更新を確認しました。最新版であればリロードされます。');
                        setTimeout(() => window.location.reload(), 500);
                    });
                }
                return; // Return if SW logic ran
            }
        }
    } catch (e) {
        console.log("SW Check Failed (Local/Offline):", e);
        // Fallthrough to alert
    }

    // Fallback for No SW, Local file, or Security Error
    const offlineModal = document.getElementById('offlineAlertModal');
    if (offlineModal) {
        offlineModal.style.display = 'flex';
    } else {
        // Ultimate fallback if modal missing
        if (confirm('現在はオフラインです。リロードしますか？')) {
            window.location.reload();
        }
    }
};

// --- NAME REGISTRATION (Simple UI part) ---
window.renamePlayer = function () {
    document.getElementById('playerNameInput').value = localStorage.getItem('vocabGame_playerName') || "";
    document.getElementById('nameInputParams').style.display = 'block';
    document.getElementById('leaderboardContent').style.display = 'none';
    document.getElementById('renameBtn').style.display = 'none';
    document.getElementById('cancelRenameBtn').style.display = 'inline-block';
};

window.cancelRename = function () {
    // We need checkNameRegistration logic. 
    // If it's in Firebase Module, we can't call it easily if module failed.
    // We simply reset UI
    document.getElementById('nameInputParams').style.display = 'none';
    document.getElementById('leaderboardContent').style.display = 'block';
    document.getElementById('renameBtn').style.display = 'block';
};

// --- DEBUG / VERIFICATION HELPERS (Moved from firebase_app for Local Access) ---
// debugInjectHistory removed in v2.50

// --- CLEANUP HELPER (v2.46.32) ---
// Use this to remove the injected test data (451, 551 words)
window.cleanupDebugHistory = function () {
    const gs = window.gameState || (typeof gameState !== 'undefined' ? gameState : null);

    if (!gs || !gs.dailyHistory) {
        alert("履歴データが見つかりません (No History)");
        return;
    }

    const beforeCount = gs.dailyHistory.length;
    // Remove entries strictly matching the debug values we injected
    gs.dailyHistory = gs.dailyHistory.filter(h =>
        h.wordsLearned !== 451 && h.wordsLearned !== 551
    );
    const afterCount = gs.dailyHistory.length;

    // Save to LocalStorage
    if (typeof saveGame === 'function') {
        saveGame();
    } else {
        // PCR Save attempt
        const data = localStorage.getItem('vocabClickerSave');
        if (data) {
            const parsed = JSON.parse(data);
            parsed.dailyHistory = gs.dailyHistory;
            localStorage.setItem('vocabClickerSave', JSON.stringify(parsed));
        }
    }

    if (beforeCount !== afterCount) {
        alert(`テストデータ削除完了: ${beforeCount - afterCount}件 削除しました。\nリロードしてグラフを確認してください。`);
        // Refresh chart if open
        if (typeof updateChart === 'function') updateChart('total');
    } else {
        alert("削除対象データ(451, 551)は見つかりませんでした。");
    }
};

// --- FOCUS MODE UI ---
window.updateFocusOverlay = function (active, timer, timeFormatted, isPaused = false) {
    const overlay = document.getElementById('focusOverlay');
    const timerDisplay = document.getElementById('focusTimerDisplay');
    const durationDisplay = document.getElementById('focusDurationDisplay');

    if (!overlay) return;

    if (!active) {
        overlay.style.display = 'none';
        return;
    }

    overlay.style.display = 'flex';

    // Timer Format: No decimals until 3s, then 1 decimal
    if (timer > 3.0) {
        timerDisplay.textContent = Math.ceil(timer);
    } else {
        timerDisplay.textContent = timer.toFixed(1);
    }

    if (durationDisplay) durationDisplay.textContent = timeFormatted;

    // Pulse effect when low (Red), or Green if Paused
    if (isPaused) {
        timerDisplay.style.color = "#2ecc71"; // Green
    } else {
        timerDisplay.style.color = "#e74c3c"; // Red (No flashing)
    }
};

window.showFocusGameOver = function (duration, reason) {
    const modal = document.getElementById('focusGameOverModal');
    if (!modal) return;

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const resultStr = `${minutes}分 ${seconds} 秒`;

    const resDiv = document.getElementById('focusResultDuration');
    if (resDiv) resDiv.textContent = resultStr;

    modal.style.display = 'flex';
};
