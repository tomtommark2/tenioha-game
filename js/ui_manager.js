
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

    // Real Data for Growth Pace
    if (document.getElementById('statVelocity')) {
        let pace = 0;
        let total = 0;

        if (typeof gameState !== 'undefined' && gameState.dailyStats) {
            let totalAnswers = gameState.dailyStats.answers || 0;
            let daysCount = 1;

            if (gameState.dailyHistory && gameState.dailyHistory.length > 0) {
                // Get last 7 entries
                const recentHistory = gameState.dailyHistory.slice(-7);
                recentHistory.forEach(h => {
                    totalAnswers += (h.answers || 0);
                });
                daysCount += recentHistory.length;
            }

            const avgAnswers = totalAnswers / daysCount;
            pace = avgAnswers / 5;

            // For display usage
            total = avgAnswers;
        }

        document.getElementById('statVelocity').textContent = pace.toFixed(1);

        // Update Breakdown Area
        const bdAttempts = document.getElementById('statBreakdownAttempts');
        if (bdAttempts && bdAttempts.parentElement) {
            // Simplify breakdown to Total / 5 formula
            // User Req: Weakness Attempts = Total Attempts - Correct From Unlearned
            const attempts = total; // already avgAnswers
            // We need daily learned count. Since 'total' here is avgAnswers, we should ideally use today's actual stats for breakdown.
            // But 'total' variable comes from lines 109-126 which iterates recent history.
            // Let's stick to "Today's" actual if available, or average.
            // Actually, the user says "15.0 stuck". That suggests 'pace' / 5 logic.
            // Let's use today's `dailyStats` if available for the breakdown number.

            let weakAttempts = 0;
            if (gameState.dailyStats) {
                const ans = gameState.dailyStats.answers || 0;
                const learned = gameState.dailyStats.learned || 0;
                weakAttempts = ans - learned; // Formula
                if (weakAttempts < 0) weakAttempts = 0;
            }

            bdAttempts.parentElement.innerHTML = `苦手取り組み数: ${weakAttempts} 回 <span style="opacity:0.6;">(総数-新規)</span>`;
        }

        // Future Prediction Logic
        if (document.getElementById('statFutureMilestone')) {
            const currentTotal = gameState.wordsLearned || 0; // Total words currently mastered/perfect
            // Future = Pace * 30 days (User expects Increment, not Total)
            const futureGain = Math.floor(pace * 30);

            // Evaluation Tiers
            let evaluation = "";
            let color = "#aaa"; // default gray

            if (pace < 3) {
                evaluation = "🚶 マイペース";
                color = "#95a5a6";
            } else if (pace < 5) {
                evaluation = "🏃 良い調子！";
                color = "#f1c40f"; // Yellow/Orange
            } else if (pace < 10) {
                evaluation = "🚴 急上昇中！";
                color = "#e67e22"; // Orange
            } else {
                evaluation = "🚀 ゾーン突入！";
                color = "#e74c3c"; // Red/Fire
            }

            document.getElementById('statFutureMilestone').innerHTML =
                `<div style="display: flex; align-items: baseline; gap: 3px;">` +
                `<span style="font-size: 24px; font-weight: bold; color: ${color};">+${futureGain.toLocaleString()}</span>` +
                `<span style="font-size: 12px; color: #666;">語</span>` +
                `</div>` +
                `<div style="font-size:12px; color:${color}; font-weight:bold; margin-top:5px;">${evaluation}</div>`;
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

    const labels = [];
    const dataHistory = [];

    // --- GAP FILL DATA (Past 30 Days) ---
    // Generate dates
    let dates = [];
    let today = new Date();
    for (let i = 29; i >= 0; i--) {
        let d = new Date();
        d.setDate(today.getDate() - i);
        let yyyy = d.getFullYear();
        let mm = String(d.getMonth() + 1).padStart(2, '0');
        let dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }

    // Map history
    let historyMap = new Map();
    if (gameState.dailyHistory) {
        gameState.dailyHistory.forEach(h => {
            // Standardize format if needed, assuming YYYY-MM-DD or similar
            // If gameState uses M/D, we need to be careful.
            // Let's assume gameState.dailyHistory keys are consistent.
            // Actually, let's just use what we have or fill gaps.
            historyMap.set(h.date, h.wordsLearned);
        });
    }

    let currentVal = gameState.wordsLearned || 0;
    // Backfill from today?
    // Simplified: Just use available history or hold steady
    // If we rely on updateChart (Firebase) this is just a backup.

    // Let's just plot what we have in gameState.dailyHistory + Today
    // But aligning to 30 days is better.

    // Simple version for "Offline/Guest" fallback:
    dates.forEach(dStr => {
        // Label M/D
        labels.push(dStr.slice(5).replace('-', '/'));

        // Find data
        // Start with 0 or last known?
        // Since gameState might be sparse, we just plot points we have?
        // Or flat line.
        let val = historyMap.get(dStr);
        if (val === undefined) {
            // If today, use currentVal
            // If past, use previous known or 0
            // This is complex for sync function.
            // Just plotting linear progress between known points.
        }
    });

    // RE-IMPLEMENTATION: Just use the data we have and Chart.js will connect lines
    // But user wants 30 days X axis.

    // Let's stick to the visual style update first:
    // Purple Line, No Dashed Prediction, Gradient Fill.

    // Re-do data prep simpler:
    const simpleLabels = [];
    const simpleData = [];

    if (gameState.dailyHistory) {
        gameState.dailyHistory.slice(-30).forEach(h => {
            simpleLabels.push(h.date ? h.date.slice(5) : '');
            simpleData.push(h.wordsLearned);
        });
    }
    simpleLabels.push(today.getMonth() + 1 + '/' + today.getDate());
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
            link.href = `${STRIPE_BASE_URL}?client_reference_id=${userId}`;
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
        const btn = document.querySelector(`.level-btn[data-level="${level}"]`);
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
