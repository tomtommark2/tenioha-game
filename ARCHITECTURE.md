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
  - `js/game_logic.js`
  - `js/ui_manager.js`
  - `js/firebase_app_v2.js`

## Important Relationships

### 読み上げ設定（2026-09-16）

- 上部の音声アイコンから自動読み上げON/OFF・専用音量・試聴を操作。初期値ON・100%。スマホは下部パネル、380px以下ではレベル選択を2段目に配置。有料版のタイマーは枠ごと消える。
- `vocabGame_speechSettings` に端末保存し、クラウド同期・追加APIは使わない。OFFでも例文再生・試聴は可能。音量0%は発話しない。変更時は再生中・待機中の発話を中止する。
- ボイス変更UIは追加せず、既存の音声選択順位を保持。音質の実測評価や全端末での品質保証は行っていない。
- `tests/speech-settings.spec.js` は音量・保存・自動OFF・手動再生・発話待機キャンセル・無料/有料6画面幅・横向き・フォーカス復帰・閉じる操作を検証する。

- `index.html` is the editable source.
- `vocab_clicker_game.html` is a synchronized copy used by the manifest, service worker, tests, and some links.
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
