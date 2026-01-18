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

// (Moved APP_VERSION to post-imports)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, where, Timestamp, serverTimestamp, arrayUnion, runTransaction, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getAnalytics, setUserId } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// --- VERSION CONTROL ---
const APP_VERSION = "v2.50"; // MASTER VERSION DEFINITION (Learning Log & Graph)
// Immediately set version strings (DOM is ready due to module defer/position)
const v1 = document.getElementById('helpVersionDisplay');
const v2 = document.getElementById('leaderboardVersionDisplay');
if (v1) v1.textContent = APP_VERSION;
if (v2) v2.textContent = `現在のバージョン: ${APP_VERSION}`;

// Global Firebase References
let db = null;
let userId = localStorage.getItem('vocabGame_userId');

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
    analytics = getAnalytics(app); // Initialize Analytics
    window.firestoreDb = db; // Expose DB
    window.firebaseAuth = auth; // Expose Auth
    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// --- EXPORTED FUNCTIONS ---

// 1. Upload/Sync Score
window.uploadScore = async function (name, score) {
    if (!db) return;
    // Prevent Ghost Records: Block unauthenticated uploads
    if (!auth || !auth.currentUser) {
        console.log("Skipping score upload: User not logged in.");
        return;
    }

    try {
        await setDoc(doc(db, "leaderboard", userId), {
            name: name,
            score: Math.floor(score),
            updatedAt: serverTimestamp()
        }, { merge: true });
        console.log("Score uploaded:", score);
    } catch (e) {
        console.error("Error uploading score:", e);
    }
};

// 2. Fetch Leaderboard (Cached)
// Cache Store
const leaderboardCache = {
    top: { data: null, timestamp: 0 },
    around: { data: null, timestamp: 0 }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

let currentLeaderboardTab = 'top';

window.switchTab = function (tab) {
    currentLeaderboardTab = tab;
    window.fetchLeaderboard(tab, true).then(data => {
        // Assuming renderLeaderboard is a global function defined elsewhere
        if (typeof window.renderLeaderboard === 'function') {
            window.renderLeaderboard(data.results);
        }
    });

    // Update tab active state
    document.querySelectorAll('.leaderboard-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

window.fetchLeaderboard = async function (type, force = false) {
    if (!db) return { error: "Firebase not connected" };

    // Cache Check
    const now = Date.now();
    if (!force && leaderboardCache[type] && leaderboardCache[type].data) {
        const elapsed = now - leaderboardCache[type].timestamp;
        if (elapsed < CACHE_DURATION) {
            console.log(`Leaderboard (${type}): Using Cache (${Math.floor((CACHE_DURATION - elapsed) / 1000)}s left)`);
            return { results: leaderboardCache[type].data };
        }
    }

    try {
        const leaderboardRef = collection(db, "leaderboard");
        let results = [];

        if (type === 'top') {
            const q = query(leaderboardRef, orderBy("score", "desc"), limit(20));
            const snapshot = await getDocs(q);
            let rank = 1;
            snapshot.forEach(doc => {
                results.push({
                    rank: rank++,
                    name: doc.data().name || "Unknown",
                    score: doc.data().score,
                    isMe: (doc.id === userId)
                });
            });
        } else if (type === 'around') {
            const myDoc = await getDoc(doc(db, "leaderboard", userId));
            if (!myDoc.exists()) return { results: [] };
            const myScore = myDoc.data().score;
            const qAbove = query(leaderboardRef, where("score", ">", myScore), orderBy("score", "asc"), limit(4));
            const sAbove = await getDocs(qAbove);
            const qBelow = query(leaderboardRef, where("score", "<", myScore), orderBy("score", "desc"), limit(4));
            const sBelow = await getDocs(qBelow);

            let above = []; sAbove.forEach(d => above.push({ name: d.data().name, score: d.data().score }));
            let below = []; sBelow.forEach(d => below.push({ name: d.data().name, score: d.data().score }));

            results = [
                ...above.reverse().map(u => ({ ...u, rank: '▲' })),
                { name: myDoc.data().name, score: myScore, rank: 'You', isMe: true },
                ...below.map(u => ({ ...u, rank: '▼' }))
            ];
        }

        // Update Cache
        leaderboardCache[type] = {
            data: results,
            timestamp: now
        };
        console.log(`Leaderboard (${type}): Fetched & Cached`);

        return { results: results };
    } catch (e) {
        return { error: e.message };
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

window.updatePremiumStatusDisplay = function () {
    const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
    const expiryTime = parseInt(localStorage.getItem('vocabGame_expiry') || '0');
    const tag = document.getElementById('planStatusTag');
    const activationSection = document.getElementById('premiumActivationSection');

    // Expiration Check (Local Enforcement)
    const now = Date.now();
    const isExpired = expiryTime > 0 && now > expiryTime;

    if (isExpired && isUnlocked) {
        // Auto-lock if expired locally
        localStorage.setItem('vocabGame_isUnlocked', 'false');
    }

    // BUGFIX v2.22: Always enforce trial lock if expired, regardless of previous local state.
    if (isExpired) {
        if (typeof trialState !== 'undefined' && trialState.unlocked) {
            trialState.unlocked = false;
            saveTrialState();
            updateTrialUI();
        }
    }

    const effectivePremium = isUnlocked && !isExpired;

    if (tag) {
        if (effectivePremium) {
            const expiryDate = new Date(expiryTime);
            const isPermanent = expiryDate.getFullYear() > 3000;
            const dateStr = (expiryTime > 0 && !isPermanent) ? expiryDate.toLocaleDateString() : "無期限";
            tag.textContent = `プレミアム (期限: ${dateStr})`;
            tag.style.background = "#2ecc71"; // Green
            if (activationSection) activationSection.style.display = 'block'; // Allow extending
        } else {
            tag.textContent = isExpired ? "期限切れ (再有効化が必要)" : "無料プラン (制限あり)";
            tag.style.background = "#95a5a6"; // Gray
            if (activationSection) activationSection.style.display = 'block'; // Show input
        }
    }
}

window.handleProfileAuth = function () {
    if (auth.currentUser) {
        if (confirm("ログアウトしますか？")) { logoutGoogle(); }
    } else {
        loginWithGoogle();
    }
};

// --- PREMIUM SYSTEM ---
window.redeemPromoCode = async function (inputId = 'promoCodeInput') {
    const input = document.getElementById(inputId);
    if (!input) return;
    const code = input.value.trim();

    if (!code) { alert("コードを入力してください"); return; }
    if (!auth || !auth.currentUser) { alert("コードを適用するにはログインが必要です"); return; }

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get Refs
            const codeDocRef = doc(db, "promocodes", code);
            const userRef = doc(db, "users", auth.currentUser.uid);

            const codeDoc = await transaction.get(codeDocRef);
            // 2. Validate Code Existence & Activity
            if (!codeDoc.exists() || codeDoc.data().active !== true) {
                throw "コードが無効か、期限切れです。";
            }

            const codeData = codeDoc.data();

            const durationDays = codeData.durationDays || 30;

            // 3. Check Usage Limit (New Feature)
            if (codeData.maxRedemptions) {
                const currentCount = codeData.redemptionCount || 0;
                if (currentCount >= codeData.maxRedemptions) {
                    throw "このコードの利用上限に達しました。";
                }
            }

            // 4. Validate User Status
            const userSnap = await transaction.get(userRef);
            let userData = userSnap.exists() ? userSnap.data() : {};

            // Check Duplicate Usage
            if (userData.redeemedCodes && userData.redeemedCodes.includes(code)) {
                throw "このコードは既に使用済みです。";
            }

            // 5. Calculate New Expiration
            let currentExpiry = 0;
            if (userData.premiumExpiresAt) {
                currentExpiry = userData.premiumExpiresAt.toMillis();
            }

            const now = Date.now();
            let newExpiryTime;

            if (currentExpiry > now) {
                newExpiryTime = currentExpiry + (durationDays * 24 * 60 * 60 * 1000);
            } else {
                newExpiryTime = now + (durationDays * 24 * 60 * 60 * 1000);
            }

            const newExpiryTimestamp = Timestamp.fromMillis(newExpiryTime);

            // 6. Perform Updates (Atomic)
            transaction.set(userRef, {
                isPremium: true,
                premiumExpiresAt: newExpiryTimestamp,
                premiumSource: 'promo_code',
                lastActivatedAt: serverTimestamp(),
                usedCode: code,
                redeemedCodes: arrayUnion(code)
            }, { merge: true });

            // Increment Usage Count on Code
            transaction.update(codeDocRef, {
                redemptionCount: increment(1)
            });

            // 7. Store Local Data for UI (Side Effect separate from Transaction)
            // (We can't do local storage inside transaction effectively, pass data out)
            return { newExpiryTime, durationDays, newExpiryDate: new Date(newExpiryTime) };
        }).then((result) => {
            // Transaction Success
            const { newExpiryTime, durationDays, newExpiryDate } = result;

            // 3. Unlock Locally
            localStorage.setItem('vocabGame_isUnlocked', 'true');
            localStorage.setItem('vocabGame_expiry', newExpiryTime);
            updatePremiumStatusDisplay();

            // 4. Force Unlock Trial
            if (typeof trialState !== 'undefined') {
                trialState.unlocked = true;
                if (typeof saveTrialState === 'function') saveTrialState();
                if (typeof updateTrialUI === 'function') updateTrialUI();
                document.getElementById('trialOverlay').style.display = 'none';
            }

            alert(`プレミアム機能が有効化されました！\n有効期限: ${newExpiryDate.toLocaleDateString()} まで\n日数: +${durationDays}日`);
            input.value = "";

        });

    } catch (e) {
        console.error(e);
        // Handle thrown strings as alerts
        if (typeof e === 'string') {
            alert(e);
        } else {
            alert("エラーが発生しました: " + e.message);
        }
    }
};

// Bridge function for Lock Screen
window.unlockGame = function () {
    // Use the new Cloud Validation logic
    redeemPromoCode('unlockPassword');
};

window.loginWithGoogle = async function () {
    if (!auth) {
        alert("Firebase Authが初期化されていません。\nページをリロードしてみてください。");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
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
    if (!auth) return;
    try {
        await signOut(auth);
        alert("ログアウトしました");
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

                if (user) {
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
            // --- LOGGED IN ---
            console.log("Auth: Logged in as", user.uid);

            // GA4: Set User ID for cross-device tracking
            if (analytics) {
                setUserId(analytics, user.uid);
            }

            userId = user.uid; // Switch to Auth ID
            localStorage.setItem('vocabGame_userId', userId);

            // Update Header
            if (headerImage) { headerImage.src = user.photoURL; headerImage.style.display = 'block'; }
            if (headerInitials) headerInitials.style.display = 'none';
            if (headerIcon) headerIcon.style.border = "2px solid #2ecc71"; // Green border

            // --- LEADERBOARD SYNC ---
            // Improved: Only set Google Name if NO name is registered
            if (typeof window.uploadScore === 'function') {
                const currentPoints = (typeof gameState !== 'undefined') ? gameState.points : 0;

                // Check if name is already set locally or wait for cloud sync?
                // Better to rely on Cloud Sync logic below to fetch name.
                // Only set default if we are sure?
                // Actually, let's defer this. The logic below (Step 3) fetches the name.
                // If that returns empty, THEN we can default to Google Name.

                // Temporary placeholder - we will handle name syncing in the async block below
                // to avoid overwriting custom names.
            }

            // Update Modal
            if (modalImage) { modalImage.src = user.photoURL; modalImage.style.display = 'block'; }
            if (modalInitials) modalInitials.style.display = 'none';
            if (modalName) modalName.textContent = user.displayName;
            if (modalEmail) modalEmail.textContent = user.email;

            if (authBtn) {
                authBtn.innerHTML = `<span>ログアウト</span>`;
                authBtn.style.background = "#bdc3c7";
            }
            if (syncSection) syncSection.style.display = 'block';

            // --- SMART SYNC LOGIC ---
            try {
                const userDoc = await getDoc(doc(db, "users", userId));

                // 1. Premium Status Sync (Subscription Model)
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    let cloudExpiresAt = 0;

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
                if (userDoc.exists() && userDoc.data().saveData) {
                    const cloudData = JSON.parse(userDoc.data().saveData);
                    const cloudTime = cloudData.lastSaveTime || 0;

                    if (lastSync) lastSync.textContent = new Date(cloudTime).toLocaleString();

                    const localStr = localStorage.getItem('vocabClickerSave');
                    const localData = localStr ? JSON.parse(localStr) : null;
                    const localTime = localData ? (localData.lastSaveTime || 0) : 0;

                    console.log(`Sync Check: Cloud(Pts:${cloudData.points}, Time:${new Date(cloudTime).toLocaleTimeString()}) vs Local(Pts:${localData ? localData.points : 0}, Time:${new Date(localTime).toLocaleTimeString()})`);

                    const localPoints = localData ? localData.points : 0;
                    const cloudPoints = cloudData.points || 0;

                    // 1. Cloud has better progress (Score based)
                    if (cloudPoints > localPoints) {
                        console.log("Cloud has better score. Prompting restore...");
                        const msg = `クラウドに現在より進んだデータがあります。\n(Cloud: ${cloudPoints} pts vs Local: ${localPoints} pts)\n\n復元しますか？`;
                        if (confirm(msg)) {
                            localStorage.setItem('vocabClickerSave', userDoc.data().saveData);
                            alert("復元しました。リロードします。");
                            location.reload();
                        } else {
                            // User chose to keep local (lower score). 
                            // Likely they want to reset or start over? Or they made a mistake.
                            // We honor their choice. We do NOT auto-upload immediately to avoid overwriting cloud record yet, 
                            // unless they play and trigger isDirty.
                            console.log("User rejected Cloud restore. Keeping Local.");
                            window.isDirty = true; // Mark local as dirty so it eventually syncs up
                        }
                    }
                    // 2. Local has better or equal progress
                    else {
                        console.log("Local has better or equal score. Keeping Logic.");
                        // If Local is significantly ahead or just ahead, we prefer Local.
                        // We rely on Auto-Save or Manual Save to eventually push this to Cloud.
                        if (localPoints > cloudPoints) {
                            window.isDirty = true; // Ensure this gets pushed
                        }
                    }
                } else {
                    console.log("No cloud data. Uploading local data...");
                    uploadSaveData(true);
                }
            } catch (e) { console.error("Sync Check Failed:", e); }

            // 3. Sync Leaderboard Name (Robust)
            try {
                const lbDoc = await getDoc(doc(db, "leaderboard", userId));
                let finalName = localStorage.getItem('vocabGame_playerName'); // Start with local

                if (lbDoc.exists() && lbDoc.data().name) {
                    // Case A: Cloud has a name. It is the master authority.
                    const cloudName = lbDoc.data().name;
                    if (cloudName !== finalName) {
                        console.log(`Name Sync: Cloud '${cloudName}' overrides local '${finalName}'`);
                        finalName = cloudName;
                        localStorage.setItem('vocabGame_playerName', finalName);
                        playerName = finalName;
                    }
                } else {
                    // Case B: Cloud has NO name (New User for Leaderboard).
                    // If local is also empty, use Google Display Name.
                    if (!finalName && user.displayName) {
                        console.log(`Name Sync: New user, defaulting to Google Name '${user.displayName}'`);
                        finalName = user.displayName;
                        localStorage.setItem('vocabGame_playerName', finalName);
                        playerName = finalName;
                    }
                    // Now upload this initial name to Cloud
                    if (finalName && window.uploadScore) {
                        window.uploadScore(finalName, (typeof gameState !== 'undefined') ? gameState.points : 0);
                    }
                }
            } catch (e) { console.error("Name Sync Failed:", e); }

            // Start Auto-Save Loop
            // (Force Sync: 2026/01/13)
            startAutoSaveLoop();

        } else {
            // --- LOGGED OUT ---
            console.log("Auth: Signed out");

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
                authBtn.style.background = "#667eea";
            }
            if (syncSection) syncSection.style.display = 'none';

            // Stop Auto-Save
            if (window.autoSaveInterval) clearInterval(window.autoSaveInterval);
        }
    });
}


// --- VERSION ENFORCER (Kill Switch) ---
window.checkForceUpdate = async function () {
    if (!db) return;
    try {
        const configDoc = await getDoc(doc(db, "config", "app_settings"));
        if (configDoc.exists()) {
            const minVer = configDoc.data().min_required_version ? configDoc.data().min_required_version.trim() : null;
            if (minVer) {
                // Simple Lexicographical Comparison
                if (APP_VERSION.trim() < minVer) {
                    console.error(`Version Mismatch: Current ${APP_VERSION} < Required ${minVer}`);
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
        if (auth && auth.currentUser) {
            if (window.isDirty) {
                console.log("AutoManager: Dirty flag true. Sending background save...");
                uploadSaveData(true); // Silent
            }
        }
    }, 60000);

    // 2. Save on Exit / Background (visibilitychange)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            if (auth && auth.currentUser && window.isDirty) {
                console.log("AutoManager: App hidden. Saving immediately...");
                // Use beacon-like behavior if possible, but fetch usually works in visibilitychange
                uploadSaveData(true);
            }
        }
    });

    // 3. Fallback for Tab Close (pagehide)
    window.addEventListener('pagehide', () => {
        if (auth && auth.currentUser && window.isDirty) {
            // Try to push. Note: Async requests might be killed.
            // Ideally we use navigator.sendBeacon but Firestore SDK handles logic.
            // We just call it and hope for best effort.
            uploadSaveData(true);
        }
    });
}

// Modified Upload/Restore for Auth
window.forceBackup = async function () {
    // Force save (not silent)
    await uploadSaveData(false, true);
};

window.forceRestore = async function () {
    if (!db || !auth.currentUser) return;
    // First check if local is un-synced
    // But restore implies "I want Cloud Data".

    try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (!userDoc.exists() || !userDoc.data().saveData) { alert("クラウドにデータがありません"); return; }

        const cloudData = JSON.parse(userDoc.data().saveData);
        const localPoints = (typeof gameState !== 'undefined') ? gameState.points : -1;
        const cloudPoints = cloudData.points || 0;

        let msg = "クラウド上のデータで上書きしますか？\n今の端末の未保存データは消えます。";

        // Smart Warning
        if (localPoints > cloudPoints) {
            msg = `⚠️ 警告: 現在の端末の方がスコアが高いです！\n(Local: ${localPoints} vs Cloud: ${cloudPoints})\n\n本当にクラウドの古いデータで上書きしますか？`;
        } else if (cloudPoints > localPoints) {
            msg = `クラウドに新しいデータがあります！\n(Local: ${localPoints} vs Cloud: ${cloudPoints})\n\n復元しますか？`;
        }

        if (!confirm(msg)) return;

        // Restore Logic
        localStorage.setItem('vocabClickerSave', userDoc.data().saveData);
        alert("復元しました。リロードします。");
        location.reload();
    } catch (e) { alert("エラー: " + e.message); }
};

// Overwrite existing uploadSaveData to use Auth if available
// Added 'force' parameter to bypass dirty check (for Manual Save)
window.uploadSaveData = async function (silent = false, force = false) {
    if (!db) return;
    if (!auth || !auth.currentUser) {
        if (!silent) alert("ログインが必要です。");
        return;
    }

    // Dirty Check
    if (!force && !window.isDirty) {
        console.log("Skipping upload: No changes (isDirty=false)");
        return;
    }

    const saveData = localStorage.getItem('vocabClickerSave');
    if (!saveData) return;

    try {
        // Conflict Check Logic (Prevent Overwriting Higher Score)
        // We must READ before WRITE.
        const userDocRef = doc(db, "users", auth.currentUser.uid);

        // Only check conflict if NOT silent (Manual Save) OR if we want to be super safe.
        // For 'Manual Save' (force=true, silent=false), we MUST check.
        // For 'Auto Save' (silent=true), ideally we check too, but reading every 60s is extra reads.
        // Compromise: Auto-Save blindly writes IF local is newer? No, Auto-Safety is better.
        // Let's Read-Check for Manual Mode. For Auto-Mode, maybe skip read to save quota? 
        // BUT user issue was "Manual Save overwrote old data". So checking on Manual is Critical.

        // Let's implement checking for Manual Save Only (silent=false) to show alert.
        if (!silent) {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().saveData) {
                const cloudExisting = JSON.parse(docSnap.data().saveData);
                const localDataObj = JSON.parse(saveData);

                if (cloudExisting.points > localDataObj.points) {
                    if (!confirm(`⚠️ 警告: クラウドの方がスコアが高いです！\n(Cloud: ${cloudExisting.points} vs Local: ${localDataObj.points})\n\n本当に現在の低いスコアで上書きしますか？`)) {
                        console.log("Upload aborted by user.");
                        return;
                    }
                }
            }
        }

        const verElem = document.getElementById('helpVersionDisplay');
        const pwaVer = verElem ? verElem.textContent : 'unknown';

        await setDoc(userDocRef, {
            saveData: saveData,
            updatedAt: serverTimestamp(),
            name: auth.currentUser.displayName,
            email: auth.currentUser.email,
            appVersion: pwaVer
        }, { merge: true });

        // Reset Dirty Flag on success
        window.isDirty = false;

        if (!silent) {
            alert("保存完了！");
            const lastSync = document.getElementById('profileLastSync');
            if (lastSync) lastSync.textContent = new Date().toLocaleString();
        } else {
            // Update UI silently if open
            const lastSync = document.getElementById('profileLastSync');
            if (lastSync) lastSync.textContent = new Date().toLocaleString();
        }
        // Reset Dirty Flag on success
        window.isDirty = false;
        console.log("Upload success (Silent:" + silent + ")");

        // TRIGGER DAILY LOG SAVE (New v2.37)
        // We do this after successful main save to ensure stats are fresh
        if (window.saveDailyProgress) {
            window.saveDailyProgress();
        }

    } catch (e) {
        if (!silent) alert("アップロード失敗: " + e.message);
        console.error("Upload Error:", e);
    }
};

// --- LEARNING LOG & GRAPH SYSTEM (v2.37) ---

// Map Internal Levels to CEFR
const CEFR_MAP = {
    'junior': 'A1',
    'basic': 'A2',
    'daily': 'B1',
    'exam1': 'B2',
    'exam1_2': 'B2', // handling potential variants
    'exam2': 'B2'
};

// Max counts per CEFR level (Approximate for capping)
const CEFR_MAX = {
    'A1': 1100, // Junior
    'A2': 1100, // Basic
    'B1': 1500, // Daily
    'B2': 2500, // Exam
    'total': 6200
};

window.saveDailyProgress = async function () {
    if (!db || !auth.currentUser || typeof gameState === 'undefined') return;

    try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const docId = `${yyyy}-${mm}-${dd}`;

        // 1. Calculate Stats
        let stats = { A1: 0, A2: 0, B1: 0, B2: 0 };
        let totalLearned = 0;

        // Iterate all wordStates
        for (const [key, status] of Object.entries(gameState.wordStates)) {
            // Count 'learned', 'proficient' (legacy?), 'perfect'
            // In v2.x: 'learned' (blue) and 'perfect' (gold). 
            // Note: 'proficient' is not used in current logic but maybe legacy.
            // Let's count 'learned' and 'perfect'.
            if (status === 'learned' || status === 'perfect') {
                const parts = key.split('_');
                const level = parts[0];
                // Handle 'selection' special levels?
                // If selection maps to standard levels, we count them based on reference?
                // Current logic just prefixes level.

                const cefr = CEFR_MAP[level];
                if (cefr) {
                    stats[cefr]++;
                    totalLearned++;
                }
            }
        }

        // 2. Save to Firestore Daily Log
        const logRef = doc(db, "users", auth.currentUser.uid, "daily_logs", docId);

        await setDoc(logRef, {
            date: serverTimestamp(), // Use server time for sorting
            dateString: docId,
            total_learned: totalLearned,
            cefr_breakdown: stats,
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log(`Daily Log Saved [${docId}]: Total ${totalLearned}`, stats);

        // 3. Update Parent Doc for fast access
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, {
            lastLogDate: docId,
            currentStats: {
                total: totalLearned,
                cefr: stats
            }
        }, { merge: true });

    } catch (e) {
        console.error("Daily Log Save Failed:", e);
    }
};

let myPageChart = null;

// Graph Data & Prediction Logic
// Graph Data Logic - Simple Monthly Stats
// Graph Configuration (Scales)
const GRAPH_SCALES = {
    total: { max: 8018, label: '総合' },
    A1: { max: 1221, label: 'Junior (A1)' },
    A2: { max: 1448, label: 'Basic (A2)' },
    B1: { max: 2480, label: 'Daily (B1)' },
    B2: { max: 2869, label: 'Exam1 (B2)', stepSize: 500 }
};

// Graph Data Logic - Simple Monthly Stats
window.getMonthlyStats = async function () {
    let logMap = new Map();
    let hasRealData = false;

    if (db && auth.currentUser) {
        const logsRef = collection(db, "users", auth.currentUser.uid, "daily_logs");
        const q = query(logsRef, orderBy("dateString", "desc"), limit(45));

        try {
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                logMap.set(doc.data().dateString, doc.data());
            });
            if (!snapshot.empty) hasRealData = true;
        } catch (e) {
            console.log("Firestore Read Failed (Offline?):", e);
        }
    }

    // Merged getMonthlyStatsReal logic here

    // 1. FORCE SYNC TODAY'S DATA
    if (typeof window.updateDailyHistory === 'function') {
        window.updateDailyHistory();
    }

    // 2. Generate Dates (30 Days)
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

    // 3. Prepare Source Data (History Only)
    // logMap already defined above

    // Prioritize Cloud/Module scope db but fallback to global gs
    const gs = typeof gameState !== 'undefined' ? gameState : (window.gameState || null);

    // Merge Cloud Snapshot if available (async logic above populates logMap usually, but here we unify)
    // We will assume 'logMap' might be populated by Cloud in the future, but currently we rely on Local History.

    if (gs && gs.dailyHistory && gs.dailyHistory.length > 0) {
        gs.dailyHistory.forEach(h => {
            if (h.date) {
                // Latest entry overrides
                logMap.set(h.date, {
                    total_learned: h.wordsLearned,
                    cefr_breakdown: h.cefr_breakdown || {}
                });
            }
        });
    }

    // 4. Build Datasets
    let labels = [];
    let datasets = {
        total: [],
        A1: [],
        A2: [],
        B1: [],
        B2: []
    };
    let isRealData = new Array(30).fill(true);

    dates.forEach((dateStr) => {
        const dPart = new Date(dateStr);
        labels.push(`${dPart.getMonth() + 1}/${dPart.getDate()}`);

        if (logMap.has(dateStr)) {
            const data = logMap.get(dateStr);
            datasets.total.push(data.total_learned || 0);
            datasets.A1.push(data.cefr_breakdown?.A1 || 0);
            datasets.A2.push(data.cefr_breakdown?.A2 || 0);
            datasets.B1.push(data.cefr_breakdown?.B1 || 0);
            datasets.B2.push(data.cefr_breakdown?.B2 || 0);
        } else {
            // Missing data = 0
            datasets.total.push(0);
            datasets.A1.push(0);
            datasets.A2.push(0);
            datasets.B1.push(0);
            datasets.B2.push(0);
        }
    });

    return { labels, datasets, isRealData, isDemo: false };
};

// UI: Render Chart
window.updateChart = async function (type = 'total') {
    const ctx = document.getElementById('learningChart');
    if (!ctx) return;

    // Loading State
    const ctx2d = ctx.getContext('2d');
    ctx2d.clearRect(0, 0, ctx.width, ctx.height);

    // Update Tabs
    document.querySelectorAll('.chart-tab').forEach(b => {
        b.classList.remove('active');
        b.style.background = '#f1f2f6';
        b.style.color = '#555';
        if (b.dataset.tab === type) {
            b.classList.add('active');
            b.style.background = '#6c5ce7';
            b.style.color = 'white';
        }
    });

    const dataObj = await window.getMonthlyStats();
    if (!dataObj) {
        if (typeof renderMockChart === 'function') renderMockChart();
        else ctx.getContext('2d').fillText("データがありません", 20, 50);
        return;
    }

    // Colors
    const colors = {
        total: '#6c5ce7',
        A1: '#00b894',
        A2: '#0984e3',
        B1: '#fdcb6e',
        B2: '#e17055'
    };

    // Prepare Gradient
    const gradient = ctx2d.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, colors[type]);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    // Stats Text update
    const currentVal = dataObj.datasets[type][dataObj.datasets[type].length - 1];
    const demoBadge = dataObj.isDemo ? '<span style="color:#e67e22; margin-left:5px;">(Demo Data)</span>' : '';

    // Get Scale Info
    const scaleConfig = GRAPH_SCALES[type] || GRAPH_SCALES.total;

    document.getElementById('chartStats').innerHTML = `
        <div style="text-align: right; font-size: 10px; color: #999; margin-bottom: -5px;">過去30日間の推移${demoBadge}</div>
        <div style="text-align: right;">
            現在: <strong style="font-size: 16px; color: ${colors[type]}">${currentVal}語</strong> 
            <span style="font-size:10px; color:#ccc;"> / ${scaleConfig.max}</span>
        </div>
    `;

    if (myPageChart) myPageChart.destroy();

    myPageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataObj.labels,
            datasets: [
                {
                    label: scaleConfig.label,
                    data: dataObj.datasets[type],
                    borderColor: colors[type],
                    backgroundColor: gradient,
                    fill: 'start',
                    tension: 0,
                    pointRadius: (context) => {
                        const index = context.dataIndex;
                        if (dataObj.isRealData[index]) return 5;
                        return 0;
                    },
                    pointBackgroundColor: colors[type],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: colors[type],
                    pointHoverBorderColor: '#fff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: colors[type],
                    titleFont: { size: 11 },
                    bodyFont: { size: 14, weight: 'bold' },
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + ' / ' + scaleConfig.max;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        stepSize: scaleConfig.stepSize || undefined,
                        maxTicksLimit: 20,
                        autoSkip: false,
                        callback: function (value) { if (value % 1 === 0) { return value; } },
                        maxRotation: 0,
                        font: { size: 10 },
                        color: '#aaa'
                    },
                    afterBuildTicks: function (axis) {
                        if (scaleConfig.max === 2869) { // B2 Specific
                            axis.ticks = [0, 500, 1000, 1500, 2000, 2500, 2869].map(v => ({ value: v }));
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: scaleConfig.max, // Fixed Scale
                    grid: { color: '#f5f5f5' },
                    position: 'right',
                    ticks: {
                        font: { size: 9 },
                        color: '#aaa',
                        stepSize: Math.floor(scaleConfig.max / 5)
                    }
                }
            }
        }
    });
};


// Override Profile Modal Open to load Chart
const originalOpenProfile = window.openProfileModal;
window.openProfileModal = function () {
    // Call original logic (UI toggle)
    document.getElementById('profileModal').style.display = 'flex';
    if (window.updatePremiumStatusDisplay) window.updatePremiumStatusDisplay();

    // New: Init Chart
    // Defer slightly to ensure modal is rendered
    setTimeout(() => {
        updateChart('total');
    }, 100);
};

// FIX: Expose toggleProfileModal for HTML onclick
window.toggleProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal.style.display === 'flex') {
        window.closeProfileModal();
    } else {
        window.openProfileModal();
    }
};

window.closeProfileModal = function () {
    document.getElementById('profileModal').style.display = 'none';
};

// Expose openProfileModal (already defined but let's be explicit)
// window.openProfileModal is defined above at line 1139


// --- SIMPLE MODE LOGIC (Moved to ui_manager.js) ---
/*
window.openSimpleModeModal = ...
window.startSimpleMode = ...
window.exitSimpleMode = ...
*/

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
        refreshing = true;
        console.log("New version detected. Saving and reloading...");
        if (window.saveGame) window.saveGame(); // Safety Save
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service_worker.js').then(reg => {
            console.log('Service Worker Registered!', reg);

            // 1.5 Force check for updates immediately on load
            reg.update().catch(e => console.log('SW initial update check failed', e));

            // 2. Check for updates when app comes to foreground
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update().catch(e => console.log('SW update check failed', e));
                }
            });
        }).catch(err => console.log('Service Worker registration failed: ', err));
    });
}

// --- PWA INSTALL LOGIC ---
let deferredPrompt;
const installContainer = document.getElementById('installAppContainer');
const installBtnHelper = document.getElementById('pwaInstallBtn'); // Help Modal
const installBtnProfile = document.getElementById('profileInstallBtn'); // Profile Modal

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    console.log("PWA Install Prompt ready");

    // Enable Helper Button
    if (installBtnHelper) {
        installBtnHelper.style.background = "#e17055"; // Orange
        installBtnHelper.style.cursor = "pointer";
        installBtnHelper.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    }
    const desc = document.getElementById('pwaInstallDesc');


    // Enable Profile Button
    if (installBtnProfile) {
        installBtnProfile.style.display = 'block';
        installBtnProfile.style.background = "#e17055";
        installBtnProfile.style.color = "white";
        installBtnProfile.style.border = "none";
    }
});

window.installApp = () => {
    // If not ready, show alert or do nothing
    if (!deferredPrompt) {
        alert("このブラウザでは自動インストールが利用できません。\nブラウザのメニュー「ホーム画面に追加」などからインストールしてください。");
        return;
    }

    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
    });
};

if (installBtnHelper) installBtnHelper.addEventListener('click', installApp);
if (installBtnProfile) installBtnProfile.addEventListener('click', installApp);

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installContainer) installContainer.style.display = 'none';
    if (installBtnProfile) installBtnProfile.style.display = 'none';
});
// --- WELCOME & PWA ENHANCEMENTS ---
// Removed duplicate 'welcomeDeferredPrompt' and listener.
// We will misuse the existing 'deferredPrompt' from line 4588.

// initWelcomeSequence logic moved to ui_manager.js

// window.triggerInstall moved to ui_manager.js
// window.dismissWelcome moved to ui_manager.js

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
