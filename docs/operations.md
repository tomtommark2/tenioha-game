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

### 2026-09-09 公開チェック（2026.0909.2152）

- 対象：カード統合・例文見直しのお知らせ、ひとこと通知のお知らせ、A1の16語再配置とexcuseの入口／名詞発音の修復。新しい試作ピクトグラムは公開対象外。
- `feedback(us-central1)`を更新済み。指定WebhookはSecret Managerへ登録し、指定チャンネルへの接続テスト1件の作成を確認。本番一覧200・未認証投稿401を確認。実利用者としての投稿試験は行わない。
- `npm run test:e2e:safe`成功：単体24件・Functions18件・ブラウザー132件、HTML・版番号・許可キー同期。狭幅のお知らせとexcuseを目視確認。
- アプリはGitHub Pagesのmainへ反映する。Firestoreルール・決済・復習スコアFunctions・Firebase Hostingは変更しない。

### 2026-09-09 公開チェック（2026.0909.1335）

- 公開完了：`submitReviewScore(us-central1)` 更新成功後、`a4559b2` をmainへ反映。GitHub Pagesの [公開処理](https://github.com/tomtommark2/tenioha-game/actions/runs/34312158522) 成功を確認。本番13ファイルが公開コミットとバイト一致し、幅390pxの独立ブラウザーで版番号・追加7語・主CEFR7,007カード・expensiveの実表示を確認（page errorなし）。本番回答・保存・決済は実行していない。サーバーGETは仕様どおり405。
- 対象：設定入口と復習案内、891語のカード統合、100語分の名詞イラスト（97画像）、語彙・品詞・フレーズ修復、仮例文414行の解消、基本語7語の追加。
- 単体23件・Functions16件・ブラウザー130件・モバイル18件を確認。全体実行時の制作一覧テスト1件は旧件数4,571を期待して失敗したため、追加後の4,577へ修正して対象テストを再実行し成功。HTML・バージョン・許可キー10,726件の同期も確認。
- 再実行はファイル名／テスト名を明示する。`test:e2e:safe -- --last-failed` は前段の単体テストが失敗一覧を上書きし、対象なしになるため使わない。
- 公開順序：`functions:submitReviewScore` の許可リストを先に更新し、GitHub Pagesのmainへ反映する。決済・他のFunctions・Firestoreルール・Firebase Hostingは変更しない。
- 試作動画・スプライト・制作プレビュー・未採用画像はローカルに保持し、今回の公開対象に含めない。

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
- 閉じた直後に別のモーダルを開く場合も、非同期の履歴後退が終わった時点で表示中モーダルの履歴層を復元する。WebKitで次の「戻る」がアプリ外へ遷移しないことを確認する。全体E2Eとモバイルテストは、共有ローカルサーバーの終了が干渉するため別々に実行する。

## Deployment-Sensitive Files

- `manifest.json`
- `service_worker.js`
- `firebase.json`
- `functions/index.js`

Change these carefully because they affect installability, caching, backend services, and payments.

## メンバーシップ用コード

- アプリ内コードはFirestoreの `promocodes/{code}` で管理する。Stripeの割引コードとは別物。コードは前後の空白のみ除去され、大文字小文字を区別する。
- 現行APIが参照する設定は `active`、`durationDays`、`maxRedemptions`、`redemptionCount`。登録は既存ドキュメントを上書きしない作成操作を使い、作成後に再読取する。配布コードそのものは公開リポジトリに記録しない。
- 付与日数は利用時点（既存のプレミアム期限が未来ならその期限）から加算する。同じ利用者は同じコードを再利用できない。`maxRedemptions` の未設定／0は総利用回数の上限なし。
- 現行APIには月末などの受付期限チェックがない。月名だけで自動失効するわけではないため、月次コード作成時は付与日数・総利用上限・受付終了の扱いを確認する。`expiresAt` を保存するだけでは失効しない。

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
