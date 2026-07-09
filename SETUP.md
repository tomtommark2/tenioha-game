# Setup

## Prerequisites

- Node.js 20+ for app scripts and Playwright
- Python 3 for the local static server
- Firebase CLI if you deploy Functions or Firestore rules

## Install

### App

```powershell
npm install
```

### Cloud Functions

```powershell
Set-Location functions
npm install
Set-Location ..
```

## Local Run

### Windows

```powershell
py -3 local_server.py
```

### macOS / Linux

```bash
python3 local_server.py
```

Open [http://localhost:8000/index.html](http://localhost:8000/index.html).

## Tests

```powershell
npm run test:unit
npm run test:e2e
npm run test:e2e:safe
```

`test:e2e:safe` runs the standard preflight checks before the browser suite.

## Deployment

- App UI is published by GitHub Pages from `main` at [https://tomtommark2.github.io/tenioha-game/](https://tomtommark2.github.io/tenioha-game/).
- Do not deploy the app UI to Firebase Hosting.
- Firebase is for Auth, Firestore, and Functions.

## Firebase

- Firestore rules: `firestore.rules`
- Functions source: `functions/index.js`
- Stripe webhook secrets are expected through Firebase Functions secrets / environment variables.
- Purchase checkout endpoint: `https://us-central1-tenioha-game.cloudfunctions.net/createStripeCheckoutSession`
- Stripe webhook endpoint: `https://us-central1-tenioha-game.cloudfunctions.net/stripeWebhook`
- Required Stripe webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
- Required Stripe metadata for new Checkout Sessions: `app=tenioha-game`, `purchaseType=tenioha_premium`
- Customer IDs are stored separately as `stripeCustomerIdTest` or `stripeCustomerIdLive` based on the Stripe secret key mode.

## Notes

- `playwright.config.js` starts `local_server.py` automatically for E2E tests.
- `vocab_clicker_game.html` must stay synchronized with `index.html`.
