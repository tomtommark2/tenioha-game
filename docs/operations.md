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

## Prompting

- For complex requests, use the structure and templates in `docs/prompting-playbook.md`.
- Keep requests specific about outcome, success criteria, constraints, and output shape.
- Prefer outcome-first instructions over step-by-step process guidance unless the exact path matters.
- If output format matters, state it explicitly instead of relying on implication.

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

## Firestore Cost Checks

- Use `node scripts/inventory_firestore_storage.js --limit-docs 50000` to estimate current Firestore document volume by collection.
- Use `node scripts/compact_firestore_saves.js --limit 1000` as a dry-run before any cloud save compaction.
- Add `--execute` only after reviewing the dry-run output.
- `--delete-all-save-chunks` is only safe after the script confirms there are no users still using chunked cloud saves.
