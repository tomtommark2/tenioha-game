
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

    initGlobalUIListeners();
    initAnnouncements();
});

function initGlobalUIListeners() {
    // Help Modal Overlay Logic
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpModal');
    if (helpModal) {
        helpModal.onclick = (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; };
        if (closeHelpBtn) closeHelpBtn.onclick = () => helpModal.style.display = 'none';
        initHelpModalSwipeToClose(helpModal);
    }

    const wbModal = document.getElementById('wordbookModal');
    const closeWbBtn = document.getElementById('closeWordbookModal');
    if (wbModal) {
        wbModal.onclick = (e) => { if (e.target === wbModal) wbModal.style.display = 'none'; };
        if (closeWbBtn) closeWbBtn.onclick = () => wbModal.style.display = 'none';

        // Removed JS loop for wordbook-item-btn to allow inline onclick to work
    }
}

function initHelpModalSwipeToClose(helpModal) {
    const sheet = helpModal.querySelector('.help-modal-content');
    if (!sheet || sheet.dataset.swipeCloseReady === 'true') return;
    sheet.dataset.swipeCloseReady = 'true';

    let startY = 0;
    let startX = 0;
    let currentY = 0;
    let dragging = false;
    let active = false;

    const resetSheet = () => {
        sheet.style.transition = '';
        sheet.style.transform = '';
        sheet.style.opacity = '';
    };

    const closeWithSwipe = () => {
        sheet.style.transition = 'transform 160ms ease, opacity 160ms ease';
        sheet.style.transform = 'translateY(100%)';
        sheet.style.opacity = '0.96';
        window.setTimeout(() => {
            helpModal.style.display = 'none';
            resetSheet();
        }, 160);
    };

    sheet.addEventListener('pointerdown', (e) => {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const startedOnHandle = Boolean(e.target.closest('.help-sheet-handle'));
        const startedOnControl = Boolean(e.target.closest('button, a, input, select, textarea, [role="button"], .help-list-item'));
        if (!startedOnHandle && startedOnControl) return;
        if (!startedOnHandle && sheet.scrollTop > 0) return;

        startY = e.clientY;
        startX = e.clientX;
        currentY = startY;
        dragging = true;
        active = false;
        sheet.style.transition = '';
        if (sheet.setPointerCapture) sheet.setPointerCapture(e.pointerId);
    });

    sheet.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        currentY = e.clientY;
        const dy = currentY - startY;
        const dx = Math.abs(e.clientX - startX);

        if (!active) {
            if (dy < 8 || dy < dx) return;
            active = true;
        }

        if (dy <= 0) return;
        e.preventDefault();
        sheet.style.transform = `translateY(${Math.min(dy, 220)}px)`;
        sheet.style.opacity = String(Math.max(0.82, 1 - dy / 600));
    }, { passive: false });

    const finishSwipe = () => {
        if (!dragging) return;
        const dy = currentY - startY;
        dragging = false;

        if (active && dy > 72) {
            closeWithSwipe();
            return;
        }

        sheet.style.transition = 'transform 160ms ease, opacity 160ms ease';
        sheet.style.transform = '';
        sheet.style.opacity = '';
        window.setTimeout(resetSheet, 170);
    };

    sheet.addEventListener('pointerup', finishSwipe);
    sheet.addEventListener('pointercancel', finishSwipe);
}

const ANNOUNCEMENT_READ_KEY = 'vocabGame_lastReadAnnouncementId';
const ANNOUNCEMENT_AUTO_SHOWN_KEY = 'vocabGame_lastAutoShownAnnouncementId';

function getAnnouncements() {
    return Array.isArray(window.APP_ANNOUNCEMENTS) ? window.APP_ANNOUNCEMENTS : [];
}

function getLatestAnnouncementId() {
    const announcements = getAnnouncements();
    return announcements.length > 0 ? announcements[0].id : null;
}

function getFeaturedAnnouncement() {
    return getAnnouncements().find(item => item && item.featured && item.autoOpenOnce) || null;
}

function escapeAnnouncementText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateAnnouncementBadge() {
    const dot = document.getElementById('announcementUnreadDot');
    const btn = document.getElementById('announcementBtn');
    if (!dot || !btn) return;

    const latestId = getLatestAnnouncementId();
    const lastReadId = localStorage.getItem(ANNOUNCEMENT_READ_KEY);
    const hasUnread = Boolean(latestId && latestId !== lastReadId);
    dot.style.display = hasUnread ? 'block' : 'none';
    btn.setAttribute('aria-label', hasUnread ? '未読のお知らせがあります' : 'お知らせ');
}

function renderAnnouncements({ featuredOnly = false } = {}) {
    const list = document.getElementById('announcementList');
    if (!list) return;

    const announcements = featuredOnly
        ? getAnnouncements().filter(item => item && item.featured)
        : getAnnouncements();
    if (announcements.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#667085; font-size:13px;">現在、新しいお知らせはありません。</div>';
        return;
    }

    list.innerHTML = announcements.map(item => {
        const selectedBody = featuredOnly && item.featuredBody ? item.featuredBody : item.body;
        const body = Array.isArray(selectedBody) ? selectedBody : [selectedBody || ''];
        const bodyHtml = body.map(line => `<div>${escapeAnnouncementText(line)}</div>`).join('');
        const visualHtml = featuredOnly && item.image
            ? `<img class="announcement-feature-visual" src="${escapeAnnouncementText(item.image)}" alt="${escapeAnnouncementText(item.imageAlt || '')}">`
            : '';
        return `
            <div class="announcement-card ${item.featured ? 'is-featured' : ''} ${featuredOnly ? 'is-popup-featured' : ''}">
                ${visualHtml}
                <div class="announcement-card-copy">
                    <div class="announcement-meta">${escapeAnnouncementText(item.version)} / ${escapeAnnouncementText(item.date)}</div>
                    <div class="announcement-title">${escapeAnnouncementText(item.title || 'お知らせ')}</div>
                    <div class="announcement-body">${bodyHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

function setAnnouncementModalMode(featuredAutoOpen) {
    const heading = document.getElementById('announcementHeading');
    const actions = document.getElementById('announcementFeaturedActions');
    const actionButton = document.getElementById('announcementPrimaryAction');
    const featured = getFeaturedAnnouncement();

    document.getElementById('announcementModal')?.classList.toggle('is-featured-mode', featuredAutoOpen);
    if (heading) heading.textContent = featuredAutoOpen ? '大型アップデート' : 'お知らせ';
    if (actions) actions.style.display = featuredAutoOpen ? 'flex' : 'none';
    if (actionButton && featured) {
        actionButton.textContent = featured.actionLabel || '新機能を見る';
    }
}

function shouldAutoOpenFeaturedAnnouncement(featured) {
    if (!featured) return false;

    const params = new URLSearchParams(window.location.search);
    const isExplicitPreview = params.get('announcementPreview') === '1';
    if (isExplicitPreview) return true;
    if (localStorage.getItem(ANNOUNCEMENT_AUTO_SHOWN_KEY) === featured.id) return false;
    if (isDeveloperPreviewMode() && !isExplicitPreview) return false;

    return window.__hadExistingVocabSaveAtBoot === true
        || localStorage.getItem('vocabGame_skipWelcome') === 'true'
        || localStorage.getItem(ONBOARDING_VERSION_KEY) === CURRENT_ONBOARDING_VERSION;
}

function openFeaturedAnnouncement(featured) {
    const modal = document.getElementById('announcementModal');
    if (!modal || !featured) return;

    renderAnnouncements({ featuredOnly: true });
    setAnnouncementModalMode(true);
    localStorage.setItem(ANNOUNCEMENT_AUTO_SHOWN_KEY, featured.id);
    modal.style.display = 'flex';
}

function initAnnouncements() {
    renderAnnouncements();
    updateAnnouncementBadge();

    const modal = document.getElementById('announcementModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) window.closeAnnouncementModal();
        };
    }

    const featured = getFeaturedAnnouncement();
    if (shouldAutoOpenFeaturedAnnouncement(featured)) {
        window.setTimeout(() => openFeaturedAnnouncement(featured), 700);
    }
}

window.openAnnouncementModal = function () {
    const modal = document.getElementById('announcementModal');
    if (!modal) return;

    renderAnnouncements();
    setAnnouncementModalMode(false);
    modal.style.display = 'flex';

    const latestId = getLatestAnnouncementId();
    if (latestId) {
        localStorage.setItem(ANNOUNCEMENT_READ_KEY, latestId);
    }
    updateAnnouncementBadge();
};

window.closeAnnouncementModal = function () {
    const modal = document.getElementById('announcementModal');
    if (modal) modal.style.display = 'none';
};

window.openAnnouncementFeature = function () {
    const latestId = getLatestAnnouncementId();
    if (latestId) localStorage.setItem(ANNOUNCEMENT_READ_KEY, latestId);
    updateAnnouncementBadge();
    window.closeAnnouncementModal();
    if (typeof window.openLeaderboard === 'function') window.openLeaderboard();
};

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
    document.body.classList.add('profile-modal-open');
    setProfileLoginNotice(false);

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
        return window.GameUtils.getWordKey(word, level, vocabularyDatabase);
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
    let eikenTier = "blue";

    if (totalEstVocab >= 6500) {
        eikenLabel = "英検準1級 相当";
        eikenTier = "gold";
    } else if (totalEstVocab >= 4500) {
        eikenLabel = "英検2級 相当";
        eikenTier = "silver";
    } else if (totalEstVocab >= 3000) {
        eikenLabel = "英検準2級 相当";
        eikenTier = "bronze";
    } else if (totalEstVocab >= 1500) {
        eikenLabel = "英検3級 相当";
        eikenTier = "green";
    } else {
        eikenLabel = "英検4級〜5級";
        eikenTier = "blue";
    }

    const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
    const lockClick = 'onclick="window.openPurchaseModal(); event.stopPropagation();"';
    const displayTotal = isUnlocked ?
        `<span class="vocab-diagnosis-total-text">約 ${totalEstVocab.toLocaleString()}語</span>` :
        `<button type="button" class="vocab-diagnosis-locked-total" ${lockClick} title="プレミアム機能">
            <span>約</span>
            <span class="vocab-diagnosis-blur">${totalEstVocab.toLocaleString()}</span>
            <span>語</span>
        </button>`;

    const displayEiken = isUnlocked ?
        `<span class="vocab-diagnosis-eiken vocab-diagnosis-eiken-${eikenTier}">${eikenLabel}</span>` :
        `<button type="button" class="vocab-diagnosis-locked-pill" ${lockClick}>
            <span class="vocab-diagnosis-lock-icon">🔒</span>
            <span>詳細分析は未解放</span>
        </button>`;
    const lockedNotice = isUnlocked ? '' :
        `<button type="button" class="vocab-diagnosis-premium-notice" ${lockClick}>
            <span class="vocab-diagnosis-premium-title">詳細な語彙力分析はプレミアムで表示</span>
            <span class="vocab-diagnosis-premium-copy">推定語彙数、英検目安、CEFR別内訳を確認できます。</span>
            <span class="vocab-diagnosis-premium-cta">制限を解除する</span>
        </button>`;

    // Mask Breakdown
    const mkBd = (val) => isUnlocked ?
        `<b>${val.toLocaleString()}語</b>` :
        `<button type="button" class="vocab-diagnosis-small-lock" ${lockClick}>
            <span>🔒</span>
            <small>内訳</small>
        </button>`;
    const bdA1 = mkBd(breakdown.junior);
    const bdA2 = mkBd(breakdown.basic);
    const bdB1 = mkBd(breakdown.daily);
    const bdB2 = mkBd(breakdown.exam1);

    // 2. Inject UI (Vocab Diagnosis)
    const container = document.getElementById('vocabDiagnosisContainer');

    if (container) {
        container.innerHTML = `
            <div class="vocab-diagnosis-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}">
                <div class="vocab-diagnosis-label">推定語彙数</div>
                <div class="vocab-diagnosis-total">
                    ${displayTotal}
                </div>
                <div class="vocab-diagnosis-eiken-row">
                    ${displayEiken}
                </div>
                ${lockedNotice}
                <div class="vocab-diagnosis-breakdown ${isUnlocked ? '' : 'is-locked'}" aria-label="CEFR別の推定語彙数">
                    <span class="vocab-diagnosis-chip"><span>A1</span>${bdA1}</span>
                    <span class="vocab-diagnosis-chip"><span>A2</span>${bdA2}</span>
                    <span class="vocab-diagnosis-chip"><span>B1</span>${bdB1}</span>
                    <span class="vocab-diagnosis-chip"><span>B2</span>${bdB2}</span>
                </div>
                <div class="vocab-diagnosis-note">
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
        pace = (acquisitionSum / realDays) / 5;


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
                evaluation = "ゾーン突入！";
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

};



function renderRealChart(canvas) {
    if (typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const getCurrentPerfectTotal = () => {
        const gs = window.gameState || (typeof gameState !== 'undefined' ? gameState : null);
        const vDB = (typeof vocabularyDatabase !== 'undefined') ? vocabularyDatabase : (window.vocabularyDatabase || null);
        if (!gs || !gs.wordStates || !vDB) return 0;

        let total = 0;
        ['junior', 'basic', 'daily', 'exam1'].forEach(cat => {
            (vDB[cat] || []).forEach(w => {
                const k = window.GameUtils.getWordKey(w, cat, vDB);
                if (gs.wordStates[k] === 'perfect') total++;
            });
        });
        return total;
    };

    // Destroy previous
    if (window.myChartInstance) window.myChartInstance.destroy();

    // Used for current day plot
    const today = new Date();

    const simpleLabels = [];
    const simpleData = [];

    if (gameState.dailyHistory) {
        gameState.dailyHistory.slice(-30).forEach(h => {
            simpleLabels.push(h.date ? h.date.slice(5) : '');
            simpleData.push(h.total_learned ?? h.wordsLearned ?? 0);
        });
    }
    simpleLabels.push((today.getMonth() + 1) + '/' + today.getDate());
    simpleData.push(getCurrentPerfectTotal());

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
    const btn = document.getElementById('otherMenuBtn');

    if (menu) {
        const isHidden = getComputedStyle(menu).display === 'none';
        if (isHidden) {
            menu.style.display = 'block';
            btn?.setAttribute('aria-expanded', 'true');
            // Add click-outside listener if needed, or simple toggle
            setTimeout(() => {
                document.addEventListener('click', closeOtherMenuOutside);
            }, 0);
        } else {
            menu.style.display = 'none';
            btn?.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', closeOtherMenuOutside);
        }
    }
};

function closeOtherMenuOutside(e) {
    const menu = document.getElementById('otherMenuDropdown');
    const btn = document.getElementById('otherMenuBtn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', closeOtherMenuOutside);
    }
}

window.closeProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('profile-modal-open');
    setProfileLoginNotice(false);
};

// --- PURCHASE MODAL ---
const STRIPE_PAYMENT_LINK_URL = "https://buy.stripe.com/9B66oIbMidxG5M32Kl7ok01";
const STRIPE_CHECKOUT_SESSION_ENDPOINT = window.TENIOHA_STRIPE_CHECKOUT_ENDPOINT
    || "https://us-central1-tenioha-game.cloudfunctions.net/createStripeCheckoutSession";

function stripeFallbackPurchaseUrl(userId) {
    if (!userId) return STRIPE_PAYMENT_LINK_URL;
    return `${STRIPE_PAYMENT_LINK_URL}?client_reference_id=${encodeURIComponent(userId)}`;
}

function checkoutReturnUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.toString();
}

async function createStripeCheckoutSession(user) {
    const idToken = await user.getIdToken();
    const response = await fetch(STRIPE_CHECKOUT_SESSION_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${idToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            app: "tenioha-game",
            purchaseType: "tenioha_premium",
            returnUrl: checkoutReturnUrl()
        })
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Checkout session failed: ${response.status} ${message}`);
    }
    const data = await response.json();
    if (!data.url) throw new Error("Checkout session response did not include url.");
    return data.url;
}

window.openPurchaseModal = function () {
    if (!requireLoginForPurchase()) {
        return;
    }

    const modal = document.getElementById('purchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        // Check for userId for Stripe link (userId is in localStorage usually)
        const userId = (window.firebaseAuth && window.firebaseAuth.currentUser)
            ? window.firebaseAuth.currentUser.uid
            : localStorage.getItem('vocabGame_userId');
        const link = document.getElementById('stripePurchaseLink');
        if (link && userId) {
            link.href = stripeFallbackPurchaseUrl(userId);
        }
    }
};

function requireLoginForPurchase() {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        return true;
    }
    if (typeof window.openProfileModal === 'function') {
        window.openProfileModal();
    }
    setProfileLoginNotice(true);
    return false;
}

function setProfileLoginNotice(visible) {
    const notice = document.getElementById('profileLoginNotice');
    if (!notice) return;
    notice.style.display = visible ? 'block' : 'none';
}

window.showProfileLoginNotice = function () {
    setProfileLoginNotice(true);
};

window.hideProfileLoginNotice = function () {
    setProfileLoginNotice(false);
};

window.closePurchaseModal = function () {
    const modal = document.getElementById('purchaseModal');
    if (modal) modal.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    const purchaseLink = document.getElementById('stripePurchaseLink');
    if (!purchaseLink) return;
    purchaseLink.addEventListener('click', async (event) => {
        if (!requireLoginForPurchase()) {
            event.preventDefault();
            return;
        }

        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!user) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        const fallbackUrl = stripeFallbackPurchaseUrl(user.uid);
        purchaseLink.href = fallbackUrl;
        purchaseLink.classList.add('is-loading');
        purchaseLink.setAttribute('aria-busy', 'true');

        try {
            const checkoutUrl = await createStripeCheckoutSession(user);
            window.location.href = checkoutUrl;
        } catch (error) {
            console.warn("Stripe Checkout Session failed. Falling back to Payment Link.", error);
            window.location.href = fallbackUrl;
        } finally {
            purchaseLink.classList.remove('is-loading');
            purchaseLink.removeAttribute('aria-busy');
        }
    });
});

// --- LEADERBOARD MODAL ---
window.openLeaderboard = async function () {
    // Check for updates first
    if (window.checkForceUpdate) {
        const canProceed = await window.checkForceUpdate();
        if (!canProceed) return;
    }

    const modal = document.getElementById('leaderboardModal');
    if (modal) modal.style.display = 'flex';
    if (typeof updateReviewRankingSummary === 'function') updateReviewRankingSummary();
    const weekLabel = document.getElementById('leaderboardWeekLabel');
    if (weekLabel && typeof getWeekStartDate === 'function') {
        const start = getWeekStartDate();
        weekLabel.textContent = `${start.getMonth() + 1}月${start.getDate()}日から今日まで`;
    }
    if (window.showReviewRankingPreview && window.showReviewRankingPreview()) return;

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
    if (typeof loadRankingData === 'function') loadRankingData('top', true);
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
        deferredPrompt = null;
    });
};

const LIVE_TUTORIAL_KEY = 'vocabGame_skipLiveTutorial';
const ONBOARDING_VERSION_KEY = 'vocabGame_onboardingVersion';
const CURRENT_ONBOARDING_VERSION = '2';
window.liveTutorialState = { active: false, step: 0 };

function isDeveloperPreviewMode() {
    const params = new URLSearchParams(window.location.search);
    return window.location.protocol === 'file:'
        || ['localhost', '127.0.0.1'].includes(window.location.hostname)
        || params.has('dev')
        || params.has('debug')
        || params.has('preview')
        || params.has('helpDesign')
        || params.has('helpOpen');
}

function isTutorialPreviewRequested() {
    return new URLSearchParams(window.location.search).has('tutorialPreview');
}

window.renderLiveTutorial = function () {
    const box = document.getElementById('liveTutorialHint');
    const text = document.getElementById('liveTutorialHintText');
    const actionBtn = document.getElementById('liveTutorialActionBtn');
    if (!box || !text || !actionBtn) return;

    const step = window.liveTutorialState.step;
    const steps = [
        { text: '意味が分かるなら、英単語カードをタップします。', anchor: '#vocabCard', waitAction: false },
        { text: '分からない場合は、意味カードを開きます（不正解として記録）。', anchor: '#meaningCard', waitAction: false },
        { text: '回答履歴から「未学習・苦手・得意・完璧」へ自動分類されます。', anchor: '.mode-buttons', waitAction: true },
        { text: '苦手な単語は復習キューへ戻ります。設定は「その他」→「出題モード」から変更できます。', anchor: '#reviewQueuePreview', waitAction: true },
    ];

    const current = steps[Math.min(step, steps.length - 1)];
    text.textContent = current.text;

    actionBtn.style.display = current.waitAction ? 'inline-block' : 'none';
    actionBtn.textContent = (step >= steps.length - 1) ? '完了' : '次へ';

    let anchor = document.querySelector(current.anchor);
    let usedFallbackAnchor = false;
    if (anchor) {
      const candidateRect = anchor.getBoundingClientRect();
      if (candidateRect.width === 0 || candidateRect.height === 0) {
        anchor = document.querySelector('#otherMenuBtn');
        usedFallbackAnchor = true;
      }
    }
    if (anchor) {
      if (usedFallbackAnchor && window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      const anchorRect = anchor.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const gap = 10;
      const horizontalMargin = 10;
      const centeredLeft = anchorRect.left + (anchorRect.width / 2) - (boxRect.width / 2);
      const maxLeft = Math.max(horizontalMargin, window.innerWidth - boxRect.width - horizontalMargin);
      const left = Math.max(horizontalMargin, Math.min(maxLeft, centeredLeft));
      const fitsAbove = anchorRect.top >= boxRect.height + gap + horizontalMargin;
      const preferredTop = fitsAbove
        ? anchorRect.top - boxRect.height - gap
        : anchorRect.bottom + gap;
      const maxTop = Math.max(horizontalMargin, window.innerHeight - boxRect.height - horizontalMargin);
      const top = Math.max(horizontalMargin, Math.min(maxTop, preferredTop));
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
    } else {
      box.style.left = '12px';
      box.style.top = '12px';
    }
}

window.startLiveTutorial = function () {
    const isTutorialPreview = isTutorialPreviewRequested();
    if (isDeveloperPreviewMode() && !isTutorialPreview) return;
    if (!isTutorialPreview && localStorage.getItem(ONBOARDING_VERSION_KEY) === CURRENT_ONBOARDING_VERSION) return;
    if (!isTutorialPreview && localStorage.getItem(LIVE_TUTORIAL_KEY) === 'true') return;
    const box = document.getElementById('liveTutorialHint');
    if (!box) return;
    window.liveTutorialState = { active: true, step: 0 };
    box.style.display = 'block';
    window.renderLiveTutorial();
}

window.completeLiveTutorial = function () {
    const box = document.getElementById('liveTutorialHint');
    localStorage.setItem(LIVE_TUTORIAL_KEY, 'true');
    localStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_ONBOARDING_VERSION);
    if (box) box.style.display = 'none';
    window.liveTutorialState = { active: false, step: 0 };
}

window.skipLiveTutorial = function () { window.completeLiveTutorial(); }
window.liveTutorialAction = function () {
    if (!window.liveTutorialState || !window.liveTutorialState.active) return;
    const maxStep = 3;
    if (window.liveTutorialState.step >= maxStep) {
        window.completeLiveTutorial();
        return;
    }
    window.liveTutorialState.step += 1;
    window.renderLiveTutorial();
}
window.addEventListener('resize', () => {
    if (window.liveTutorialState && window.liveTutorialState.active) {
        window.renderLiveTutorial();
    }
});

window.liveTutorialEvent = function (eventName) {
    if (!window.liveTutorialState || !window.liveTutorialState.active) return;
    if (window.liveTutorialState.step === 0 && eventName === 'vocab_correct') {
        window.liveTutorialState.step = 1;
        window.renderLiveTutorial();
    } else if (window.liveTutorialState.step === 1 && eventName === 'meaning_open') {
        window.liveTutorialState.step = 2;
        window.renderLiveTutorial();
    }
}

function initWelcomeSequence() {
    if (isTutorialPreviewRequested()) {
        setTimeout(() => window.startLiveTutorial(), 250);
        return;
    }

    const onboardingComplete = localStorage.getItem(ONBOARDING_VERSION_KEY) === CURRENT_ONBOARDING_VERSION;
    const legacyWelcomeSeen = localStorage.getItem('vocabGame_skipWelcome') === 'true';
    const legacyTutorialComplete = localStorage.getItem(LIVE_TUTORIAL_KEY) === 'true';
    const hasExistingSave = window.__hadExistingVocabSaveAtBoot === true;

    // Users who already used the previous flow are migrated without seeing onboarding again.
    if (!onboardingComplete && (legacyWelcomeSeen || legacyTutorialComplete || hasExistingSave)) {
        localStorage.setItem(LIVE_TUTORIAL_KEY, 'true');
        localStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_ONBOARDING_VERSION);
        return;
    }

    if (onboardingComplete) return;

    if (isDeveloperPreviewMode()) {
        const liveTutorial = document.getElementById('liveTutorialHint');
        if (liveTutorial) liveTutorial.style.display = 'none';
        return;
    }

    // Preserve promo URLs even though the old install-first screen has been removed.
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || urlParams.get('promo');
    if (inviteCode) {
        ['purchasePromoCodeInput', 'profilePromoCodeInput'].forEach((inputId) => {
            const input = document.getElementById(inputId);
            if (input) input.value = inviteCode;
        });
    }

    setTimeout(() => {
        if (typeof window.startLiveTutorial === 'function') window.startLiveTutorial();
    }, 250);
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
    const data = { title: 'てにをは英単語', text: '一緒にやろう！', url: window.location.href };
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
        if (window.appUpdateManager) {
            const remoteVersion = await window.appUpdateManager.fetchRemoteVersion();
            if (window.appUpdateManager.compareVersions(remoteVersion, window.GAME_VERSION || 'v0.0') > 0) {
                await window.appUpdateManager.applyAppUpdate(remoteVersion, { force: true });
                return;
            }
        }

        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                // 1) waiting SW exists -> activate immediately
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    setTimeout(() => window.location.reload(), 400);
                    return;
                }

                // 2) check for new SW
                await reg.update();

                // If update produced a waiting worker, activate it
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    setTimeout(() => window.location.reload(), 400);
                    return;
                }

                alert('更新を確認しました。最新版です。');
                setTimeout(() => window.location.reload(), 300);
                return;
            }
        }
    } catch (e) {
        console.log("SW Check Failed (Local/Offline):", e);
        // Fallthrough to offline modal
    }

    // Fallback for No SW, Local file, or Security Error
    const offlineModal = document.getElementById('offlineAlertModal');
    if (offlineModal) {
        offlineModal.style.display = 'flex';
    } else {
        if (confirm('現在はオフラインです。リロードしますか？')) {
            window.location.reload();
        }
    }
};

// --- NAME REGISTRATION (Simple UI part) ---
window.renamePlayer = function () {
    document.getElementById('playerNameInput').value = localStorage.getItem('vocabGame_playerName') || "";
    if (window.selectReviewAvatar) {
        window.selectReviewAvatar(localStorage.getItem('vocabGame_reviewAvatarId') || 'hero');
    }
    document.getElementById('nameInputParams').style.display = 'block';
    document.getElementById('leaderboardContent').style.display = 'none';
    document.getElementById('renameBtn').style.display = 'none';
    document.getElementById('cancelRenameBtn').style.display = 'inline-block';
};

window.cancelRename = function () {
    if (typeof checkNameRegistration === 'function') {
        checkNameRegistration();
    }
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
    gs.dailyHistory = gs.dailyHistory.filter(h => {
        const v = (h.total_learned ?? h.wordsLearned);
        return v !== 451 && v !== 551;
    });
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
        alert(`テストデータ削除完了: ${beforeCount - afterCount}件 削除しました。`);
    } else {
        alert("削除対象データ(451, 551)は見つかりませんでした。");
    }
};
