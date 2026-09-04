// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBsS2T5UG2THIOC4zlm6dD9C1UjimFa6xI",
    authDomain: "tenioha-game.firebaseapp.com",
    projectId: "tenioha-game",
    storageBucket: "tenioha-game.firebasestorage.app",
    messagingSenderId: "183973262426",
    appId: "1:183973262426:web:eb54502c744666f07a9463",
    measurementId: "G-QHRLNKJ4CH"
};

const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);
if (isLocalDevelopment) {
    // GA also checks this global flag before sending collection requests.
    window[`ga-disable-${firebaseConfig.measurementId}`] = true;
}

// (Moved APP_VERSION to post-imports)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, deleteField, query, orderBy, limit, where, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithPopup, signInWithCredential, linkWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getAnalytics, setUserId } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// --- VERSION CONTROL ---
// const APP_VERSION = "v2.51"; // NOW USING GLOBAL GAME_VERSION
// Immediately set version strings (DOM is ready due to module defer/position)
const v1 = document.getElementById('helpVersionDisplay');
const v2 = document.getElementById('leaderboardVersionDisplay');
if (v1) v1.textContent = GAME_VERSION;
if (v2) v2.textContent = `現在のバージョン: ${GAME_VERSION}`;

// Global Firebase References
let db = null;
let userId = localStorage.getItem('vocabGame_userId');
let knownCloudSaveRevision = null;
let knownCloudSaveUserId = null;
let cloudSaveUploadPromise = null;
let autoSaveLifecycleListenersBound = false;
window.cloudSaveConflict = false;

// Generate User ID if missing
if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('vocabGame_userId', userId);
}

let auth = null;
let analytics = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    if (!isLocalDevelopment) {
        analytics = getAnalytics(app);
    }
    window.firestoreDb = db; // Expose DB
    window.firebaseAuth = auth; // Expose Auth
    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// --- EXPORTED FUNCTIONS ---

const REVIEW_FUNCTION_BASE = 'https://us-central1-tenioha-game.cloudfunctions.net';
const REVIEW_LEADERBOARD_CACHE_MS = 2 * 60 * 1000;
let reviewLeaderboardCache = { data: null, timestamp: 0 };
let reviewScoreSyncPromise = null;
let anonymousSignInPromise = null;

function isRegisteredFirebaseUser(user = auth?.currentUser) {
    return Boolean(user && !user.isAnonymous);
}

function guestRankingName(uid) {
    const suffix = String(uid || 'guest').slice(-4).padStart(4, '0');
    return `ゲスト${suffix}`;
}

window.isRegisteredFirebaseUser = isRegisteredFirebaseUser;
window.isAnonymousRankingUser = (user = auth?.currentUser) => Boolean(user?.isAnonymous);
window.getGuestRankingName = guestRankingName;

window.ensureRankingIdentity = async function () {
    if (!auth || auth.currentUser) return auth?.currentUser || null;
    if (isLocalDevelopment && new URLSearchParams(window.location.search).get('enableGuestAuth') !== '1') {
        return null;
    }
    if (anonymousSignInPromise) return anonymousSignInPromise;
    anonymousSignInPromise = signInAnonymously(auth)
        .then((credential) => credential.user)
        .catch((error) => {
            console.warn('Anonymous ranking sign-in failed:', error.message);
            return null;
        })
        .finally(() => {
            anonymousSignInPromise = null;
        });
    return anonymousSignInPromise;
};

async function postReviewFunction(functionName, payload, requireAuth = true) {
    const currentUser = auth && auth.currentUser;
    if (requireAuth && !currentUser) throw new Error('ログインが必要です。');
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser) headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;

    const response = await fetch(`${REVIEW_FUNCTION_BASE}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || `通信に失敗しました (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return data;
}

window.syncPendingReviewScores = function () {
    if (reviewScoreSyncPromise) return reviewScoreSyncPromise;
    if (!auth?.currentUser || typeof gameState === 'undefined') return Promise.resolve();
    const pending = gameState.reviewScore?.pendingEvents;
    if (!Array.isArray(pending) || pending.length === 0) return Promise.resolve();

    reviewScoreSyncPromise = (async () => {
        let changed = false;
        while (gameState.reviewScore.pendingEvents.length > 0) {
            const event = gameState.reviewScore.pendingEvents[0];
            try {
                const result = await postReviewFunction('submitReviewScore', {
                    ...event,
                    name: auth.currentUser.isAnonymous
                        ? guestRankingName(auth.currentUser.uid)
                        : localStorage.getItem('vocabGame_playerName') || auth.currentUser.displayName || '学習者',
                    avatarId: localStorage.getItem('vocabGame_reviewAvatarId') || 'hero'
                });
                gameState.reviewScore.pendingEvents.shift();
                if (window.applyServerReviewScore) {
                    window.applyServerReviewScore({
                        todayKey: result.todayKey,
                        todayPoints: result.todayPoints,
                        weekKey: result.weekKey,
                        weekPoints: result.weekPoints,
                        userId: auth.currentUser.uid
                    });
                }
                changed = true;
                reviewLeaderboardCache = { data: null, timestamp: 0 };
            } catch (error) {
                if (error.status >= 400 && error.status < 500 && error.status !== 401) {
                    console.warn('Discarding invalid review score event:', error.message);
                    gameState.reviewScore.pendingEvents.shift();
                    changed = true;
                    continue;
                }
                console.warn('Review score sync deferred:', error.message);
                break;
            }
        }
        if (changed && typeof saveGame === 'function') saveGame();
    })().finally(() => {
        reviewScoreSyncPromise = null;
    });

    return reviewScoreSyncPromise;
};

window.fetchReviewLeaderboard = async function (force = false) {
    if (auth?.currentUser && gameState.reviewScore?.pendingEvents?.length) {
        await window.syncPendingReviewScores();
    }
    const now = Date.now();
    if (!force && reviewLeaderboardCache.data && now - reviewLeaderboardCache.timestamp < REVIEW_LEADERBOARD_CACHE_MS) {
        return reviewLeaderboardCache.data;
    }

    try {
        const data = await postReviewFunction('getReviewLeaderboard', {}, false);
        if (auth?.currentUser && !data.error && window.applyServerReviewScore) {
            window.applyServerReviewScore({
                todayKey: data.todayKey,
                todayPoints: data.todayPoints,
                weekKey: data.weekKey,
                weekPoints: data.me?.score ?? 0,
                userId: auth.currentUser.uid
            });
        }
        reviewLeaderboardCache = { data, timestamp: now };
        return data;
    } catch (error) {
        return { error: error.message, results: [] };
    }
};

window.updateReviewRankingProfile = async function (name, avatarId) {
    try {
        const result = await postReviewFunction('updateReviewProfile', { name, avatarId });
        reviewLeaderboardCache = { data: null, timestamp: 0 };
        return result;
    } catch (error) {
        console.warn('Review ranking profile sync failed:', error.message);
        return { error: error.message };
    }
};

// 3. Auth Functions & Profile Logic

// Profile Helpers
// Profile Helpers (UI handled by ui_manager.js)
// Keeping updatePremiumStatusDisplay as it logic-heavy
// But toggle/open/close are now in ui_manager.js


// --- PURCHASE MODAL LOGIC ---
// --- PURCHASE MODAL UI (Moved to ui_manager.js) ---
// window.openPurchaseModal ...
// window.closePurchaseModal ...


// v2.58: Centralized Premium Check
// v2.58: Centralized Premium Check
window.checkPremiumStatus = function () {
    return window.GameUtils.checkPremiumStatus();
};

window.updatePremiumStatusDisplay = function () {
    const effectivePremium = window.checkPremiumStatus();
    const expiryTime = parseInt(localStorage.getItem('vocabGame_expiry') || '0');

    // Auto-Lock if expired (Sync local state)
    // Even if checkPremiumStatus returns false, we might need to update 'isUnlocked' 
    // to false if it WAS true but is now expired.
    // checkPremiumStatus protects against False Positives, but doesn't write.
    // Let's write lock here if mismatched.
    const isUnlockedStored = localStorage.getItem('vocabGame_isUnlocked') === 'true';
    if (isUnlockedStored && !effectivePremium) {
        localStorage.setItem('vocabGame_isUnlocked', 'false');
    }

    // Trial State Sync
    if (typeof trialState !== 'undefined' && trialState.unlocked && !effectivePremium) {
        trialState.unlocked = false;
        if (typeof saveTrialState === 'function') saveTrialState();
        if (typeof updateTrialUI === 'function') updateTrialUI();
    }

    const tag = document.getElementById('planStatusTag');
    const activationSection = document.getElementById('premiumActivationSection');

    if (tag) {
        if (effectivePremium) {
            const expiryDate = new Date(expiryTime);
            const isPermanent = expiryDate.getFullYear() > 3000;
            const dateStr = (expiryTime > 0 && !isPermanent) ? expiryDate.toLocaleDateString() : "無期限";
            tag.textContent = `プレミアム (期限: ${dateStr})`;
            tag.style.background = "#2ecc71"; // Green
            if (activationSection) activationSection.style.display = 'block'; // Allow extending
        } else {
            const now = Date.now();
            const wasExpired = (expiryTime > 0 && now > expiryTime);
            tag.textContent = wasExpired ? "期限切れ (再有効化が必要)" : "無料プラン (制限あり)";
            tag.style.background = "#95a5a6"; // Gray
            if (activationSection) activationSection.style.display = 'block'; // Show input
        }
    }
}

window.handleProfileAuth = function () {
    if (isRegisteredFirebaseUser()) {
        if (confirm("ログアウトしますか？")) { logoutGoogle(); }
    } else {
        loginWithGoogle();
    }
};

// --- PREMIUM SYSTEM ---
const PROMO_REDEEM_ENDPOINT = "https://us-central1-tenioha-game.cloudfunctions.net/redeemTeniohaPromoCode";

window.redeemPromoCode = async function (inputId = 'promoCodeInput') {
    const input = document.getElementById(inputId);
    if (!input) return;
    const code = input.value.trim();

    if (!code) { alert("コードを入力してください"); return; }
    if (!isRegisteredFirebaseUser()) { alert("コードを適用するにはGoogleログインが必要です"); return; }

    try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(PROMO_REDEEM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || 'コードの適用に失敗しました。');
        }

        const { newExpiryTime, durationDays } = result;
        const newExpiryDate = new Date(newExpiryTime);
        localStorage.setItem('vocabGame_isUnlocked', 'true');
        localStorage.setItem('vocabGame_expiry', String(newExpiryTime));
        updatePremiumStatusDisplay();

        if (typeof trialState !== 'undefined') {
            trialState.unlocked = true;
            if (typeof saveTrialState === 'function') saveTrialState();
            if (typeof updateTrialUI === 'function') updateTrialUI();
            const overlay = document.getElementById('trialOverlay');
            if (overlay) overlay.style.display = 'none';
        }

        alert(`プレミアム機能が有効化されました！\n有効期限: ${newExpiryDate.toLocaleDateString()} まで\n日数: +${durationDays}日`);
        input.value = "";
    } catch (e) {
        console.error(e);
        alert(e.message || "コードの適用に失敗しました。");
    }
};

// Bridge function for Lock Screen
window.unlockGame = function () {
    // Use the new Cloud Validation logic
    redeemPromoCode('unlockPassword');
};

async function mergeGuestRankingIntoCurrentUser(guestIdToken) {
    if (!guestIdToken || !isRegisteredFirebaseUser()) return null;
    const result = await postReviewFunction('mergeGuestReviewScore', {
        guestIdToken,
        name: auth.currentUser.displayName || '学習者',
        avatarId: localStorage.getItem('vocabGame_reviewAvatarId') || 'hero'
    });
    reviewLeaderboardCache = { data: null, timestamp: 0 };
    if (window.applyServerReviewScore) {
        window.applyServerReviewScore({
            todayKey: result.todayKey,
            todayPoints: result.todayPoints,
            weekKey: result.weekKey,
            weekPoints: result.weekPoints,
            userId: auth.currentUser.uid
        });
    }
    return result;
}

window.loginWithGoogle = async function () {
    if (!auth) {
        alert("Firebase Authが初期化されていません。\nページをリロードしてみてください。");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const guestUser = auth.currentUser?.isAnonymous ? auth.currentUser : null;
        if (!guestUser) {
            await signInWithPopup(auth, provider);
            return;
        }

        if (window.syncPendingReviewScores) await window.syncPendingReviewScores();
        if (gameState.reviewScore?.pendingEvents?.length) {
            alert("未送信の復習ポイントがあります。\n通信状態を確認してから、もう一度Google連携をお試しください。");
            return;
        }
        const guestIdToken = await guestUser.getIdToken();
        try {
            await linkWithPopup(guestUser, provider);
            alert("Googleアカウントと連携しました。\n順位とポイントはそのまま引き継がれます。");
            location.reload();
            return;
        } catch (linkError) {
            const credential = GoogleAuthProvider.credentialFromError(linkError);
            if (!['auth/credential-already-in-use', 'auth/email-already-in-use'].includes(linkError.code) || !credential) {
                throw linkError;
            }
            await signInWithCredential(auth, credential);
            try {
                await mergeGuestRankingIntoCurrentUser(guestIdToken);
                alert("Googleアカウントへログインし、ゲスト順位を引き継ぎました。");
            } catch (mergeError) {
                console.error('Guest ranking merge failed after Google sign-in:', mergeError);
                alert("Googleログインは完了しましたが、ゲスト順位の引き継ぎに失敗しました。\n時間をおいて再度お試しください。");
            }
            location.reload();
            return;
        }
    } catch (error) {
        console.error("Login Failed:", error);

        let msg = "ログインに失敗しました。";
        if (error.code === 'auth/popup-blocked') msg += "\nポップアップがブロックされました。設定を確認してください。";
        if (error.code === 'auth/cancelled-popup-request') msg += "\nポップアップが閉じられました。";
        if (error.code === 'auth/popup-closed-by-user') msg += "\nポップアップが閉じられました。";
        if (error.code === 'auth/unauthorized-domain') msg += "\n許可されていないドメインです。\nFirebase Consoleでドメインを追加してください。";
        if (error.code === 'auth/operation-not-allowed') msg += "\nGoogleログインが無効です。\nFirebase Consoleで有効にしてください。";

        alert(`${msg}\n\n(Error Code: ${error.code})\n${error.message}`);
    }
};

window.logoutGoogle = async function () {
    if (!auth || !isRegisteredFirebaseUser()) return;
    try {
        await signOut(auth);
        alert("ログアウトしました");
        if (window.resetGameData) window.resetGameData(); // Clear Local Data
        location.reload();
    } catch (error) {
        console.error(error);
    }
};

// --- AUTO REDEEM LOGIC ---
async function checkAutoRedeem(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const shouldAutoRedeem = urlParams.get('auto_redeem');

    if (code && shouldAutoRedeem === 'true') {
        console.log("Auto-redeeming code:", code);

        // Open Profile Modal to show context
        if (typeof openProfileModal === 'function') openProfileModal();

        // Wait a bit for UI to settle (Modal opens, DOM elements rendering)
        setTimeout(async () => {
            const input = document.getElementById('profilePromoCodeInput');
            if (input) {
                input.value = code;

                if (isRegisteredFirebaseUser(user)) {
                    // Logged in: Auto execute
                    if (window.redeemPromoCode) {
                        await window.redeemPromoCode('profilePromoCodeInput');
                        // Remove query params on success
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                    }
                } else {
                    // Not Logged in: Just fill and prompt
                    alert("コードが入力されました。\n適用するにはGoogleログインが必要です。");
                }
            }
        }, 1000);
    }
}

// Auth State Listener
if (auth) {
    onAuthStateChanged(auth, async (user) => {
        // Call Auto Redeem logic (Always check, even if guest)
        checkAutoRedeem(user);
        // setupUIElements(); // Handled by init() in game_logic.js
        const headerIcon = document.getElementById('headerProfileIcon');
        const headerInitials = document.getElementById('headerProfileInitials');
        const headerImage = document.getElementById('headerProfileImage');

        const modalImage = document.getElementById('modalProfileImage');
        const modalInitials = document.getElementById('modalProfileInitials');
        const modalName = document.getElementById('modalUserName');
        const modalEmail = document.getElementById('modalUserEmail');
        const authBtn = document.getElementById('profileAuthBtn');
        const syncSection = document.getElementById('profileSyncSection');
        const lastSync = document.getElementById('profileLastSync');

        if (user) {
            const registeredUser = isRegisteredFirebaseUser(user);
            let cloudSyncReadyForAutoSave = !registeredUser;
            console.log(registeredUser ? "Auth: Google user" : "Auth: Anonymous ranking user", user.uid);

            // GA4: Set User ID for cross-device tracking
            if (analytics) {
                setUserId(analytics, registeredUser ? user.uid : null);
            }

            userId = user.uid; // Switch to Auth ID
            localStorage.setItem('vocabGame_userId', userId);

            if (registeredUser) {
                if (headerImage && user.photoURL) { headerImage.src = user.photoURL; headerImage.style.display = 'block'; }
                if (headerInitials) headerInitials.style.display = user.photoURL ? 'none' : 'block';
                if (headerIcon) headerIcon.style.border = "2px solid #2ecc71";
                if (modalImage && user.photoURL) { modalImage.src = user.photoURL; modalImage.style.display = 'block'; }
                if (modalInitials) modalInitials.style.display = user.photoURL ? 'none' : 'block';
                if (modalName) modalName.textContent = user.displayName || "Googleユーザー";
                if (modalEmail) modalEmail.textContent = user.email || "Google連携済み";
                if (authBtn) {
                    authBtn.innerHTML = `<span>ログアウト</span>`;
                    authBtn.classList.add('profile-auth-logout');
                    authBtn.style.background = "";
                }
                if (syncSection) syncSection.style.display = 'block';
            } else {
                const guestName = window.ensureGuestPlayerName
                    ? window.ensureGuestPlayerName(user.uid)
                    : guestRankingName(user.uid);
                knownCloudSaveRevision = null;
                knownCloudSaveUserId = null;
                window.cloudSaveConflict = false;
                if (headerImage) headerImage.style.display = 'none';
                if (headerInitials) { headerInitials.textContent = 'G'; headerInitials.style.display = 'block'; }
                if (headerIcon) headerIcon.style.border = "2px solid white";
                if (modalImage) modalImage.style.display = 'none';
                if (modalInitials) { modalInitials.textContent = 'G'; modalInitials.style.display = 'block'; }
                if (modalName) modalName.textContent = guestName;
                if (modalEmail) modalEmail.textContent = "ランキング参加中・未登録";
                if (authBtn) {
                    authBtn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18"> <span>Googleで順位を保存</span>`;
                    authBtn.classList.remove('profile-auth-logout');
                    authBtn.style.background = "";
                }
                if (syncSection) syncSection.style.display = 'none';
            }

            if (registeredUser) {
                try {
                if (!window.GameConfig) console.error("CRITICAL: GameConfig missing!");

                const authSyncUserId = user.uid;
                const userDoc = await getDoc(doc(db, "users", authSyncUserId));
                if (!auth.currentUser || auth.currentUser.uid !== authSyncUserId) return;
                setKnownCloudSaveRevision(authSyncUserId, userDoc.exists() ? userDoc.data() : null);
                window.cloudSaveConflict = false;

                // 1. Premium Status Sync (Subscription Model)
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    let cloudExpiresAt = 0;

                    if (data.reviewRankingName) {
                        localStorage.setItem('vocabGame_playerName', data.reviewRankingName);
                        playerName = data.reviewRankingName;
                    } else if (!localStorage.getItem('vocabGame_playerName') && user.displayName) {
                        const defaultName = user.displayName.slice(0, 8);
                        localStorage.setItem('vocabGame_playerName', defaultName);
                        playerName = defaultName;
                    }
                    if (data.reviewAvatarId) {
                        localStorage.setItem('vocabGame_reviewAvatarId', data.reviewAvatarId);
                    }

                    // Check Expiration
                    if (data.premiumExpiresAt) {
                        cloudExpiresAt = data.premiumExpiresAt.toMillis();
                    } else if (data.isPremium === true) {
                        // Legacy Cloud Users: Permanent
                        cloudExpiresAt = 253402300799000;
                    } else {
                        // No Cloud Premium Data
                        // LOGIC REMOVED: Do not migrate local trial status to infinite cloud premium.
                        // Local 'isUnlocked' is treated as temporary/invalid if not backed by cloud.
                    }

                    localStorage.setItem('vocabGame_expiry', cloudExpiresAt);

                    const now = Date.now();
                    const isValid = cloudExpiresAt > now;

                    if (isValid) {
                        localStorage.setItem('vocabGame_isUnlocked', 'true');
                    } else {
                        localStorage.setItem('vocabGame_isUnlocked', 'false');
                    }
                    updatePremiumStatusDisplay();

                    // BUGFIX: Immediately update in-memory trial state and hide overlay
                    if (isValid) {
                        if (typeof trialState !== 'undefined') {
                            trialState.unlocked = true;
                            saveTrialState(); // Persist simple unlocked state
                            updateTrialUI();
                        }
                        const overlay = document.getElementById('trialOverlay');
                        if (overlay) overlay.style.display = 'none';
                    }
                }

                // 2. Data Sync
                if (userDoc.exists() && hasCloudSaveData(userDoc.data())) {
                    const cloudRaw = await fetchCloudSaveData(doc(db, "users", userId), userDoc.data());
                    if (!cloudRaw) throw new Error('Cloud saveData missing');
                    const cloudData = JSON.parse(cloudRaw);
                    const cloudTime = cloudData.lastSaveTime || 0;

                    if (lastSync) lastSync.textContent = new Date(cloudTime).toLocaleString();

                    const localStr = localStorage.getItem('vocabClickerSave');
                    const localData = localStr ? JSON.parse(localStr) : null;
                    const localTime = localData ? (localData.lastSaveTime || 0) : 0;
                    const syncDecision = window.GameUtils.getLoginCloudSyncDecision({
                        hadExistingSaveAtBoot: window.__hadExistingVocabSaveAtBoot === true,
                        localData,
                        cloudData
                    });

                    console.log(`Sync Check: ${syncDecision} Cloud(${new Date(cloudTime).toLocaleString()}) vs Local(${new Date(localTime).toLocaleString()})`);

                    if (syncDecision === 'restore-clean-device') {
                        localStorage.setItem('vocabClickerSave', cloudRaw);
                        window.isDirty = false;
                        console.log('Cloud data restored automatically on a clean device.');
                        alert("Googleアカウントの学習データを復元しました。\nリロードします。");
                        location.reload();
                        return;
                    } else if (syncDecision === 'prompt-restore-cloud') {
                        const msg = `クラウドにこの端末より新しい学習データがあります。\n(クラウド: ${new Date(cloudTime).toLocaleString()})\n(この端末: ${localTime ? new Date(localTime).toLocaleString() : '保存なし'})\n\n復元しますか？`;
                        if (confirm(msg)) {
                            localStorage.setItem('vocabClickerSave', cloudRaw);
                            window.isDirty = false;
                            alert("復元しました。リロードします。");
                            location.reload();
                            return;
                        } else {
                            window.isDirty = true;
                        }
                    } else if (syncDecision === 'keep-local') {
                        window.isDirty = true;
                    }
                } else {
                    console.log("No cloud data. Uploading local data...");
                    uploadSaveData(true);
                }
                cloudSyncReadyForAutoSave = true;
                } catch (e) {
                    markCloudSaveConflict();
                    console.error("Sync Check Failed; automatic cloud save is paused:", e);
                }
            }

            if (window.syncPendingReviewScores) await window.syncPendingReviewScores();
            if (window.fetchReviewLeaderboard) {
                const data = await window.fetchReviewLeaderboard(true);
                if (data?.me?.rank) {
                    window.latestReviewRank = data.me.rank;
                    if (window.updateReviewScoreSummary) window.updateReviewScoreSummary();
                }
            }

            // Never upload local data after a failed initial cloud read.
            if (cloudSyncReadyForAutoSave) {
                startAutoSaveLoop();
            }

        } else {
            // --- LOGGED OUT ---
            console.log("Auth: Signed out");
            knownCloudSaveRevision = null;
            knownCloudSaveUserId = null;
            cloudSaveUploadPromise = null;
            window.cloudSaveConflict = false;

            // GA4: Clear User ID
            if (analytics) {
                setUserId(analytics, null);
            }

            // Reset Header
            if (headerImage) headerImage.style.display = 'none';
            if (headerInitials) headerInitials.style.display = 'block';
            if (headerIcon) headerIcon.style.border = "2px solid white";

            // Reset Modal
            if (modalImage) modalImage.style.display = 'none';
            if (modalInitials) modalInitials.style.display = 'block';
            if (modalName) modalName.textContent = "ゲストユーザー";
            if (modalEmail) modalEmail.textContent = "未ログイン";

            if (authBtn) {
                authBtn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18"> <span>Googleでログイン</span>`;
                authBtn.classList.remove('profile-auth-logout');
                authBtn.style.background = "";
            }
            if (syncSection) syncSection.style.display = 'none';

            // Stop Auto-Save
            if (window.autoSaveInterval) clearInterval(window.autoSaveInterval);
            await window.ensureRankingIdentity();
        }
    });
}


// --- VERSION ENFORCER (Kill Switch) ---
function parseVersionParts(v) {
    // Supports: v2.80, 2.80, v2.80.1 (non-numeric suffixes are ignored)
    const clean = String(v || '').trim().replace(/^v/i, '');
    const parts = clean.split('.').map(p => {
        const n = parseInt(p, 10);
        return Number.isFinite(n) ? n : 0;
    });
    return parts;
}

function isVersionLess(current, required) {
    const a = parseVersionParts(current);
    const b = parseVersionParts(required);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const av = a[i] || 0;
        const bv = b[i] || 0;
        if (av < bv) return true;
        if (av > bv) return false;
    }
    return false; // equal
}

window.checkForceUpdate = async function () {
    if (!db) return;
    try {
        const configDoc = await getDoc(doc(db, "config", "app_settings"));
        if (configDoc.exists()) {
            const minVer = configDoc.data().min_required_version ? configDoc.data().min_required_version.trim() : null;
            if (minVer) {
                const appVer = (window.GAME_VERSION || "v2.60").trim();
                if (isVersionLess(appVer, minVer)) {
                    console.error(`Version Mismatch: Current ${appVer} < Required ${minVer}`);
                    document.getElementById('forceUpdateModal').style.display = 'flex';
                    // Stop Auto Save to prevent corrupting data with old logic
                    if (window.autoSaveInterval) clearInterval(window.autoSaveInterval);
                    return false; // Result Blocked
                }
            }
        }
    } catch (e) {
        console.error("Version Check Failed:", e);
        // Safe Fail: If we can't check, we let them play (don't break on offline)
    }
    return true; // Result Passed
};


// --- AUTO SAVE LOOP (Optimized) ---
function startAutoSaveLoop() {
    // Run Version Check on Loop Start
    checkForceUpdate();

    if (window.autoSaveInterval) clearInterval(window.autoSaveInterval);
    console.log("AutoManager: Auto-Save started (60s interval - Dirty Check Only)");

    // 1. Periodic Check (every 60s)
    window.autoSaveInterval = setInterval(() => {
        if (auth?.currentUser && gameState.reviewScore?.pendingEvents?.length) {
            window.syncPendingReviewScores();
        }
        if (isRegisteredFirebaseUser() && window.isDirty) {
            console.log("AutoManager: Dirty flag true. Sending background save...");
            uploadSaveData(true); // Silent
        }
    }, 60000);

    if (autoSaveLifecycleListenersBound) return;
    autoSaveLifecycleListenersBound = true;

    // 2. Save on Exit / Background (visibilitychange)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            if (auth?.currentUser && gameState.reviewScore?.pendingEvents?.length) {
                window.syncPendingReviewScores();
            }
            if (isRegisteredFirebaseUser() && window.isDirty) {
                console.log("AutoManager: App hidden. Saving immediately...");
                // Use beacon-like behavior if possible, but fetch usually works in visibilitychange
                uploadSaveData(true);
            }
        }
    });

    // 3. Fallback for Tab Close (pagehide)
    window.addEventListener('pagehide', () => {
        if (auth?.currentUser && gameState.reviewScore?.pendingEvents?.length) {
            window.syncPendingReviewScores();
        }
        if (isRegisteredFirebaseUser() && window.isDirty) {
            // Try to push. Note: Async requests might be killed.
            // Ideally we use navigator.sendBeacon but Firestore SDK handles logic.
            // We just call it and hope for best effort.
            uploadSaveData(true);
        }
    });

    window.addEventListener('online', () => {
        if (auth?.currentUser && gameState.reviewScore?.pendingEvents?.length) {
            window.syncPendingReviewScores();
        }
    });
}

// Modified Upload/Restore for Auth
window.forceBackup = async function () {
    // Force save (not silent)
    await uploadSaveData(false, true);
};

window.forceRestore = async function () {
    if (!db || !isRegisteredFirebaseUser()) {
        alert("クラウド復元にはGoogleログインが必要です。");
        return;
    }
    // First check if local is un-synced
    // But restore implies "I want Cloud Data".

    try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || !hasCloudSaveData(userDoc.data())) { alert("クラウドにデータがありません"); return; }

        const cloudRaw = await fetchCloudSaveData(userDocRef, userDoc.data());
        if (!cloudRaw) { alert("クラウドデータの読み込みに失敗しました"); return; }
        const cloudData = JSON.parse(cloudRaw);
        const localRaw = localStorage.getItem('vocabClickerSave');
        const localData = localRaw ? JSON.parse(localRaw) : null;
        const localTime = localData?.lastSaveTime || 0;
        const cloudTime = cloudData.lastSaveTime || 0;

        let msg = "クラウド上のデータで上書きしますか？\n今の端末の未保存データは消えます。";

        if (localTime > cloudTime) {
            msg = `⚠️ この端末の学習データの方が新しいです。\n(この端末: ${new Date(localTime).toLocaleString()})\n(クラウド: ${cloudTime ? new Date(cloudTime).toLocaleString() : '保存なし'})\n\n古いクラウドデータで上書きしますか？`;
        } else if (cloudTime > localTime) {
            msg = `クラウドに新しい学習データがあります。\n(クラウド: ${new Date(cloudTime).toLocaleString()})\n(この端末: ${localTime ? new Date(localTime).toLocaleString() : '保存なし'})\n\n復元しますか？`;
        }

        if (!confirm(msg)) return;

        // Restore Logic
        setKnownCloudSaveRevision(auth.currentUser.uid, userDoc.data());
        window.cloudSaveConflict = false;
        localStorage.setItem('vocabClickerSave', cloudRaw);
        alert("復元しました。リロードします。");
        location.reload();
    } catch (e) { alert("エラー: " + e.message); }
};

// --- Large cloud save helpers (avoid Firestore 1MiB doc limit) ---
const CLOUD_SAVE_DOC_LIMIT_BYTES = 1040000;
const CLOUD_SAVE_CHUNK_BYTES = 350000; // safe margin for doc overhead
const CLOUD_SAVE_STALE_CHUNK_AGE_MS = 24 * 60 * 60 * 1000;
const CLOUD_SAVE_CLEANUP_BATCH_SIZE = 50;
const CLOUD_SAVE_CLEANUP_MAX_BATCHES = 5;

class CloudSaveConflictError extends Error {
    constructor(currentRevision) {
        super('別の端末でクラウドデータが更新されています。');
        this.name = 'CloudSaveConflictError';
        this.code = 'cloud-save-conflict';
        this.currentRevision = currentRevision;
    }
}

function getSaveRevision(userData) {
    const revision = Number(userData && userData.saveRevision);
    return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

function setKnownCloudSaveRevision(uid, userDataOrRevision) {
    knownCloudSaveUserId = uid;
    knownCloudSaveRevision = typeof userDataOrRevision === 'number'
        ? userDataOrRevision
        : getSaveRevision(userDataOrRevision);
}

function getKnownCloudSaveRevision(uid) {
    return knownCloudSaveUserId === uid ? knownCloudSaveRevision : null;
}

function makeSaveChunkPrefix() {
    const randomPart = globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    return `${Date.now()}_${randomPart}`;
}

function markCloudSaveConflict() {
    window.cloudSaveConflict = true;
    window.isDirty = true;
    const lastSync = document.getElementById('profileLastSync');
    if (lastSync) lastSync.textContent = '別端末の更新を検出';
}

function getByteSize(str) {
    return new Blob([str]).size;
}

function splitStringByBytes(str, maxBytes) {
    const chunks = [];
    let i = 0;
    while (i < str.length) {
        let lo = i + 1;
        let hi = str.length;
        let best = lo;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const part = str.slice(i, mid);
            if (getByteSize(part) <= maxBytes) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        if (best <= i) throw new Error('Failed to split saveData safely by bytes');
        chunks.push(str.slice(i, best));
        i = best;
    }
    return chunks;
}

// A段階: 機能を削らずにクラウド送信データだけ軽量化
function buildCloudSaveData(rawSaveData) {
    try {
        const data = JSON.parse(rawSaveData);

        // Remove the retired learning-log history from legacy local saves.
        delete data.dailyHistory;

        // 未学習は初期値として復元時に補完できるため、クラウド保存から除外
        if (data.wordStates && typeof data.wordStates === 'object') {
            const compactWordStates = {};
            for (const [key, state] of Object.entries(data.wordStates)) {
                if (state && state !== 'unlearned') compactWordStates[key] = state;
            }
            data.wordStates = compactWordStates;
        }

        // SRSのデフォルト値を省略してサイズ削減
        if (data.srsData && typeof data.srsData === 'object') {
            const compactSrs = {};
            for (const [key, s] of Object.entries(data.srsData)) {
                if (!s || typeof s !== 'object') continue;
                const hasReviewHistory = (s.successCount || 0) > 0 || (s.failCount || 0) > 0 || s.everWrong === true || s.firstTryPerfect === true || !!s.lastReviewScoreDate;
                if (!hasReviewHistory) continue;
                const c = {};
                if (typeof s.dueAt === 'number') c.dueAt = s.dueAt;
                if (typeof s.successCount === 'number') c.successCount = s.successCount;
                if (typeof s.failCount === 'number') c.failCount = s.failCount;
                if (typeof s.reviewStep === 'number' && s.reviewStep !== 0) c.reviewStep = s.reviewStep;
                if (typeof s.scheduledIntervalDays === 'number' && s.scheduledIntervalDays > 0) c.scheduledIntervalDays = s.scheduledIntervalDays;
                if (typeof s.lastReviewedAt === 'number' && s.lastReviewedAt !== 0) c.lastReviewedAt = s.lastReviewedAt;
                if (typeof s.lastReviewScoreDate === 'string' && s.lastReviewScoreDate) c.lastReviewScoreDate = s.lastReviewScoreDate;
                if (s.isRelearning === true) c.isRelearning = true;
                if (typeof s.stability === 'number' && s.stability !== 1) c.stability = s.stability;
                if (typeof s.streak === 'number' && s.streak !== 0) c.streak = s.streak;
                if (s.everWrong === true) c.everWrong = true;
                if (s.firstTryPerfect === true) c.firstTryPerfect = true;
                compactSrs[key] = c;
            }
            data.srsData = compactSrs;
        }

        data.cloudCompactVersion = 2;
        return JSON.stringify(data);
    } catch (e) {
        console.warn('buildCloudSaveData failed, fallback to raw', e);
        return rawSaveData;
    }
}

function hasCloudSaveData(userData) {
    if (!userData) return false;
    return !!(userData.saveData || (userData.saveStorage === 'chunked' && userData.saveChunkCount > 0));
}

async function fetchCloudSaveData(userDocRef, userData) {
    if (!userData) return null;
    if (userData.saveStorage === 'chunked' && userData.saveChunkCount > 0) {
        const chunks = [];
        const prefix = userData.saveChunkPrefix;
        const count = userData.saveChunkCount;
        for (let i = 0; i < count; i++) {
            const chunkRef = doc(db, 'users', userDocRef.id, 'save_chunks', `${prefix}_${i}`);
            const snap = await getDoc(chunkRef);
            if (!snap.exists()) throw new Error(`Cloud chunk missing: ${i + 1}/${count}`);
            chunks.push(snap.data().data || '');
        }
        return chunks.join('');
    }
    return userData.saveData || null;
}

async function deleteSaveChunkGeneration(userDocRef, prefix, count) {
    if (!prefix || !Number.isSafeInteger(count) || count <= 0) return;
    const deletions = [];
    for (let i = 0; i < count; i++) {
        deletions.push(deleteDoc(doc(db, 'users', userDocRef.id, 'save_chunks', `${prefix}_${i}`)));
    }
    await Promise.allSettled(deletions);
}

async function maybeCleanupStaleSaveChunks(userDocRef, activePrefix = null) {
    const cleanupKey = `vocabGame_chunkCleanup_${userDocRef.id}`;
    const lastCleanup = Number(localStorage.getItem(cleanupKey) || 0);
    if (Date.now() - lastCleanup < CLOUD_SAVE_STALE_CHUNK_AGE_MS) return;
    localStorage.setItem(cleanupKey, String(Date.now()));

    try {
        const chunksRef = collection(db, 'users', userDocRef.id, 'save_chunks');
        const cutoff = new Date(Date.now() - CLOUD_SAVE_STALE_CHUNK_AGE_MS);
        let totalDeleted = 0;

        for (let batch = 0; batch < CLOUD_SAVE_CLEANUP_MAX_BATCHES; batch++) {
            const staleQuery = query(
                chunksRef,
                where('updatedAt', '<', cutoff),
                orderBy('updatedAt'),
                limit(CLOUD_SAVE_CLEANUP_BATCH_SIZE)
            );
            const snapshot = await getDocs(staleQuery);
            if (snapshot.empty) break;

            const deletions = [];
            snapshot.forEach(chunkDoc => {
                if (!activePrefix || !chunkDoc.id.startsWith(`${activePrefix}_`)) {
                    deletions.push(deleteDoc(chunkDoc.ref));
                }
            });
            if (deletions.length === 0) break;

            await Promise.allSettled(deletions);
            totalDeleted += deletions.length;
            if (snapshot.size < CLOUD_SAVE_CLEANUP_BATCH_SIZE) break;
        }

        if (totalDeleted > 0) {
            console.log(`Cloud save cleanup: deleted ${totalDeleted} stale chunks`);
        }
    } catch (e) {
        localStorage.removeItem(cleanupKey);
        console.warn('Cloud save stale chunk cleanup failed; active save remains valid', e);
    }
}

async function commitCloudSave(userDocRef, saveFields, expectedRevision) {
    return runTransaction(db, async transaction => {
        const currentSnap = await transaction.get(userDocRef);
        const currentData = currentSnap.exists() ? currentSnap.data() : {};
        const currentRevision = getSaveRevision(currentData);

        if (expectedRevision === null || currentRevision !== expectedRevision) {
            throw new CloudSaveConflictError(currentRevision);
        }

        const nextRevision = currentRevision + 1;
        transaction.set(userDocRef, {
            ...saveFields,
            saveRevision: nextRevision,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return {
            revision: nextRevision,
            previousStorage: currentData.saveStorage || null,
            previousChunkPrefix: currentData.saveChunkPrefix || null,
            previousChunkCount: Number(currentData.saveChunkCount) || 0
        };
    });
}

async function writeChunkedSaveData(userDocRef, rawSaveData, pwaVer, expectedRevision, userProfile) {
    const chunks = splitStringByBytes(rawSaveData, CLOUD_SAVE_CHUNK_BYTES);
    const prefix = makeSaveChunkPrefix();

    let commitResult;
    try {
        for (let i = 0; i < chunks.length; i++) {
            const chunkRef = doc(db, 'users', userDocRef.id, 'save_chunks', `${prefix}_${i}`);
            await setDoc(chunkRef, {
                idx: i,
                data: chunks[i],
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        commitResult = await commitCloudSave(userDocRef, {
            saveData: deleteField(),
            saveStorage: 'chunked',
            saveChunkPrefix: prefix,
            saveChunkCount: chunks.length,
            name: userProfile.displayName,
            email: userProfile.email,
            appVersion: pwaVer,
            cloudSaveTooLarge: false
        }, expectedRevision);
    } catch (e) {
        await deleteSaveChunkGeneration(userDocRef, prefix, chunks.length);
        throw e;
    }

    if (commitResult.previousStorage === 'chunked') {
        await deleteSaveChunkGeneration(
            userDocRef,
            commitResult.previousChunkPrefix,
            commitResult.previousChunkCount
        );
    }
    commitResult.activeChunkPrefix = prefix;
    return commitResult;
}

async function performCloudSave(silent = false, force = false) {
    if (!db) return;
    if (!isRegisteredFirebaseUser()) {
        if (!silent) alert("クラウド保存にはGoogleログインが必要です。");
        return;
    }

    // Dirty Check
    if (!force && !window.isDirty) {
        console.log("Skipping upload: No changes (isDirty=false)");
        return;
    }
    if (silent && window.cloudSaveConflict) {
        console.warn('Skipping automatic upload until cloud conflict is resolved manually.');
        return;
    }

    const rawSaveData = localStorage.getItem('vocabClickerSave');
    if (!rawSaveData) return;

    const saveData = buildCloudSaveData(rawSaveData);
    const saveBytes = getByteSize(saveData);
    let saveUserId = null;

    try {
        const currentUser = auth.currentUser;
        const uid = currentUser.uid;
        saveUserId = uid;
        const userDocRef = doc(db, "users", uid);
        let expectedRevision = getKnownCloudSaveRevision(uid);

        if (!silent) {
            const existingSnap = await getDoc(userDocRef);
            const existingData = existingSnap.exists() ? existingSnap.data() : null;
            const currentRevision = getSaveRevision(existingData);
            const revisionChanged = expectedRevision === null || currentRevision !== expectedRevision;
            const warnings = [];

            if (revisionChanged && (hasCloudSaveData(existingData) || currentRevision > 0)) {
                warnings.push('別の端末でクラウドデータが更新されています。');
            }

            if (existingData && hasCloudSaveData(existingData)) {
                const cloudRaw = await fetchCloudSaveData(userDocRef, existingData);
                if (cloudRaw) {
                    const cloudExisting = JSON.parse(cloudRaw);
                    const localDataObj = JSON.parse(saveData);

                    const cloudTime = cloudExisting.lastSaveTime || 0;
                    const localTime = localDataObj.lastSaveTime || 0;
                    if (cloudTime > localTime) {
                        warnings.push(`クラウドの学習データの方が新しいです。\n(クラウド: ${new Date(cloudTime).toLocaleString()})\n(この端末: ${localTime ? new Date(localTime).toLocaleString() : '保存なし'})`);
                    }
                }
            }

            if (warnings.length > 0 && !confirm(`⚠️ 警告\n${warnings.join('\n\n')}\n\n現在の端末のデータで上書きしますか？`)) {
                console.log("Upload aborted by user.");
                markCloudSaveConflict();
                return;
            }

            expectedRevision = currentRevision;
        } else if (expectedRevision === null) {
            // Authentication normally establishes this baseline. Never guess when it is missing.
            throw new CloudSaveConflictError(null);
        }

        const verElem = document.getElementById('helpVersionDisplay');
        const pwaVer = verElem ? verElem.textContent : 'unknown';
        let commitResult;

        if (saveBytes > CLOUD_SAVE_DOC_LIMIT_BYTES) {
            commitResult = await writeChunkedSaveData(
                userDocRef,
                saveData,
                pwaVer,
                expectedRevision,
                { displayName: currentUser.displayName, email: currentUser.email }
            );
            console.log(`Upload success (chunked): ${saveBytes} bytes`);
        } else {
            commitResult = await commitCloudSave(userDocRef, {
                saveData: saveData,
                saveStorage: 'inline',
                saveChunkPrefix: null,
                saveChunkCount: 0,
                name: currentUser.displayName,
                email: currentUser.email,
                appVersion: pwaVer,
                cloudSaveTooLarge: false
            }, expectedRevision);
            if (commitResult.previousStorage === 'chunked') {
                await deleteSaveChunkGeneration(
                    userDocRef,
                    commitResult.previousChunkPrefix,
                    commitResult.previousChunkCount
                );
            }
            console.log(`Upload success (inline): ${saveBytes} bytes`);
        }

        const isSameAuthenticatedUser = isRegisteredFirebaseUser()
            && auth.currentUser.uid === uid;
        if (isSameAuthenticatedUser) {
            setKnownCloudSaveRevision(uid, commitResult.revision);
            window.cloudSaveConflict = false;
            // Do not clear changes made while this asynchronous upload was running.
            if (localStorage.getItem('vocabClickerSave') === rawSaveData) {
                window.isDirty = false;
            }

            if (!silent) alert("保存完了！");
            const lastSync = document.getElementById('profileLastSync');
            if (lastSync) lastSync.textContent = new Date().toLocaleString();
            void maybeCleanupStaleSaveChunks(userDocRef, commitResult.activeChunkPrefix || null);
        }
        console.log("Upload success (Silent:" + silent + ")");

    } catch (e) {
        const isSameAuthenticatedUser = saveUserId
            && isRegisteredFirebaseUser()
            && auth.currentUser.uid === saveUserId;
        if (e && e.code === 'cloud-save-conflict') {
            if (isSameAuthenticatedUser) markCloudSaveConflict();
            if (!silent && isSameAuthenticatedUser) {
                alert('別の端末で更新されたため保存を中止しました。\nもう一度「保存する」を押して内容を確認してください。');
            }
        } else if (!silent && isSameAuthenticatedUser) {
            alert("アップロード失敗: " + e.message);
        }
        console.error("Upload Error:", e);
    }
}

// Serialize uploads in this tab so interval/background/manual saves cannot race each other.
window.uploadSaveData = async function (silent = false, force = false) {
    if (cloudSaveUploadPromise) {
        console.log('Cloud save already in progress; reusing current upload.');
        return cloudSaveUploadPromise;
    }

    const uploadPromise = performCloudSave(silent, force);
    cloudSaveUploadPromise = uploadPromise;
    try {
        return await uploadPromise;
    } finally {
        if (cloudSaveUploadPromise === uploadPromise) {
            cloudSaveUploadPromise = null;
        }
    }
};

// --- SAFE UI INIT (v2.37) ---
function initUI() {
    console.log("initUI: Attaching listeners...");

    // Help Modal
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');

    if (helpBtn) helpBtn.onclick = () => helpModal.style.display = 'flex';
    if (closeHelpModal) closeHelpModal.onclick = () => helpModal.style.display = 'none';
    if (helpModal) helpModal.onclick = (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; };

    // Wordbook Modal (if elements exist)
    const wbBtn = document.getElementById('wordbookBtn');
    const wbModal = document.getElementById('wordbookModal');
    const closeWb = document.getElementById('closeWordbookModal');
    if (wbBtn && wbModal) wbBtn.onclick = () => wbModal.style.display = 'flex';
    if (closeWb && wbModal) closeWb.onclick = () => wbModal.style.display = 'none';
    if (wbModal) wbModal.onclick = (e) => { if (e.target === wbModal) wbModal.style.display = 'none'; };

    // Wordbook Items
    document.querySelectorAll('.wordbook-item-btn').forEach(btn => {
        btn.onclick = () => {
            const level = btn.dataset.level;
            // Safe call to global switchLevel (game_logic.js)
            if (typeof switchLevel === 'function') switchLevel(level);
            if (wbModal) wbModal.style.display = 'none';
        }
    });

    // Profile Modal (Extra Safety)
    const profileBtn = document.getElementById('headerProfileIcon');
    // Note: headerProfileIcon has onclick="toggleProfileModal()" in HTML, 
    // which calls window.toggleProfileModal. That is fine.
}


// --- SERVICE WORKER LOGIC ---
if ('serviceWorker' in navigator) {
    let refreshing = false;

    // 1. Listen for new version activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;

        // During localhost development, avoid auto-reload loops.
        const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
        if (isLocal) {
            console.log('SW controller changed (dev mode): skip auto-reload');
            return;
        }

        // Prevent accidental reload loops in production too
        const now = Date.now();
        const last = parseInt(sessionStorage.getItem('sw_last_reload_ts') || '0', 10);
        if (last && (now - last) < 120000) {
            console.warn('Skip reload to avoid SW reload loop');
            return;
        }

        if (sessionStorage.getItem('sw_reloaded_once') === '1') {
            console.warn('Skip additional SW reload in same session');
            return;
        }

        refreshing = true;
        sessionStorage.setItem('sw_last_reload_ts', String(now));
        sessionStorage.setItem('sw_reloaded_once', '1');
        console.log("New version detected. Saving and reloading...");
        if (window.saveGame) window.saveGame(); // Safety Save
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service_worker.js', { updateViaCache: 'none' })
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}

// --- SHARE & QR LOGIC ---
// openShareModal and shareApp moved to ui_manager.js

// rename/cancel/register moved to ui_manager.js

let qrCodeObj = null;
// toggleQRCode moved to ui_manager.js

// Ensure qrcode library is loaded
// (It is loaded via script tag below)

// Run Init
// Load Listeners handled by ui_manager.js automatically
// window.addEventListener('load', () => {
//    initWelcomeSequence();
//    initUI();
// });

// --- DEBUG / VERIFICATION HELPERS ---
// Debug functions removed in v2.50


// --- UPDATE HELPER ---
// forceUpdateApp to ui_manager.js
