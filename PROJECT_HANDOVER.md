# プロジェクト引継ぎ資料 (To: Next AI Agent)

このファイルは、AIエージェントがチャットを切り替えた際に、プロジェクトの文脈（コンテキスト）を即座に把握するための資料です。
**次のAI担当者は、作業開始前に必ずこのファイルを読んでください。**

## 1. プロジェクト概要
*   **名称:** 英単語学習クリッカーゲーム (Vocab Clicker Game)
*   **目的:** クリッカーゲーム形式で英単語を学習できるWebアプリ。
*   **現状:** Web版としてGitHub Pagesで運用中。PWA対応済み。

## 2. 技術スタック & 構成
*   **構成:** **モジュール分離構成 (Refactoring Phase 1 Completed)**
    *   **HTML:** `vocab_clicker_game.html` (骨組みのみ), `index.html` (デプロイ用コピー)
    *   **CSS:** `style.css` (全スタイル定義)
    *   **JavaScript:**
        *   `js/game_logic.js`: ゲームのメインロジック、単語データ
        *   `js/firebase_app.js`: Firebase設定、Auth、ランキング、課金モーダル、設定関連
    *   外部ファイル: `data/vocabulary.js` (旧データ), `service_worker.js`, `manifest.json`, `scripts/qrcode.min.js`
*   **バックエンド:** Firebase
    *   **Firestore:** ユーザーデータ (`users`), ランキング (`leaderboard`), プロモコード (`promocodes`)
    *   **Auth:** Google認証
    *   **Analytics:** Google Analytics (v2.11以降稼働)

## 3. 重要な開発ルール（絶対遵守）
1.  **言語:** 会話、思考、計画はすべて **日本語** で行うこと。
2.  **デプロイ:** `vocab_clicker_game.html` を修正したら、必ず `index.html` にコピーし、GitHub (`git push`) へデプロイすること。
3.  **ユーザー体験:**
    *   **強制リロード禁止:** 更新が必要な場合でも、勝手にリロードせず、必ずダイアログ (`confirm` や Modal) でユーザーに同意を求めること。
    *   **デザイン:** モバイルファーストを意識。シンプルかつモダンなデザインを維持。
    *   **UI制御:** ボタン内のテキストやアイコンなどは `style.css` のクラス (`.pc-only` 等) で制御すること。JSによる `innerHTML` 強制書き換えは禁止（スパゲッティ化防止）。
4.  **バージョン管理 (厳守):**
    *   **常に更新:** 修正を加えた場合は、必ずバージョン番号を更新すること。
    *   **更新箇所:** `vocab_clicker_game.html` (Footer), `js/firebase_app.js` (`APP_VERSION` 定数) の2箇所。
    *   **形式:** `v2.xx` 形式で、小数点以下第2位を +1 する (例: v2.31 → v2.32)。
5.  **作業プロセス (厳守):**
    *   **提案ファースト:** いきなりコードを修正せず、まずは修正案や改善案を提示すること。
    *   **実行許可:** ユーザーから「実行して下さい」や「修正して下さい」と明示的に言われた場合にのみ、コードの改変を行うこと。

## 4. 現在のステータス (v2.36 - 2026/01/16)
### 実装済み機能
*   **PC版レイアウト修正 (v2.35 - v2.36):**
    *   カテゴリボタン（中学・基礎・単語帳等）のサイズを約15%縮小し、`style.css` で制御。
    *   ボタンコンテナ全体を右に10px移動 (`margin-right: -10px`)。
*   **PWAキャッシュ問題の完全解決 (v2.33 - v2.34):**
    *   PC版アプリで発生していたテキスト重複バグ（古いHTMLのキャッシュ残り）を解消するため、`service_worker.js` の `CACHE_NAME` を強制更新する運用フローを確立。
    *   文字化け修正（`js/firebase_app.js`）。
*   **「最新版への更新」ボタン修正 (v2.33):**
    *   リファクタリング時に消失していた `forceUpdateApp` 関数を再実装し、Service Workerの手動更新機能を復旧。
*   **UI微調整 (v2.32 - Phase 2):**
    *   ヘッダーアイコン位置の調整 (上へ10px移動)。
    *   「単語帳」ボタンのレスポンシブ化。JSによる強制書き換えを廃止。
*   **コードベース・リファクタリング (v2.31 - Phase 1):**
    *   **ファイル分離:** 巨大な `vocab_clicker_game.html` を `style.css`, `js/game_logic.js`, `js/firebase_app.js` に分割。保守性が大幅に向上。
    *   **注意:** `js/game_logic.js` と `js/firebase_app.js` は相互依存しており、これ以上の細分化（Phase 3）はリスクが高いため**凍結中**。現状の構成を維持すること。
*   **課金UIの改善 (v2.30):** 購入モーダルのデザインを修正。Note記事へのリンクを独立したボタン化し、ログイン推奨の警告メッセージを追加。
*   **Stripe Webhook連携 (v2.29):**
    *   **サーバー処理:** Firebase Cloud Functions にWebHook (`stripeWebhook`) を実装。
    *   **クライアント処理:** 購入リンクに `?client_reference_id` を付与。
*   **ランキング読み込み最適化 (v2.28):** クライアント側キャッシュ導入。

### 既知の仕様・注意点
*   **アプリ版のキャッシュ (重要):** PWAはキャッシュが非常に強いため、**アップデート時は必ず `service_worker.js` の `CACHE_NAME` のバージョン番号も更新すること**。これを忘れると、ユーザー側でHTML/JSの不整合（ボタン重複や古いクラス名の残留など）が発生します。
*   **リファクタリング方針:** これ以上のファイル分割（`ui.js`, `data.js`等への分離）は、複雑な依存関係によるバグ（デグレ）のリスクが高いため、**推奨されません**。現在の「3ファイル構成」が最適解と判断されています。
*   **【重要】Module Scopeの罠:** `js/firebase_app.js` は `type="module"` で読み込まれているため、トップレベルで定義した関数はグローバルスコープ (`window`) には公開されません。
    *   **NG:** `function myFunction() { ... }` → HTMLの `onclick="myFunction()"` で「未定義エラー」になる。
    *   **OK:** `window.myFunction = function() { ... }` → 明示的に `window` オブジェクトに代入すること。
    *   バグ報告「アイコンがクリックできない」の大半はこれが原因です。


## 5. ⚠️ アップデート手順 (Release Checklist) ⚠️
**コードを変更してリリースする際は、以下の手順を必ず守ってください。**
これを忘れると、ユーザー側で「更新されない」「404エラーが出る」等の不具合が発生します。

1.  **本体の更新:**
    *   `js/firebase_app.js`: `APP_VERSION` 定数を更新。
    *   `vocab_clicker_game.html`: フッターのバージョン表記を更新。
2.  **キャッシュ更新 (必須):** `service_worker.js` 内の `CACHE_NAME` を **同じバージョン番号** に書き換える。
    *   例: `const CACHE_NAME = 'vocab-clicker-v2.36';`
3.  **エントリーポイント同期 (必須):** `vocab_clicker_game.html` の内容を、**`index.html` に丸ごとコピー**する。
    *   GitHub Pagesのルートアクセス (`/`) 用に必要です。
    *   PowerShell推奨: `Get-Content -Path vocab_clicker_game.html -Raw | Set-Content -Path index.html -Encoding UTF8`
4.  **アップロード:** 全ての変更ファイル (`js/`, `css/` 含む) をコミット＆プッシュする。

## 6. 次回の課題 / Future Roadmap
### 構想: 学習管理システム (LMS)
*   **目的:** 塾や指導者が生徒の学習状況（習慣・量）を定量的に管理する。
*   **ターゲット:** 親、家庭教師、塾講師。
*   **機能案:**
    *   **生徒側:** 通常通りプレイするだけ（データはFirestoreに蓄積済み）。
    *   **先生側 (Manager):** 専用ダッシュボードでの生徒紐付け・閲覧。

### その他
*   **コード整理:** Phase 1 (ファイル分離) は完了。Phase 3 (コードダイエット) はリスク回避のため**見送り**。現状のクリーンな状態を維持する。

---
**Good Luck!**
