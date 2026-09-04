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
- Versions use the related apps' deployment timestamp format: `YYYY.MMDD.HHMM`.
- `npm run release:version` generates the local timestamp, updates asset queries, syncs HTML, and runs the sync checks.
- `npm run release:patch` remains as a compatibility alias.

## Deployment Targets

- Production app UI: GitHub Pages, served from `main` at [https://tomtommark2.github.io/tenioha-game/](https://tomtommark2.github.io/tenioha-game/).
- Firebase: backend only for Auth, Firestore, and Functions.
- Do not deploy the app UI to Firebase Hosting. Hosting has been disabled for the `tenioha-game` Firebase project.
- For backend changes, prefer explicit deploy targets such as `npx firebase deploy --only functions --project tenioha-game` or `npx firebase deploy --only firestore:rules --project tenioha-game`.

## Local Development

- Use `local_server.py` instead of a generic static server because it forces MIME types and disables caching.
- E2E tests expect `http://localhost:8000`.
- Firebase Analytics is disabled automatically on `localhost` and `127.0.0.1`.

## Screenshot Workflow

- Save temporary visual-check screenshots under `screenshots/`.
- Link only necessary images in chat, using absolute paths with `/` separators.
- For large comparisons, show representative images and list the rest by filename.
- When asked to delete unnecessary screenshots, remove unneeded files under `screenshots/`.
- Move only long-term reference images into `docs/`.
- Keep `screenshots/` out of Git.

## Prompting

- For complex requests, use the structure and templates in `docs/prompting-playbook.md`.
- Keep requests specific about outcome, success criteria, constraints, and output shape.
- Prefer outcome-first instructions over step-by-step process guidance unless the exact path matters.
- If output format matters, state it explicitly instead of relying on implication.

## When HTML Changes

- `index.html` is the master file.
- `vocab_clicker_game.html` must remain byte-identical after sync.
- Current automation lives in `scripts/sync-html.js`; `.agent/workflows/sync_files.md` is legacy guidance only.

## Modal Dismissal

- Non-blocking modal screens must close from their close control, backdrop tap, Escape, and browser/device Back without leaving the app page.
- Close controls keep at least a 44 x 44 CSS-pixel touch target, move focus into the modal on open, and restore focus on close.
- `trialOverlay` and `forceUpdateModal` are intentionally blocking. Run `npm run test:mobile-modals` for the focused Chromium and WebKit checks.

## Deployment-Sensitive Files

- `manifest.json`
- `service_worker.js`
- `firebase.json`
- `functions/index.js`

Change these carefully because they affect installability, caching, backend services, and payments.

## Firestore Cost Checks

- Use `node scripts/inventory_firestore_storage.js --limit-docs 50000` to estimate current Firestore document volume by collection.
- Use `node scripts/compact_firestore_saves.js --limit 1000` as a dry-run before any cloud save compaction.
- Add `--execute` only after reviewing the dry-run output.
- `--delete-all-save-chunks` is only safe after the script confirms there are no users still using chunked cloud saves.

## Cloud Save Consistency

- `users/{uid}.saveRevision` is the optimistic-lock revision for cloud saves. Existing documents without it start at revision `0`.
- Automatic saves stop when another device advances the revision; they never silently overwrite that device's data.
- A manual save shows an overwrite confirmation when the revision changed or the cloud score is higher.
- Chunked saves write a new immutable generation first, then atomically switch the parent manifest. A generation that loses the revision race is deleted, and successful saves delete only the previous manifest's generation.
- Orphan chunks older than 24 hours are cleaned at most once per user per day, with a bounded five-page loop; the active generation is always excluded.
- 保存データのない端末でGoogleログインした場合は、初期化時に作られた空のローカル保存の時刻を無視し、既存のクラウド保存を自動復元する。ログイン前に実際の学習履歴が作られた場合は自動上書きしない。
- 初回のクラウド読取に失敗した場合は自動保存を開始せず、空または古いローカルデータによるクラウド上書きを防ぐ。
