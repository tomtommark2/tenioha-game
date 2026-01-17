
// --- UI MANAGER ---
// Handles Modals, PWA, and non-Firebase UI logic.
// Loaded as a standard script, ensuring critical UI works even if Firebase fails.

console.log("UI Manager Loaded");

// --- VERSION & PWA INIT ---
const APP_VERSION_UI = 'v2.40';
window.addEventListener('load', () => {
    // Version Display
    const v1 = document.getElementById('helpVersionDisplay');
    const v2 = document.getElementById('leaderboardVersionDisplay');
    if (v1) v1.textContent = APP_VERSION_UI;
    if (v2) v2.textContent = `現在のバージョン: ${APP_VERSION_UI}`;

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
            bdAttempts.parentElement.innerHTML = `平均取り組み数: ${total.toFixed(1)} 回 <span style="opacity:0.6;">(÷5)</span>`;
        }

        // Future Prediction Logic
        if (document.getElementById('statFutureMilestone')) {
            const currentTotal = gameState.wordsLearned || 0; // Total words currently mastered/perfect
            // Future = Current + (Pace * 30 days)
            const futureTotal = Math.floor(currentTotal + (pace * 30));

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
                `<span style="font-size: 24px; font-weight: bold; color: ${color};">約 ${futureTotal.toLocaleString()}</span>` +
                `<span style="font-size: 12px; color: #666;">語</span>` +
                `</div>` +
                `<div style="font-size:12px; color:${color}; font-weight:bold; margin-top:2px;">${evaluation}</div>`;
        }
    }

    // Chart Render safely
    if (window.updateChart) {
        setTimeout(() => { window.updateChart('total'); }, 100);
    } else {
        // Safe Fallback for offline/no-module: Render Mock Data
        setTimeout(() => { renderMockChart(); }, 100);
    }
};



function renderRealChart(canvas) {
    if (typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    // Destroy previous
    if (window.myChartInstance) window.myChartInstance.destroy();

    const labels = [];
    const dataHistory = [];
    const dataPrediction = [];

    // 1. Build History Data
    // History is [{date, answers, wordsLearned}, ...]

    // --- DEBUG: INJECT MOCK DATA (REQUESTED) ---
    // If history is empty, show 7 days of mock growth for visualization
    let debugHistory = [];
    if (!gameState.dailyHistory || gameState.dailyHistory.length === 0) {
        const base = Math.max(0, (gameState.wordsLearned || 0) - 50);
        for (let i = 7; i > 0; i--) {
            debugHistory.push({
                date: `1/${20 - i}`, // Fake date
                wordsLearned: base + (i * 5) + Math.floor(Math.random() * 3)
            });
        }
    } else {
        debugHistory = gameState.dailyHistory;
    }

    // Add Past
    if (debugHistory) {
        debugHistory.forEach(h => {
            // simplified date label (MM/DD)
            const d = h.date ? h.date.slice(5).replace('-', '/') : '';
            labels.push(d);
            dataHistory.push(h.wordsLearned || 0);
            dataPrediction.push(null);
        });
    }

    // Add Today
    labels.push('今日');
    const current = gameState.wordsLearned || 0;
    dataHistory.push(current);
    dataPrediction.push(null); // Last point of history connects to prediction?

    // 2. Build Prediction Data (Next 30 Days)
    // Connect prediction line to today's value
    dataPrediction[dataPrediction.length - 1] = current;

    // Calculate Pace
    let pace = 0;
    if (document.getElementById('statVelocity')) {
        pace = parseFloat(document.getElementById('statVelocity').textContent) || 0;
    }

    // Create 3 milestone points (10 days, 20 days, 30 days) to keep chart clean
    for (let i = 1; i <= 3; i++) {
        const days = i * 10;
        labels.push(`+${days}日`);
        dataHistory.push(null);
        dataPrediction.push(Math.floor(current + (pace * days)));
    }

    // Render
    window.myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'これまでの軌跡',
                    data: dataHistory,
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: '未来の予測',
                    data: dataPrediction,
                    borderColor: '#fab1a0',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: { display: true, text: '学習ロードマップ' },
                tooltip: { enabled: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Keep Mock for fallback if needed (simplified)
function renderMockChart(canvas) {
    if (!canvas) canvas = document.getElementById('learningChart');
    if (!canvas) return;


    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText("学習ロードマップ (オフライン版)", w / 2, 20);

    // Draw Grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        let y = 40 + i * ((h - 60) / 4);
        ctx.moveTo(30, y);
        ctx.lineTo(w - 10, y);
    }
    ctx.stroke();

    // Draw History Line (Purple)
    ctx.beginPath();
    ctx.strokeStyle = "#6c5ce7";
    ctx.lineWidth = 2;
    let startX = 30;
    let step = (w - 40) / 60; // 60 points
    let currentY = h - 30;
    ctx.moveTo(startX, currentY);

    for (let i = 0; i < 30; i++) { // First 30 pts
        currentY -= Math.random() * 2 + 1; // Slow growth
        ctx.lineTo(startX + i * step, currentY);
    }
    let midX = startX + 30 * step;
    let midY = currentY;
    ctx.stroke();

    // Draw Area
    ctx.lineTo(midX, h - 20);
    ctx.lineTo(startX, h - 20);
    ctx.fillStyle = "rgba(108, 92, 231, 0.1)";
    ctx.fill();

    // Draw Future Line (Orange Dashed)
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#fab1a0";
    ctx.moveTo(midX, midY);

    for (let i = 1; i <= 30; i++) { // Next 30 pts
        currentY -= 3; // Fast growth (Best Self)
        ctx.lineTo(midX + i * step, currentY);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    ctx.fillStyle = "#666";
    ctx.font = "10px sans-serif";
    ctx.fillText("実線: 実績 / 点線: 未来の予測", w / 2, h - 5);
}

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
