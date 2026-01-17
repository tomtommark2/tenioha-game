
// --- UI MANAGER ---
// Handles Modals, PWA, and non-Firebase UI logic.
// Loaded as a standard script, ensuring critical UI works even if Firebase fails.

console.log("UI Manager Loaded");

// --- VERSION & PWA INIT ---
const APP_VERSION_UI = 'v2.38';
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

window.openLearningLogModal = function () {
    const modal = document.getElementById('learningLogModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Mock Data for Preview Stats (Velocity & Future Vision)
    if (document.getElementById('statVelocity')) {
        // Example: 20 words / day
        document.getElementById('statVelocity').textContent = "20";
    }
    if (document.getElementById('statFutureMilestone')) {
        // Example: Can-do level
        document.getElementById('statFutureMilestone').innerHTML =
            `海外の子供向けニュースが<br>読めるレベル <span style="font-size:12px; color:#aaa;">(約450語)</span>`;
    }

    // Chart Render safely
    if (window.updateChart) {
        setTimeout(() => { window.updateChart('total'); }, 100);
    } else {
        // Safe Fallback for offline/no-module: Render Mock Data
        setTimeout(() => { renderMockChart(); }, 100);
    }
};

// Mock Chart for Offline/Design Verification
function renderMockChart() {
    const canvas = document.getElementById('learningChart');
    if (!canvas) return;

    // Basic Mock Data Logic to simulate "Future Prediction"
    // Since we don't have Chart.js in offline/file:// usually (CDN), we check first.
    if (typeof Chart === 'undefined') {
        drawSimpleMockChart(canvas);
        return;
    }

    // If Chart.js IS cached or available, render mock data
    const ctx = canvas.getContext('2d');

    // Destroy previous instance if exists (hacky way without reference)
    if (window.myChartInstance) {
        window.myChartInstance.destroy();
    }

    // Mock Data: 30 days history + 30 days prediction
    const labels = [];
    const dataHistory = [];
    const dataPrediction = [];

    let current = 100;
    for (let i = -29; i <= 0; i++) {
        labels.push(i === 0 ? '今日' : `${i}日`);
        current += Math.floor(Math.random() * 10) + 5;
        dataHistory.push(current);
        dataPrediction.push(null);
    }
    // Prediction start from today
    dataPrediction[dataPrediction.length - 1] = current;

    for (let i = 1; i <= 30; i++) {
        labels.push(`+${i}日`);
        current += 15; // Velocity
        dataHistory.push(null);
        dataPrediction.push(current);
    }

    window.myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'これまでの実績',
                    data: dataHistory,
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: '未来の予測 (Best Self)',
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
                title: { display: true, text: '学習ロードマップ (デモ表示)' },
                tooltip: { enabled: true }
            },
            scales: {
                x: { display: false }, // Simplify
                y: { beginAtZero: true }
            }
        }
    });
}

function drawSimpleMockChart(canvas) {
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
