const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Cost Control: Limit instances to prevent billing spikes
setGlobalOptions({ maxInstances: 10 });

const TENIOHA_STRIPE_PAYMENT_LINK_ID = (process.env.TENIOHA_STRIPE_PAYMENT_LINK_ID || "").trim();
const TENIOHA_STRIPE_METADATA_APP = (process.env.TENIOHA_STRIPE_METADATA_APP || "tenioha-game").trim();
const TENIOHA_STRIPE_METADATA_KEY = (process.env.TENIOHA_STRIPE_METADATA_KEY || "app").trim();
const TENIOHA_STRIPE_PURCHASE_TYPE = (process.env.TENIOHA_STRIPE_PURCHASE_TYPE || "tenioha_premium").trim();
const TENIOHA_CHECKOUT_PRODUCT_NAME = process.env.TENIOHA_CHECKOUT_PRODUCT_NAME || "てにをは英単語 プレミアム";
const TENIOHA_CHECKOUT_UNIT_AMOUNT = Number(process.env.TENIOHA_CHECKOUT_UNIT_AMOUNT || 1800);
const DEFAULT_CHECKOUT_RETURN_URL = "https://tomtommark2.github.io/tenioha-game/";
const CHECKOUT_FUNCTION_REGION = "us-central1";
const PROMO_CODE_MAX_LENGTH = 128;
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
    const configuredPriceId = process.env.TENIOHA_STRIPE_PRICE_ID;
    if (configuredPriceId) {
        return [{ price: configuredPriceId, quantity: 1 }];
    }
    return [{
        quantity: 1,
        price_data: {
            currency: "jpy",
            unit_amount: TENIOHA_CHECKOUT_UNIT_AMOUNT,
            product_data: {
                name: TENIOHA_CHECKOUT_PRODUCT_NAME,
            },
        },
    }];
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
            amount: TENIOHA_CHECKOUT_UNIT_AMOUNT,
            hasConfiguredPrice: Boolean(process.env.TENIOHA_STRIPE_PRICE_ID),
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
