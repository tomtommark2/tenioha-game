# Repo Inventory

## Keep

- Runtime app files: `index.html`, `vocab_clicker_game.html`, `style.css`, `js/`, `data/vocabulary.js`
- Deployment files: `firebase.json`, `firestore.rules`, `manifest.json`, `service_worker.js`, `functions/`
- Tests: `tests/`, Playwright configs
- Assets actually used by the app and hosted pages
- `thankyou_x9z2q5.html`

## Integrate Into Docs

- `AGENTS.md` knowledge moved into the standard doc set
- OpenClaw handover / sync guidance that still matches the code is now represented in:
  - `README.md`
  - `SETUP.md`
  - `ARCHITECTURE.md`
  - `docs/operations.md`
  - `docs/legacy-reference.md`

## Archive / Reference

- `.agent/`
- `old/`
- `js/old/`
- `scripts/legacy_batches/`
- `docs/archive/project-handover-legacy.md`

## Delete Candidate

- Generated caches such as `.firebase/hosting..cache`
- Backup files such as `data/vocabulary.js.bak`
- Windows ADS artifacts such as `*:Zone.Identifier`
- Untracked preview / scratch files that are not linked from the current app, after confirmation

Current known preview candidates:

- `design_preview_v1.html`

## Notes

- `vocab_clicker_game.html` is not legacy; it is still used by the manifest, service worker, tests, and links.
