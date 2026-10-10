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
- `vocabGame_speechSettings` に端末保存し、クラウド同期・追加APIは使わない。OFFでも手動再生・試聴は可能。音量0%は発話しない。変更時は再生中・待機中の発話を中止する。
- 2026-10-06追加：英単語カード右上で単語だけを再生。「単語の再生ボタンを表示」で非表示にできる（既定ON、同じ端末設定の`showWordButton`に保存）。クリック・タップ・Enter・Spaceでは回答・採点せず、開始前／出題なしでは隠す。Undo／カード再作成後も適用し、自動読み上げOFFとは独立。手動再生は予約中の自動再生を取り消す。狭い画面の長い単語はカード内で折り返す。
- ボイス変更UIは追加せず、既存の音声選択順位を保持。音質の実測評価や全端末での品質保証は行っていない。
- `tests/speech-settings.spec.js` は音量・保存・自動OFF・手動再生・発話待機キャンセル・無料/有料6画面幅・横向き・フォーカス復帰・閉じる操作を検証する。

- `index.html` is the editable source.
- `vocab_clicker_game.html` is a synchronized copy used by the manifest, service worker, tests, and some links.
- `service_worker.js` caches both HTML entry points and core assets.
- `docs/review-system.md` defines the SRS cadence and review-score invariants.

## 学習カード・分類ヘッダー（2026-10-10）

- 分類は元のキャラの右側に一体型の面で配置。今日・週・順位はスマホで上の右寄せ、PC（769px以上）は従来のキャラ横の縦3段。768px以下では描画された足元を紫／白の170px境目に揃え、分類下端は168pxとして紫の2pxを残す。分類・復習ロック・ランキング・イラスト差替えのDOM IDと操作は維持する。
- 限定CSSは `header-m3e.css`。本・やり直し・チェック円・キラキラは公式Material Symbols Rounded。版番号管理とService WorkerにCSS／素材を登録。キャラクター原画・アニメーション設定は変更しない。
- 英単語は空白以外の塊を途中改行しないspanへ分け、表示幅に合わせ42〜24pxへ縮小。熟語は空白で折り返し、24pxでも入らない長い自作入力は先頭から横スクロール可能。出題・Undo・カード再作成、幅変更とフォント読込後に再計算し、学習キー・保存・配点・音声設定は変更しない。
- カードの品詞は上段中央、単語はカード中央、IPAはその下、復習理由は左上。復習理由の有無で位置を変えない。「英単語カード」の見出しは省略し、意味カードのハテナは公式Material Symbols Roundedを使う。短い語ではスクロールを出さず、実測180px超の長い複数語だけ縦スクロールにする。
- 初回案内は各カード下部の3項目と「説明を閉じる ×」だけ。上の共通見出しは置かず、旧DOM ID・公開関数を非表示で維持する。カード別の非表示は `vocabGame_cardTutorialDismissed`、表示済みは `vocabGame_cardTutorialSeen` に保存し、両方を閉じると従来の `vocabGame_skipLiveTutorial` と導入版 `2` も保存。既存利用者には再案内しない。`?tutorialPreview=1` は強制表示。学習・クラウド保存とは分離し、説明を閉じても回答しない。表示中はインストール通知を抑制する。
- 確認は `tests/header-m3e.spec.js`・`tests/word-text-layout.spec.js`、既存の復習案内・音声・自作語試験。公開対象の記録は `docs/experiments/header-layout-release-2026-10-10/review-notes.md`。

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
