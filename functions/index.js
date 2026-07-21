const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {
    REVIEW_SCORE_INTERVALS,
    REVIEW_SCORE_OUTCOMES,
    calculateReviewEventPoints,
    guestRankingName,
    isAnonymousFirebaseUser,
    nextRecentReviewEventIds,
    reviewEventIdHash,
    reviewWordKeyHash,
} = require("./review-score-policy");
const REVIEW_WORD_KEY_HASHES = new Set(require("./review_word_hashes.json"));

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Cost Control: Limit instances to prevent billing spikes
setGlobalOptions({ maxInstances: 10 });

const TENIOHA_STRIPE_PAYMENT_LINK_ID = (process.env.TENIOHA_STRIPE_PAYMENT_LINK_ID || "").trim();
const TENIOHA_STRIPE_PRICE_ID = (process.env.TENIOHA_STRIPE_PRICE_ID || "").trim();
const TENIOHA_STRIPE_METADATA_APP = (process.env.TENIOHA_STRIPE_METADATA_APP || "tenioha-game").trim();
const TENIOHA_STRIPE_METADATA_KEY = (process.env.TENIOHA_STRIPE_METADATA_KEY || "app").trim();
const TENIOHA_STRIPE_PURCHASE_TYPE = (process.env.TENIOHA_STRIPE_PURCHASE_TYPE || "tenioha_premium").trim();
const DEFAULT_CHECKOUT_RETURN_URL = "https://tomtommark2.github.io/tenioha-game/";
const CHECKOUT_FUNCTION_REGION = "us-central1";
const PROMO_CODE_MAX_LENGTH = 128;
const REVIEW_AVATAR_IDS = new Set(["hero", "rose", "blue", "green", "violet", "auburn", "dog", "cat"]);
const ALLOWED_CHECKOUT_ORIGINS = new Set([
    "https://tomtommark2.github.io",
    "https://tenioha-game.web.app",
    "https://tenioha-game.firebaseapp.com",
]);

function getStripeClient() {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

function stripeEnvironment() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    if (secretKey.startsWith("sk_test_")) return "test";
    if (secretKey.startsWith("sk_live_")) return "live";
    return "unknown";
}

function stripeCustomerIdField() {
    const environment = stripeEnvironment();
    if (environment === "test") return "stripeCustomerIdTest";
    if (environment === "live") return "stripeCustomerIdLive";
    return "stripeCustomerId";
}

function isAllowedCheckoutOrigin(origin) {
    if (!origin || typeof origin !== "string") return false;
    if (ALLOWED_CHECKOUT_ORIGINS.has(origin)) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function setCheckoutCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (isAllowedCheckoutOrigin(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        res.set("Vary", "Origin");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function requestBody(req) {
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body) return JSON.parse(req.body);
    if (req.rawBody?.length) return JSON.parse(req.rawBody.toString("utf8"));
    return {};
}

function jstDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function reviewWeekKey(dateKey) {
    const date = new Date(`${dateKey}T12:00:00Z`);
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    return date.toISOString().slice(0, 10);
}

function normalizeReviewProfile(body, userRecord) {
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const fallbackName = (userRecord.name || "学習者").trim().slice(0, 8);
    const name = isAnonymousFirebaseUser(userRecord)
        ? guestRankingName(userRecord.uid)
        : (rawName || fallbackName).slice(0, 8);
    const avatarId = REVIEW_AVATAR_IDS.has(body.avatarId) ? body.avatarId : "hero";
    return { name, avatarId };
}

async function verifyRequestUser(req) {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
    if (!idToken) throw Object.assign(new Error("ログインが必要です。"), { status: 401 });
    return admin.auth().verifyIdToken(idToken);
}

function rejectNonPost(req, res) {
    setCheckoutCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return true;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return true;
    }
    return false;
}

class PromoCodeError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "PromoCodeError";
        this.status = status;
    }
}

function normalizedCheckoutReturnUrl(value) {
    try {
        const url = new URL(typeof value === "string" && value ? value : DEFAULT_CHECKOUT_RETURN_URL);
        if (!isAllowedCheckoutOrigin(url.origin)) return DEFAULT_CHECKOUT_RETURN_URL;
        if (url.origin === "https://tomtommark2.github.io" && !url.pathname.startsWith("/tenioha-game")) {
            return DEFAULT_CHECKOUT_RETURN_URL;
        }
        url.search = "";
        url.hash = "";
        return url.toString();
    } catch (error) {
        return DEFAULT_CHECKOUT_RETURN_URL;
    }
}

function checkoutResultUrl(returnUrl, status) {
    const separator = returnUrl.includes("?") ? "&" : "?";
    if (status === "success") {
        return `${returnUrl}${separator}checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    }
    return `${returnUrl}${separator}checkout=cancel`;
}

function checkoutLineItems() {
    if (!TENIOHA_STRIPE_PRICE_ID.startsWith("price_")) {
        throw new Error("TENIOHA_STRIPE_PRICE_ID is not configured.");
    }
    return [{ price: TENIOHA_STRIPE_PRICE_ID, quantity: 1 }];
}

async function stripeCustomerForUser(stripe, userRecord) {
    const userRef = db.collection("users").doc(userRecord.uid);
    const userSnapshot = await userRef.get();
    const userData = userSnapshot.exists ? userSnapshot.data() : {};
    const customerIdField = stripeCustomerIdField();
    const existingCustomerId = userData[customerIdField] || (stripeEnvironment() === "live" ? userData.stripeCustomerId : null);
    if (existingCustomerId) return existingCustomerId;

    const customer = await stripe.customers.create({
        email: userRecord.email || undefined,
        name: userRecord.displayName || undefined,
        metadata: {
            firebaseUid: userRecord.uid,
            app: TENIOHA_STRIPE_METADATA_APP,
        },
    });

    await userRef.set({
        email: userRecord.email || null,
        [customerIdField]: customer.id,
        ...(stripeEnvironment() === "live" ? { stripeCustomerId: customer.id } : {}),
        stripeEnvironment: stripeEnvironment(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return customer.id;
}

function matchesTeniohaCheckoutSession(session) {
    const paymentLinkId = typeof session.payment_link === "string"
        ? session.payment_link
        : (session.payment_link && session.payment_link.id) || "";
    const metadata = session.metadata || {};
    const metadataValue = metadata[TENIOHA_STRIPE_METADATA_KEY];
    const metadataApp = metadata.app || metadataValue;
    const purchaseType = metadata.purchaseType || metadata.productType || "";

    if (metadataApp === TENIOHA_STRIPE_METADATA_APP && purchaseType === TENIOHA_STRIPE_PURCHASE_TYPE) {
        return {
            matched: true,
            reason: "metadata",
            paymentLinkId,
            metadataKey: TENIOHA_STRIPE_METADATA_KEY,
            metadataValue: metadataApp,
            purchaseType
        };
    }

    if (TENIOHA_STRIPE_PAYMENT_LINK_ID && paymentLinkId === TENIOHA_STRIPE_PAYMENT_LINK_ID) {
        return {
            matched: true,
            reason: "payment_link",
            paymentLinkId,
            metadataKey: TENIOHA_STRIPE_METADATA_KEY,
            metadataValue: metadataApp,
            purchaseType
        };
    }

    return {
        matched: false,
        reason: "no_match",
        paymentLinkId,
        metadataKey: TENIOHA_STRIPE_METADATA_KEY,
        metadataValue: metadataApp,
        purchaseType
    };
}

async function activatePremiumFromCheckoutSession(session, eventType) {
    const match = matchesTeniohaCheckoutSession(session);
    const userId = session.client_reference_id;
    const paymentId = session.payment_intent;

    logger.info(`${eventType} received`, {
        sessionId: session.id,
        paymentStatus: session.payment_status || null,
        paymentLinkId: match.paymentLinkId || null,
        clientReferenceId: userId || null,
        metadataKey: match.metadataKey,
        metadataValue: match.metadataValue || null,
        purchaseType: match.purchaseType || null,
        matchReason: match.reason
    });

    if (!match.matched) {
        logger.warn(`Ignoring ${eventType} for non-tenioha purchase`, {
            sessionId: session.id,
            paymentLinkId: match.paymentLinkId || null,
            metadataKey: match.metadataKey,
            metadataValue: match.metadataValue || null,
            purchaseType: match.purchaseType || null,
            configuredPaymentLinkId: TENIOHA_STRIPE_PAYMENT_LINK_ID || null,
            expectedMetadataApp: TENIOHA_STRIPE_METADATA_APP,
            expectedPurchaseType: TENIOHA_STRIPE_PURCHASE_TYPE
        });
        return { ignored: true };
    }

    if (session.payment_status !== "paid") {
        logger.info("Checkout session is not paid yet. Premium activation deferred.", {
            sessionId: session.id,
            paymentStatus: session.payment_status || null,
            eventType
        });
        return { pending: true };
    }

    if (!userId) {
        logger.warn("No client_reference_id found in matched tenioha session.", {
            sessionId: session.id,
            paymentLinkId: match.paymentLinkId || null,
            matchReason: match.reason
        });
        return { missingUser: true };
    }

    const email = session.customer_details ? session.customer_details.email : null;
    await db.collection('users').doc(userId).set({
        email: email || null,
        isPremium: true,
        premiumSource: 'stripe',
        premiumMatchReason: match.reason,
        premiumSince: admin.firestore.FieldValue.serverTimestamp(),
        premiumExpiresAt: admin.firestore.Timestamp.fromDate(new Date("2125-01-01")),
        stripePaymentId: paymentId || null,
        stripeCheckoutSessionId: session.id,
        stripePaymentLinkId: match.paymentLinkId || null,
        stripePaymentStatus: session.payment_status || null,
        lastActivatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.info(`Successfully upgraded user ${userId}`, {
        sessionId: session.id,
        paymentLinkId: match.paymentLinkId || null,
        matchReason: match.reason,
        eventType
    });
    return { activated: true };
}

exports.createStripeCheckoutSession = onRequest({ region: CHECKOUT_FUNCTION_REGION }, async (req, res) => {
    setCheckoutCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    const stripe = getStripeClient();
    if (!stripe) {
        logger.warn("Stripe secret key missing for createStripeCheckoutSession.");
        res.status(503).json({ error: "Stripe is not configured." });
        return;
    }

    try {
        const body = requestBody(req);
        const authHeader = req.headers.authorization || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : body.idToken;
        if (!idToken) {
            res.status(401).json({ error: "Firebase ID token is required." });
            return;
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (isAnonymousFirebaseUser(decodedToken)) {
            res.status(403).json({ error: "購入にはGoogleログインが必要です。" });
            return;
        }
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        const customerId = await stripeCustomerForUser(stripe, userRecord);
        const returnUrl = normalizedCheckoutReturnUrl(body.returnUrl);
        const metadata = {
            app: TENIOHA_STRIPE_METADATA_APP,
            purchaseType: TENIOHA_STRIPE_PURCHASE_TYPE,
            firebaseUid: userRecord.uid,
        };

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer: customerId,
            client_reference_id: userRecord.uid,
            line_items: checkoutLineItems(),
            allow_promotion_codes: true,
            payment_method_types: ["card", "customer_balance"],
            payment_method_options: {
                customer_balance: {
                    funding_type: "bank_transfer",
                    bank_transfer: {
                        type: "jp_bank_transfer",
                    },
                },
            },
            metadata,
            payment_intent_data: {
                metadata,
            },
            success_url: checkoutResultUrl(returnUrl, "success"),
            cancel_url: checkoutResultUrl(returnUrl, "cancel"),
        });

        logger.info("Created tenioha Stripe Checkout Session.", {
            sessionId: session.id,
            uid: userRecord.uid,
            customerId,
            priceId: TENIOHA_STRIPE_PRICE_ID,
            environment: stripeEnvironment()
        });

        res.json({ url: session.url });
    } catch (error) {
        logger.error("Failed to create tenioha Stripe Checkout Session.", error);
        res.status(500).json({ error: "Failed to create checkout session." });
    }
});

exports.redeemTeniohaPromoCode = onRequest({ region: CHECKOUT_FUNCTION_REGION }, async (req, res) => {
    setCheckoutCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    try {
        const body = requestBody(req);
        const authHeader = req.headers.authorization || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : body.idToken;
        if (!idToken) {
            res.status(401).json({ error: "ログインが必要です。" });
            return;
        }

        const code = typeof body.code === "string" ? body.code.trim() : "";
        if (!code || code.length > PROMO_CODE_MAX_LENGTH) {
            throw new PromoCodeError("コードが無効か、期限切れです。");
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (isAnonymousFirebaseUser(decodedToken)) {
            throw new PromoCodeError("コードの適用にはGoogleログインが必要です。", 403);
        }
        const userRef = db.collection("users").doc(decodedToken.uid);
        const codeRef = db.collection("promocodes").doc(code);

        const result = await db.runTransaction(async (transaction) => {
            const [codeSnapshot, userSnapshot] = await Promise.all([
                transaction.get(codeRef),
                transaction.get(userRef),
            ]);

            if (!codeSnapshot.exists || codeSnapshot.data().active !== true) {
                throw new PromoCodeError("コードが無効か、期限切れです。");
            }

            const codeData = codeSnapshot.data();
            const currentCount = Number(codeData.redemptionCount || 0);
            const maxRedemptions = Number(codeData.maxRedemptions || 0);
            if (maxRedemptions > 0 && currentCount >= maxRedemptions) {
                throw new PromoCodeError("このコードの利用上限に達しました。");
            }

            const userData = userSnapshot.exists ? userSnapshot.data() : {};
            const redeemedCodes = Array.isArray(userData.redeemedCodes) ? userData.redeemedCodes : [];
            if (redeemedCodes.includes(code)) {
                throw new PromoCodeError("このコードは既に使用済みです。");
            }

            const configuredDuration = Number(codeData.durationDays || 30);
            const durationDays = Number.isFinite(configuredDuration) && configuredDuration > 0
                ? Math.floor(configuredDuration)
                : 30;
            const currentExpiry = userData.premiumExpiresAt && typeof userData.premiumExpiresAt.toMillis === "function"
                ? userData.premiumExpiresAt.toMillis()
                : 0;
            const now = Date.now();
            const baseTime = currentExpiry > now ? currentExpiry : now;
            const newExpiryTime = baseTime + (durationDays * 24 * 60 * 60 * 1000);

            transaction.set(userRef, {
                premiumExpiresAt: admin.firestore.Timestamp.fromMillis(newExpiryTime),
                premiumSource: "promo_code",
                lastActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                usedCode: code,
                redeemedCodes: admin.firestore.FieldValue.arrayUnion(code),
            }, { merge: true });
            transaction.update(codeRef, {
                redemptionCount: admin.firestore.FieldValue.increment(1),
            });

            return { newExpiryTime, durationDays };
        });

        logger.info("Redeemed tenioha promo code.", {
            uid: decodedToken.uid,
            durationDays: result.durationDays,
        });
        res.json(result);
    } catch (error) {
        if (error instanceof PromoCodeError) {
            res.status(error.status).json({ error: error.message });
            return;
        }
        if (error && error.code && String(error.code).startsWith("auth/")) {
            res.status(401).json({ error: "ログイン情報の確認に失敗しました。再ログインしてください。" });
            return;
        }
        logger.error("Failed to redeem tenioha promo code.", error);
        res.status(500).json({ error: "コードの適用に失敗しました。時間をおいて再度お試しください。" });
    }
});

exports.submitReviewScore = onRequest({ region: CHECKOUT_FUNCTION_REGION }, async (req, res) => {
    if (rejectNonPost(req, res)) return;

    try {
        const user = await verifyRequestUser(req);
        const body = requestBody(req);
        const wordKey = typeof body.wordKey === "string" ? body.wordKey.trim() : "";
        const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
        const outcome = typeof body.outcome === "string" ? body.outcome.trim() : "";
        const intervalDays = Math.round(Number(body.previousIntervalDays));

        if (
            !wordKey
            || wordKey.length > 240
            || !/^[a-zA-Z0-9._-]{8,96}$/.test(eventId)
            || !REVIEW_SCORE_OUTCOMES.has(outcome)
            || typeof body.isCorrect !== "boolean"
            || !REVIEW_SCORE_INTERVALS.has(intervalDays)
        ) {
            res.status(400).json({ error: "復習データが不正です。" });
            return;
        }
        if ((outcome === "incorrect") === body.isCorrect) {
            res.status(400).json({ error: "復習結果が不正です。" });
            return;
        }
        const pointsAwarded = calculateReviewEventPoints(outcome, intervalDays);
        if (pointsAwarded <= 0) {
            res.status(400).json({ error: "復習ポイントが不正です。" });
            return;
        }
        const wordHash = reviewWordKeyHash(wordKey);
        if (!REVIEW_WORD_KEY_HASHES.has(wordHash)) {
            res.status(400).json({ error: "登録されていない単語です。" });
            return;
        }
        const eventIdHash = reviewEventIdHash(eventId);

        // Offline events are credited on the server's current JST date.
        const earnedDate = jstDateKey();
        const profile = normalizeReviewProfile(body, user);
        const weekKey = reviewWeekKey(earnedDate);
        const eventRef = db.collection("review_score_events").doc(user.uid).collection("events").doc(`word-${wordHash}`);
        const dailyRef = db.collection("review_score_daily").doc(earnedDate).collection("users").doc(user.uid);
        const weeklyRef = db.collection("review_score_weekly").doc(weekKey).collection("users").doc(user.uid);
        const userRef = db.collection("users").doc(user.uid);

        const result = await db.runTransaction(async (transaction) => {
            const [eventSnapshot, dailySnapshot, weeklySnapshot] = await Promise.all([
                transaction.get(eventRef),
                transaction.get(dailyRef),
                transaction.get(weeklyRef),
            ]);

            const eventData = eventSnapshot.data() || {};
            const recentEventIds = nextRecentReviewEventIds(eventData.recentEventIds, eventIdHash);
            if (!recentEventIds) {
                return {
                    duplicate: true,
                    reason: "event-already-recorded",
                    pointsAwarded: 0,
                    todayPoints: Number(dailySnapshot.data()?.score || 0),
                    weekPoints: Number(weeklySnapshot.data()?.score || 0),
                };
            }

            const dailyScore = Number(dailySnapshot.data()?.score || 0);
            const weeklyScore = Number(weeklySnapshot.data()?.score || 0);
            const now = admin.firestore.FieldValue.serverTimestamp();

            transaction.set(eventRef, {
                recentEventIds,
                wordHash,
                lastEarnedDate: earnedDate,
                lastWeekKey: weekKey,
                outcome,
                isCorrect: body.isCorrect,
                previousIntervalDays: intervalDays,
                pointsAwarded,
                updatedAt: now,
                ...(!eventSnapshot.exists ? { createdAt: now } : {}),
            }, { merge: true });
            transaction.set(dailyRef, {
                score: dailyScore + pointsAwarded,
                updatedAt: now,
            }, { merge: true });
            transaction.set(weeklyRef, {
                name: profile.name,
                avatarId: profile.avatarId,
                score: weeklyScore + pointsAwarded,
                updatedAt: now,
            }, { merge: true });
            transaction.set(userRef, {
                reviewRankingName: profile.name,
                reviewAvatarId: profile.avatarId,
                reviewRankingUpdatedAt: now,
            }, { merge: true });

            return {
                duplicate: false,
                pointsAwarded,
                todayPoints: dailyScore + pointsAwarded,
                weekPoints: weeklyScore + pointsAwarded,
            };
        });

        res.json({ ...result, todayKey: earnedDate, weekKey });
    } catch (error) {
        const status = error.status || (String(error.code || "").startsWith("auth/") ? 401 : 500);
        logger.error("Review score submission failed.", { error: error.message, status });
        res.status(status).json({ error: status === 500 ? "復習スコアの送信に失敗しました。" : error.message });
    }
});

exports.updateReviewProfile = onRequest({ region: CHECKOUT_FUNCTION_REGION }, async (req, res) => {
    if (rejectNonPost(req, res)) return;

    try {
        const user = await verifyRequestUser(req);
        const body = requestBody(req);
        const profile = normalizeReviewProfile(body, user);
        if (!profile.name) {
            res.status(400).json({ error: "名前を入力してください。" });
            return;
        }

        const weekKey = reviewWeekKey(jstDateKey());
        const userRef = db.collection("users").doc(user.uid);
        const weeklyRef = db.collection("review_score_weekly").doc(weekKey).collection("users").doc(user.uid);
        await db.runTransaction(async (transaction) => {
            const weeklySnapshot = await transaction.get(weeklyRef);
            const now = admin.firestore.FieldValue.serverTimestamp();
            transaction.set(userRef, {
                reviewRankingName: profile.name,
                reviewAvatarId: profile.avatarId,
                reviewRankingUpdatedAt: now,
            }, { merge: true });
            if (weeklySnapshot.exists) {
                transaction.update(weeklyRef, {
                    name: profile.name,
                    avatarId: profile.avatarId,
                    updatedAt: now,
                });
            }
        });
        res.json({ success: true, ...profile });
    } catch (error) {
        const status = error.status || (String(error.code || "").startsWith("auth/") ? 401 : 500);
        logger.error("Review profile update failed.", { error: error.message, status });
        res.status(status).json({ error: status === 500 ? "プロフィールの更新に失敗しました。" : error.message });
    }
});

exports.mergeGuestReviewScore = onRequest({ region: CHECKOUT_FUNCTION_REGION }, async (req, res) => {
    if (rejectNonPost(req, res)) return;

    try {
        const registeredUser = await verifyRequestUser(req);
        if (isAnonymousFirebaseUser(registeredUser)) {
            res.status(403).json({ error: "Googleログインが必要です。" });
            return;
        }

        const body = requestBody(req);
        const guestIdToken = typeof body.guestIdToken === "string" ? body.guestIdToken.trim() : "";
        if (!guestIdToken || guestIdToken.length > 5000) {
            res.status(400).json({ error: "ゲスト情報が不足しています。" });
            return;
        }

        const guestUser = await admin.auth().verifyIdToken(guestIdToken);
        if (!isAnonymousFirebaseUser(guestUser) || guestUser.uid === registeredUser.uid) {
            res.status(400).json({ error: "ゲスト情報が不正です。" });
            return;
        }

        const todayKey = jstDateKey();
        const weekKey = reviewWeekKey(todayKey);
        const weeklyUsersRef = db.collection("review_score_weekly").doc(weekKey).collection("users");
        const dailyUsersRef = db.collection("review_score_daily").doc(todayKey).collection("users");
        const guestWeeklyRef = weeklyUsersRef.doc(guestUser.uid);
        const registeredWeeklyRef = weeklyUsersRef.doc(registeredUser.uid);
        const guestDailyRef = dailyUsersRef.doc(guestUser.uid);
        const registeredDailyRef = dailyUsersRef.doc(registeredUser.uid);
        const guestProfileRef = db.collection("users").doc(guestUser.uid);
        const registeredProfileRef = db.collection("users").doc(registeredUser.uid);
        const profile = normalizeReviewProfile(body, registeredUser);

        const result = await db.runTransaction(async (transaction) => {
            const [guestWeekly, registeredWeekly, guestDaily, registeredDaily, registeredProfile] = await Promise.all([
                transaction.get(guestWeeklyRef),
                transaction.get(registeredWeeklyRef),
                transaction.get(guestDailyRef),
                transaction.get(registeredDailyRef),
                transaction.get(registeredProfileRef),
            ]);
            const guestWeekPoints = Number(guestWeekly.data()?.score || 0);
            const registeredWeekPoints = Number(registeredWeekly.data()?.score || 0);
            const guestTodayPoints = Number(guestDaily.data()?.score || 0);
            const registeredTodayPoints = Number(registeredDaily.data()?.score || 0);
            const now = admin.firestore.FieldValue.serverTimestamp();
            const weekPoints = registeredWeekPoints + guestWeekPoints;
            const todayPoints = registeredTodayPoints + guestTodayPoints;
            const registeredWeeklyData = registeredWeekly.data() || {};
            const registeredProfileData = registeredProfile.data() || {};
            const mergedName = registeredWeeklyData.name
                || registeredProfileData.reviewRankingName
                || profile.name;
            const mergedAvatarId = REVIEW_AVATAR_IDS.has(registeredWeeklyData.avatarId)
                ? registeredWeeklyData.avatarId
                : REVIEW_AVATAR_IDS.has(registeredProfileData.reviewAvatarId)
                    ? registeredProfileData.reviewAvatarId
                    : profile.avatarId;

            if (guestWeekPoints > 0 || registeredWeekly.exists) {
                transaction.set(registeredWeeklyRef, {
                    name: mergedName,
                    avatarId: mergedAvatarId,
                    score: weekPoints,
                    updatedAt: now,
                }, { merge: true });
            }
            if (guestTodayPoints > 0 || registeredDaily.exists) {
                transaction.set(registeredDailyRef, {
                    score: todayPoints,
                    updatedAt: now,
                }, { merge: true });
            }
            transaction.set(registeredProfileRef, {
                reviewRankingName: mergedName,
                reviewAvatarId: mergedAvatarId,
                reviewRankingUpdatedAt: now,
            }, { merge: true });
            transaction.delete(guestWeeklyRef);
            transaction.delete(guestDailyRef);
            transaction.delete(guestProfileRef);

            return { guestWeekPoints, guestTodayPoints, weekPoints, todayPoints };
        });

        try {
            await admin.auth().deleteUser(guestUser.uid);
        } catch (error) {
            logger.warn("Merged guest score but could not delete anonymous Auth user.", {
                guestUid: guestUser.uid,
                error: error.message,
            });
        }

        logger.info("Merged anonymous review score into registered account.", {
            guestUid: guestUser.uid,
            registeredUid: registeredUser.uid,
            guestWeekPoints: result.guestWeekPoints,
            guestTodayPoints: result.guestTodayPoints,
        });
        res.json({ success: true, todayKey, weekKey, ...result });
    } catch (error) {
        const status = error.status || (String(error.code || "").startsWith("auth/") ? 401 : 500);
        logger.error("Guest review score merge failed.", { error: error.message, status });
        res.status(status).json({ error: status === 500 ? "ゲスト順位の引き継ぎに失敗しました。" : error.message });
    }
});

exports.getReviewLeaderboard = onRequest({ region: CHECKOUT_FUNCTION_REGION }, async (req, res) => {
    if (rejectNonPost(req, res)) return;

    try {
        let user = null;
        const authHeader = req.headers.authorization || "";
        if (authHeader.startsWith("Bearer ")) {
            user = await admin.auth().verifyIdToken(authHeader.slice("Bearer ".length));
        }

        const todayKey = jstDateKey();
        const weekKey = reviewWeekKey(todayKey);
        const usersRef = db.collection("review_score_weekly").doc(weekKey).collection("users");
        const topSnapshot = await usersRef.orderBy("score", "desc").limit(20).get();
        const results = topSnapshot.docs.map((snapshot, index) => {
            const data = snapshot.data();
            return {
                rank: index + 1,
                name: data.name || "学習者",
                avatarId: REVIEW_AVATAR_IDS.has(data.avatarId) ? data.avatarId : "hero",
                score: Number(data.score || 0),
                isMe: !!user && snapshot.id === user.uid,
            };
        });

        let me = null;
        let todayPoints = 0;
        if (user) {
            const dailyRef = db.collection("review_score_daily").doc(todayKey).collection("users").doc(user.uid);
            const [mySnapshot, dailySnapshot] = await Promise.all([
                usersRef.doc(user.uid).get(),
                dailyRef.get(),
            ]);
            todayPoints = Number(dailySnapshot.data()?.score || 0);
            if (mySnapshot.exists) {
                const myData = mySnapshot.data();
                const myScore = Number(myData.score || 0);
                const above = await usersRef.where("score", ">", myScore).count().get();
                me = {
                    rank: Number(above.data().count || 0) + 1,
                    name: myData.name || "学習者",
                    avatarId: REVIEW_AVATAR_IDS.has(myData.avatarId) ? myData.avatarId : "hero",
                    score: myScore,
                    isMe: true,
                };
            }
        }

        res.json({ todayKey, todayPoints, weekKey, results, me });
    } catch (error) {
        const status = String(error.code || "").startsWith("auth/") ? 401 : 500;
        logger.error("Review leaderboard fetch failed.", { error: error.message, status });
        res.status(status).json({ error: status === 500 ? "ランキングの取得に失敗しました。" : "ログイン情報を確認できませんでした。" });
    }
});

exports.stripeWebhook = onRequest(async (req, res) => {
    // 1. Signature Verification (Crucial for Security)
    // We need the STRIPE_WEBHOOK_SECRET env var.
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Fail closed so Stripe retries instead of marking an unprocessed purchase as delivered.
    if (!process.env.STRIPE_SECRET_KEY || !endpointSecret) {
        logger.error("Stripe keys missing. Refusing to acknowledge webhook delivery.");
        res.status(503).send("Stripe webhook is not configured.");
        return;
    }

    const stripe = getStripeClient();

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            endpointSecret
        );
    } catch (err) {
        logger.error(`Webhook Signature Verification Failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object;
        await activatePremiumFromCheckoutSession(session, event.type);
    } else if (event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object;
        logger.warn("Async tenioha Stripe payment failed.", {
            sessionId: session.id,
            clientReferenceId: session.client_reference_id || null,
            paymentStatus: session.payment_status || null,
            metadata: session.metadata || null
        });
    }

    res.json({ received: true });
});
