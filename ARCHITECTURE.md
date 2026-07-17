# Architecture

## Runtime Shape

This is a static web app with Firebase-backed features.

- Primary authoring entry: `index.html`
- Public replica / start URL: `vocab_clicker_game.html`
- Styling: `style.css`
- Vocabulary data: `data/vocabulary.js`
- Client modules:
  - `js/version.js`
  - `js/config.js`
  - `js/utils.js`
  - `js/stats_engine.js`
  - `js/game_logic.js`
  - `js/ui_manager.js`
  - `js/firebase_app_v2.js`

## Important Relationships

- `index.html` is the editable source.
- `vocab_clicker_game.html` is a synchronized copy used by the manifest, service worker, tests, and some links.
- `learning_log_preview.html` is embedded by `index.html` and `vocab_clicker_game.html`.
- `service_worker.js` caches both HTML entry points and core assets.
- `docs/review-system.md` defines the SRS cadence and review-score invariants.

## Firebase Surface

- `functions/index.js`: Stripe webhook and premium activation logic
- `firebase.json`: Hosting, Functions, Firestore rules wiring
- `firestore.rules`: data access rules

## Test Surface

- `tests/unit.spec.js`: VM-based logic tests for JS modules
- `tests/smoke.spec.js`: Playwright browser smoke tests
- `playwright.config.js`: browser tests with local web server
- `playwright.unit.config.js`: unit subset without local server

## Legacy Areas

These are not the source of truth:

- `.agent/`
- `old/`
- `js/old/`
- `scripts/legacy_batches/`

See `docs/legacy-reference.md` for handling rules.
