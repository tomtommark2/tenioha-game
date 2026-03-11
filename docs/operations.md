# Operations

## Standard Edit Flow

1. Edit `index.html` or the relevant JS / CSS file.
2. If `index.html` changed, run `npm run sync:html`.
3. Run `npm run check:html-sync`.
4. Run `npm run check:version-sync`.
5. Run the relevant tests.

## Versioning

- App version lives in `js/version.js`.
- HTML asset query strings are validated by `scripts/check-version-sync.js`.
- `npm run release:patch` bumps the patch version, syncs HTML, and runs the sync checks.

## Local Development

- Use `local_server.py` instead of a generic static server because it forces MIME types and disables caching.
- E2E tests expect `http://localhost:8000`.

## When HTML Changes

- `index.html` is the master file.
- `vocab_clicker_game.html` must remain byte-identical after sync.
- Current automation lives in `scripts/sync-html.js`; `.agent/workflows/sync_files.md` is legacy guidance only.

## Deployment-Sensitive Files

- `manifest.json`
- `service_worker.js`
- `firebase.json`
- `functions/index.js`

Change these carefully because they affect installability, caching, hosting, and payments.
