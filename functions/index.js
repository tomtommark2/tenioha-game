const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Cost Control: Limit instances to prevent billing spikes
setGlobalOptions({ maxInstances: 10 });

// Initialize Stripe (Wait for Key)
// Note: STRIPE_SECRET_KEY will be set via environment variables later
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
// For now, we'll initialize it inside the function or assume access.
// Actually, standard practice is:
// const stripe = require('stripe')(functions.config().stripe.secret); 
// But in v2 (or modern setup), we use process.env via `firebase functions:secrets:set`.
// For deployment *now*, we'll use a placeholder or assume config is coming.
// Let's use standard `require('stripe')` structure but prompt user for keys later.

const TENIOHA_STRIPE_PAYMENT_LINK_ID = (process.env.TENIOHA_STRIPE_PAYMENT_LINK_ID || "").trim();
const TENIOHA_STRIPE_METADATA_APP = (process.env.TENIOHA_STRIPE_METADATA_APP || "tenioha-game").trim();
const TENIOHA_STRIPE_METADATA_KEY = (process.env.TENIOHA_STRIPE_METADATA_KEY || "app").trim();

function matchesTeniohaCheckoutSession(session) {
    const paymentLinkId = typeof session.payment_link === "string"
        ? session.payment_link
        : (session.payment_link && session.payment_link.id) || "";
    const metadata = session.metadata || {};
    const metadataValue = metadata[TENIOHA_STRIPE_METADATA_KEY];

    if (metadataValue && metadataValue === TENIOHA_STRIPE_METADATA_APP) {
        return {
            matched: true,
            reason: "metadata",
            paymentLinkId,
            metadataKey: TENIOHA_STRIPE_METADATA_KEY,
            metadataValue
        };
    }

    if (TENIOHA_STRIPE_PAYMENT_LINK_ID && paymentLinkId === TENIOHA_STRIPE_PAYMENT_LINK_ID) {
        return {
            matched: true,
            reason: "payment_link",
            paymentLinkId,
            metadataKey: TENIOHA_STRIPE_METADATA_KEY,
            metadataValue
        };
    }

    return {
        matched: false,
        reason: "no_match",
        paymentLinkId,
        metadataKey: TENIOHA_STRIPE_METADATA_KEY,
        metadataValue
    };
}

exports.stripeWebhook = onRequest(async (req, res) => {
    // 1. Signature Verification (Crucial for Security)
    // We need the STRIPE_WEBHOOK_SECRET env var.
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // If secrets aren't set yet (initial deploy), just return 200 to confirm endpoint exists
    if (!process.env.STRIPE_SECRET_KEY || !endpointSecret) {
        logger.warn("Stripe Keys missing. Waiting for configuration.");
        res.status(200).send("Endpoint ready. Please configure keys.");
        return;
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    // 2. Handle Event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const match = matchesTeniohaCheckoutSession(session);

        logger.info("checkout.session.completed received", {
            sessionId: session.id,
            paymentLinkId: match.paymentLinkId || null,
            clientReferenceId: session.client_reference_id || null,
            metadataKey: match.metadataKey,
            metadataValue: match.metadataValue || null,
            matchReason: match.reason
        });

        if (!match.matched) {
            logger.warn("Ignoring checkout.session.completed for non-tenioha purchase", {
                sessionId: session.id,
                paymentLinkId: match.paymentLinkId || null,
                metadataKey: match.metadataKey,
                metadataValue: match.metadataValue || null,
                configuredPaymentLinkId: TENIOHA_STRIPE_PAYMENT_LINK_ID || null,
                expectedMetadataApp: TENIOHA_STRIPE_METADATA_APP
            });
            res.json({ received: true, ignored: true });
            return;
        }

        // Extract User ID from Client Reference ID
        // Note: You must update your client-side Stripe link to include `client_reference_id: userId`
        const userId = session.client_reference_id;
        const paymentId = session.payment_intent;

        if (userId) {
            logger.info(`Processing Premium Upgrade for User: ${userId}`);

            try {
                // 3. Update Firestore
                await db.collection('users').doc(userId).set({
                    isPremium: true,
                    premiumSource: 'stripe',
                    premiumSince: admin.firestore.FieldValue.serverTimestamp(),
                    premiumExpiresAt: admin.firestore.Timestamp.fromDate(new Date("2125-01-01")), // ~100 years
                    stripePaymentId: paymentId,
                    stripeCheckoutSessionId: session.id,
                    stripePaymentLinkId: match.paymentLinkId || null,
                    lastActivatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                logger.info(`Successfully upgraded user ${userId}`, {
                    sessionId: session.id,
                    paymentLinkId: match.paymentLinkId || null,
                    matchReason: match.reason
                });
            } catch (e) {
                logger.error(`Firestore Update Failed for ${userId}:`, e);
                // Don't error 500 here, or Stripe will retry indefinitely. 
                // Maybe log manual intervention needed.
            }
        } else {
            logger.warn("No client_reference_id found in matched tenioha session.", {
                sessionId: session.id,
                paymentLinkId: match.paymentLinkId || null,
                matchReason: match.reason
            });
        }
    }

    res.json({ received: true });
});
