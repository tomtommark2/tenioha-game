# Setup

## Prerequisites

- Node.js 20+ for app scripts and Playwright
- Python 3 for the local static server
- Firebase CLI if you deploy Hosting / Functions

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

## Firebase

- Hosting config: `firebase.json`
- Firestore rules: `firestore.rules`
- Functions source: `functions/index.js`
- Stripe webhook secrets are expected through Firebase Functions secrets / environment variables

## Notes

- `playwright.config.js` starts `local_server.py` automatically for E2E tests.
- `vocab_clicker_game.html` must stay synchronized with `index.html`.
