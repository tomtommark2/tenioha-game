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
const APP_VERSION = 'v2.33'; // MASTER VERSION DEFINITION (Fix Update Button & Text)
// Immediately set version strings (DOM is ready due to module defer/position)
const v1 = document.getElementById('helpVersionDisplay');
const v2 = document.getElementById('leaderboardVersionDisplay');
if (v1) v1.textContent = APP_VERSION;
if (v2) v2.textContent = `迴ｾ蝨ｨ縺ｮ繝舌�繧ｸ繝ｧ繝ｳ: ${APP_VERSION}`;

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
                ...above.reverse().map(u => ({ ...u, rank: '笆ｲ' })),
                { name: myDoc.data().name, score: myScore, rank: 'You', isMe: true },
                ...below.map(u => ({ ...u, rank: '笆ｼ' }))
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
window.toggleProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        updatePremiumStatusDisplay();
    }
};
window.openProfileModal = function () {
    document.getElementById('profileModal').style.display = 'flex';
    updatePremiumStatusDisplay();
};
window.closeProfileModal = function () {
    document.getElementById('profileModal').style.display = 'none';
};

// Purchase Modal Helpers (Added v2.29)
const STRIPE_BASE_URL = "https://buy.stripe.com/9B66oIbMidxG5M32Kl7ok01";
window.openPurchaseModal = function () {
    const modal = document.getElementById('purchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        // Update Stripe Link with User ID for Webhook
        const link = document.getElementById('stripePurchaseLink');
        if (link && userId) {
            // Decide which ID to use: Auth UID (preferred) or Local ID
            // Using global 'userId' variable which is kept in sync by onAuthStateChanged
            link.href = `${STRIPE_BASE_URL}?client_reference_id=${userId}`;
            console.log("Stripe Link Updated for:", userId);
        }
    }
};
window.closePurchaseModal = function () {
    document.getElementById('purchaseModal').style.display = 'none';
};

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
            const dateStr = (expiryTime > 0 && !isPermanent) ? expiryDate.toLocaleDateString() : "辟｡譛滄剞";
            tag.textContent = `繝励Ξ繝溘い繝� (譛滄剞: ${dateStr})`;
            tag.style.background = "#2ecc71"; // Green
            if (activationSection) activationSection.style.display = 'block'; // Allow extending
        } else {
            tag.textContent = isExpired ? "譛滄剞蛻�ｌ (蜀肴怏蜉ｹ蛹悶′蠢�ｦ�)" : "辟｡譁吶�繝ｩ繝ｳ (蛻ｶ髯舌≠繧�)";
            tag.style.background = "#95a5a6"; // Gray
            if (activationSection) activationSection.style.display = 'block'; // Show input
        }
    }
}

window.handleProfileAuth = function () {
    if (auth.currentUser) {
        if (confirm("繝ｭ繧ｰ繧｢繧ｦ繝医＠縺ｾ縺吶°��")) { logoutGoogle(); }
    } else {
        loginWithGoogle();
    }
};

// --- PREMIUM SYSTEM ---
// --- PREMIUM SYSTEM ---
window.redeemPromoCode = async function (inputId = 'promoCodeInput') {
    const input = document.getElementById(inputId);
    if (!input) return;
    const code = input.value.trim();

    if (!code) { alert("繧ｳ繝ｼ繝峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞"); return; }
    if (!auth || !auth.currentUser) { alert("繧ｳ繝ｼ繝峨ｒ驕ｩ逕ｨ縺吶ｋ縺ｫ縺ｯ繝ｭ繧ｰ繧､繝ｳ縺悟ｿ�ｦ√〒縺�"); return; }

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get Refs
            const codeDocRef = doc(db, "promocodes", code);
            const userRef = doc(db, "users", auth.currentUser.uid);

            const codeDoc = await transaction.get(codeDocRef);
            // 2. Validate Code Existence & Activity
            if (!codeDoc.exists() || codeDoc.data().active !== true) {
                throw "繧ｳ繝ｼ繝峨′辟｡蜉ｹ縺九∵悄髯仙�繧後〒縺吶�";
            }

            const codeData = codeDoc.data();

            const durationDays = codeData.durationDays || 30;

            // 3. Check Usage Limit (New Feature)
            if (codeData.maxRedemptions) {
                const currentCount = codeData.redemptionCount || 0;
                if (currentCount >= codeData.maxRedemptions) {
                    throw "縺薙�繧ｳ繝ｼ繝峨�蛻ｩ逕ｨ荳企剞縺ｫ驕斐＠縺ｾ縺励◆縲�";
                }
            }

            // 4. Validate User Status
            const userSnap = await transaction.get(userRef);
            let userData = userSnap.exists() ? userSnap.data() : {};

            // Check Duplicate Usage
            if (userData.redeemedCodes && userData.redeemedCodes.includes(code)) {
                throw "縺薙�繧ｳ繝ｼ繝峨�譌｢縺ｫ菴ｿ逕ｨ貂医∩縺ｧ縺吶�";
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

            alert(`繝励Ξ繝溘い繝�讖溯�縺梧怏蜉ｹ蛹悶＆繧後∪縺励◆�―n譛牙柑譛滄剞: ${newExpiryDate.toLocaleDateString()} 縺ｾ縺ｧ\n譌･謨ｰ: +${durationDays}譌･`);
            input.value = "";

        });

    } catch (e) {
        console.error(e);
        // Handle thrown strings as alerts
        if (typeof e === 'string') {
            alert(e);
        } else {
            alert("繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆: " + e.message);
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
        alert("Firebase Auth縺悟�譛溷喧縺輔ｌ縺ｦ縺�∪縺帙ｓ縲�n繝壹�繧ｸ繧偵Μ繝ｭ繝ｼ繝峨＠縺ｦ縺ｿ縺ｦ縺上□縺輔＞縲�");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Failed:", error);

        let msg = "繝ｭ繧ｰ繧､繝ｳ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲�";
        if (error.code === 'auth/popup-blocked') msg += "\n繝昴ャ繝励い繝��縺後ヶ繝ｭ繝�け縺輔ｌ縺ｾ縺励◆縲りｨｭ螳壹ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲�";
        if (error.code === 'auth/cancelled-popup-request') msg += "\n繝昴ャ繝励い繝��縺碁哩縺倥ｉ繧後∪縺励◆縲�";
        if (error.code === 'auth/popup-closed-by-user') msg += "\n繝昴ャ繝励い繝��縺碁哩縺倥ｉ繧後∪縺励◆縲�";
        if (error.code === 'auth/unauthorized-domain') msg += "\n險ｱ蜿ｯ縺輔ｌ縺ｦ縺�↑縺�ラ繝｡繧､繝ｳ縺ｧ縺吶�nFirebase Console縺ｧ繝峨Γ繧､繝ｳ繧定ｿｽ蜉�縺励※縺上□縺輔＞縲�";
        if (error.code === 'auth/operation-not-allowed') msg += "\nGoogle繝ｭ繧ｰ繧､繝ｳ縺檎┌蜉ｹ縺ｧ縺吶�nFirebase Console縺ｧ譛牙柑縺ｫ縺励※縺上□縺輔＞縲�";

        alert(`${msg}\n\n(Error Code: ${error.code})\n${error.message}`);
    }
};

window.logoutGoogle = async function () {
    if (!auth) return;
    try {
        await signOut(auth);
        alert("繝ｭ繧ｰ繧｢繧ｦ繝医＠縺ｾ縺励◆");
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
                    alert("繧ｳ繝ｼ繝峨′蜈･蜉帙＆繧後∪縺励◆縲�n驕ｩ逕ｨ縺吶ｋ縺ｫ縺ｯGoogle繝ｭ繧ｰ繧､繝ｳ縺悟ｿ�ｦ√〒縺吶�");
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
                authBtn.innerHTML = `<span>繝ｭ繧ｰ繧｢繧ｦ繝�</span>`;
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
                        const msg = `繧ｯ繝ｩ繧ｦ繝峨↓迴ｾ蝨ｨ繧医ｊ騾ｲ繧薙□繝��繧ｿ縺後≠繧翫∪縺吶�n(Cloud: ${cloudPoints} pts vs Local: ${localPoints} pts)\n\n蠕ｩ蜈�＠縺ｾ縺吶°�歔;
                        if (confirm(msg)) {
                            localStorage.setItem('vocabClickerSave', userDoc.data().saveData);
                            alert("蠕ｩ蜈�＠縺ｾ縺励◆縲ゅΜ繝ｭ繝ｼ繝峨＠縺ｾ縺吶�");
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
            if (modalName) modalName.textContent = "繧ｲ繧ｹ繝医Θ繝ｼ繧ｶ繝ｼ";
            if (modalEmail) modalEmail.textContent = "譛ｪ繝ｭ繧ｰ繧､繝ｳ";

            if (authBtn) {
                authBtn.innerHTML = `< img src = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width = "18" height = "18" > <span>Google縺ｧ繝ｭ繧ｰ繧､繝ｳ</span>`;
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
                    console.error(`Version Mismatch: Current ${ APP_VERSION } < Required ${minVer}`);
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
        if (!userDoc.exists() || !userDoc.data().saveData) { alert("繧ｯ繝ｩ繧ｦ繝峨↓繝��繧ｿ縺後≠繧翫∪縺帙ｓ"); return; }

        const cloudData = JSON.parse(userDoc.data().saveData);
        const localPoints = (typeof gameState !== 'undefined') ? gameState.points : -1;
        const cloudPoints = cloudData.points || 0;

        let msg = "繧ｯ繝ｩ繧ｦ繝我ｸ翫�繝��繧ｿ縺ｧ荳頑嶌縺阪＠縺ｾ縺吶°�歃\n莉翫�遶ｯ譛ｫ縺ｮ譛ｪ菫晏ｭ倥ョ繝ｼ繧ｿ縺ｯ豸医∴縺ｾ縺吶�";

        // Smart Warning
        if (localPoints > cloudPoints) {
            msg = `笞��� 隴ｦ蜻�: 迴ｾ蝨ｨ縺ｮ遶ｯ譛ｫ縺ｮ譁ｹ縺後せ繧ｳ繧｢縺碁ｫ倥＞縺ｧ縺呻ｼ―n(Local: ${localPoints} vs Cloud: ${cloudPoints})\n\n譛ｬ蠖薙↓繧ｯ繝ｩ繧ｦ繝峨�蜿､縺�ョ繝ｼ繧ｿ縺ｧ荳頑嶌縺阪＠縺ｾ縺吶°�歔;
        } else if (cloudPoints > localPoints) {
            msg = `繧ｯ繝ｩ繧ｦ繝峨↓譁ｰ縺励＞繝��繧ｿ縺後≠繧翫∪縺呻ｼ―n(Local: ${localPoints} vs Cloud: ${cloudPoints})\n\n蠕ｩ蜈�＠縺ｾ縺吶°�歔;
        }

        if (!confirm(msg)) return;

        // Restore Logic
        localStorage.setItem('vocabClickerSave', userDoc.data().saveData);
        alert("蠕ｩ蜈�＠縺ｾ縺励◆縲ゅΜ繝ｭ繝ｼ繝峨＠縺ｾ縺吶�");
        location.reload();
    } catch (e) { alert("繧ｨ繝ｩ繝ｼ: " + e.message); }
};

// Overwrite existing uploadSaveData to use Auth if available
// Added 'force' parameter to bypass dirty check (for Manual Save)
window.uploadSaveData = async function (silent = false, force = false) {
    if (!db) return;
    if (!auth || !auth.currentUser) {
        if (!silent) alert("繝ｭ繧ｰ繧､繝ｳ縺悟ｿ�ｦ√〒縺�");
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
                    if (!confirm(`笞��� 隴ｦ蜻�: 繧ｯ繝ｩ繧ｦ繝峨�譁ｹ縺後せ繧ｳ繧｢縺碁ｫ倥＞縺ｧ縺呻ｼ―n(Cloud: ${cloudExisting.points} vs Local: ${localDataObj.points})\n\n譛ｬ蠖薙↓迴ｾ蝨ｨ縺ｮ菴弱＞繧ｹ繧ｳ繧｢縺ｧ荳頑嶌縺阪＠縺ｾ縺吶°�歔)) {
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
            alert("菫晏ｭ伜ｮ御ｺ�ｼ�");
            const lastSync = document.getElementById('profileLastSync');
            if (lastSync) lastSync.textContent = new Date().toLocaleString();
        } else {
            // Update UI silently if open
            const lastSync = document.getElementById('profileLastSync');
            if (lastSync) lastSync.textContent = new Date().toLocaleString();
        }
    } catch (e) {
        if (!silent) alert("螟ｱ謨�: " + e.message);
        console.error(e);
    }
};

// --- MODAL LOGIC (Restored) ---
const wordbookBtn = document.getElementById('wordbookBtn');
const wordbookModal = document.getElementById('wordbookModal');
const closeWordbookModal = document.getElementById('closeWordbookModal');
const wordbookItems = document.querySelectorAll('.wordbook-item-btn');

if (wordbookBtn) {
    wordbookBtn.addEventListener('click', () => {
        wordbookModal.style.display = 'flex';
    });
}

if (closeWordbookModal) {
    closeWordbookModal.addEventListener('click', () => {
        wordbookModal.style.display = 'none';
    });
}

// Help Modal Logic
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelpModal = document.getElementById('closeHelpModal');

if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });
}

if (closeHelpModal) {
    closeHelpModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
}

if (helpModal) {
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
}

if (wordbookModal) {
    wordbookModal.addEventListener('click', (e) => {
        if (e.target === wordbookModal) {
            wordbookModal.style.display = 'none';
        }
    });
}

wordbookItems.forEach(btn => {
    btn.addEventListener('click', () => {
        const level = btn.dataset.level;
        switchLevel(level);
        wordbookModal.style.display = 'none';
    });
});

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
        alert("縺薙�繝悶Λ繧ｦ繧ｶ縺ｧ縺ｯ閾ｪ蜍輔う繝ｳ繧ｹ繝医�繝ｫ縺悟茜逕ｨ縺ｧ縺阪∪縺帙ｓ縲�n繝悶Λ繧ｦ繧ｶ縺ｮ繝｡繝九Η繝ｼ縲後�繝ｼ繝�逕ｻ髱｢縺ｫ霑ｽ蜉�縲阪↑縺ｩ縺九ｉ繧､繝ｳ繧ｹ繝医�繝ｫ縺励※縺上□縺輔＞縲�");
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
// --- WELCOME & PWA ENHANCEMENTS ---
// Removed duplicate 'welcomeDeferredPrompt' and listener.
// We will misuse the existing 'deferredPrompt' from line 4588.

function initWelcomeSequence() {
    // 1. PWA vs Browser Detection
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // 2. URL Param Parsing (Invite Code)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || urlParams.get('promo');

    if (inviteCode) {
        console.log("Welcome: Invite code detected:", inviteCode);
        const welcomeCodeSpan = document.getElementById('welcomeInviteCode');
        const inviteMsg = document.getElementById('inviteMessage');

        // Show in Welcome LP (if visible)
        if (welcomeCodeSpan) welcomeCodeSpan.textContent = inviteCode;
        if (inviteMsg) inviteMsg.style.display = 'block';

        // Auto-fill the main input field
        const mainInput = document.getElementById('promoCodeInput');
        if (mainInput) mainInput.value = inviteCode;
    }

    // 3. Flow Control
    const hasSkipped = localStorage.getItem('vocabGame_skipWelcome');
    const welcomeOverlay = document.getElementById('welcomeOverlay');

    if (isStandalone) {
        // App Mode: Skip LP
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';

        // --- APP INSTALL BONUS (3 DAYS) ---
        const hasReceivedBonus = localStorage.getItem('vocabGame_appBonusReceived');
        if (!hasReceivedBonus) {
            try {
                // MODIFIED (v2.13): Do NOT auto-grant. Show Promo Code instead.
                localStorage.setItem('vocabGame_appBonusReceived', 'true'); // Mark as shown to prevent repeat

                alert("�脂 繧｢繝励Μ繧､繝ｳ繧ｹ繝医�繝ｫ縺ゅｊ縺後→縺�＃縺悶＞縺ｾ縺呻ｼ� �脂\n\n諢溯ｬ昴�豌玲戟縺｡縺ｨ縺励※縲√�繝ｬ繝溘い繝�菴馴ｨ難ｼ�1譌･髢難ｼ峨さ繝ｼ繝峨ｒ雍亥争縺励∪縺吶�n\n縲舌�繝ｭ繝｢繧ｳ繝ｼ繝峨曾napp\n\n窶ｻ險ｭ螳夂判髱｢縺ｮ縲後さ繝ｼ繝牙�蜉帙阪°繧牙茜逕ｨ縺ｧ縺阪∪縺吶�n窶ｻGoogle繝ｭ繧ｰ繧､繝ｳ縺悟ｿ�ｦ√〒縺吶�");

            } catch (e) {
                console.error("Bonus Alert Failed", e);
            }
        }

        return;
    }

    // Browser Mode
    if (!hasSkipped) {
        // Show LP
        if (welcomeOverlay) welcomeOverlay.style.display = 'flex';
    } else {
        // Previously skipped
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';
    }
}

window.triggerInstall = async function () {
    // Installing implies "Don't show again" preference
    localStorage.setItem('vocabGame_skipWelcome', 'true');

    // Use the GLOBAL deferredPrompt (shared with Help/Profile)
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
            window.dismissWelcome();
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
    } else {
        // Fallback Guide
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            alert("縲舌う繝ｳ繧ｹ繝医�繝ｫ譁ｹ豕輔曾n\n1. 逕ｻ髱｢荳九�蜈ｱ譛峨�繧ｿ繝ｳ[竊曽繧偵ち繝��\n2. 縲後�繝ｼ繝�逕ｻ髱｢縺ｫ霑ｽ蜉�縲阪ｒ驕ｸ謚杤n\n縺薙ｌ縺ｧ繧｢繝励Μ縺ｨ縺励※蠢ｫ驕ｩ縺ｫ驕翫∋縺ｾ縺呻ｼ�");
        } else {
            alert("縲舌う繝ｳ繧ｹ繝医�繝ｫ譁ｹ豕輔曾n\n繝悶Λ繧ｦ繧ｶ縺ｮ繝｡繝九Η繝ｼ縺九ｉ縲後い繝励Μ繧偵う繝ｳ繧ｹ繝医�繝ｫ縲構n縺ｾ縺溘�縲後�繝ｼ繝�逕ｻ髱｢縺ｫ霑ｽ蜉�縲阪ｒ驕ｸ謚槭＠縺ｦ縺上□縺輔＞縲�"); // Chrome, etc.
        }
    }
};

window.dismissWelcome = function () {
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const checkbox = document.getElementById('dontShowWelcomeAgain');

    if (welcomeOverlay) {
        welcomeOverlay.style.opacity = '0';
        setTimeout(() => {
            welcomeOverlay.style.display = 'none';
            // Version Update Check logic if needed
            const currentVer = document.getElementById('appVersion') ? document.getElementById('appVersion').innerText : '2.15';
        }, 300);
    }

    // Only save skip flag if checkbox is checked
    if (checkbox && checkbox.checked) {
        localStorage.setItem('vocabGame_skipWelcome', 'true');
    }
};

// --- SHARE & QR LOGIC ---
window.openShareModal = function () {
    console.log("openShareModal called");
    const modal = document.getElementById('shareModal');
    const urlDisplay = document.getElementById('shareUrlDisplay');
    if (modal) {
        modal.style.display = 'flex';
        // Use current URL or fallback
        const shareUrl = window.location.href;
        if (urlDisplay) urlDisplay.textContent = shareUrl;
    } else {
        console.error("shareModal not found!");
        alert("繧ｨ繝ｩ繝ｼ: 繧ｷ繧ｧ繧｢逕ｻ髱｢縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ");
    }
};

window.shareApp = async function () {
    const shareData = {
        title: '闍ｱ蜊倩ｪ槫ｭｦ鄙偵け繝ｪ繝�き繝ｼ',
        text: '繝昴メ繝昴メ縺吶ｋ縺�縺代〒闍ｱ蜊倩ｪ槭′隕壹∴繧峨ｌ繧九ｈ�∽ｸ邱偵↓繧�ｍ縺�ｼ�',
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareData.url).then(() => {
            alert('URL繧偵さ繝斐�縺励∪縺励◆�―nSNS縺ｫ雋ｼ繧贋ｻ倥￠縺ｦ繧ｷ繧ｧ繧｢縺励※縺上□縺輔＞縲�');
        });
    }
};

let qrCodeObj = null;
window.toggleQRCode = function () {
    const mainContent = document.getElementById('shareMainContent');
    const qrSection = document.getElementById('qrSection');
    const qrContainer = document.getElementById('qrcode');

    if (qrSection.style.display === 'none') {
        // Show QR
        mainContent.style.display = 'none';
        qrSection.style.display = 'flex';

        // Remove existing QR if any (to prevent duplicates if URL changes dynamically, though unlikely here)
        qrContainer.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: window.location.href,
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrContainer.innerHTML = 'QR繧ｳ繝ｼ繝峨Λ繧､繝悶Λ繝ｪ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲�';
        }
    } else {
        // Hide QR
        qrSection.style.display = 'none';
        mainContent.style.display = 'block';
    }
};

// Ensure qrcode library is loaded
// (It is loaded via script tag below)

// Run Init
window.addEventListener('load', initWelcomeSequence);

// --- UPDATE HELPER ---
window.forceUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                setTimeout(() => window.location.reload(), 500);
                return;
            }
            try {
                await reg.update();
                alert('更新を確認しました。最新版であればリロードされます。');
                setTimeout(() => window.location.reload(), 500);
            } catch (e) {
                alert('更新チェックに失敗しました: ' + e);
            }
        } else {
            window.location.reload();
        }
    } else {
        window.location.reload();
    }
};
