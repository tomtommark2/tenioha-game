# プロジェクト引継ぎ資料 (To: Next AI Agent)

このファイルは、AIエージェントがチャットを切り替えた際に、プロジェクトの文脈（コンテキスト）を即座に把握するための資料です。
**次のAI担当者は、作業開始前に必ずこのファイルを読んでください。**

## 1. プロジェクト概要
*   **名称:** 英単語学習クリッカーゲーム (Vocab Clicker Game)
*   **目的:** クリッカーゲーム形式で英単語を学習できるWebアプリ。
*   **現状:** Web版としてGitHub Pagesで運用中。PWA対応済み。

## 2. 技術スタック & 構成
*   **構成:** **モジュール分離構成 (Refactored v2.60)**
    *   **HTML:** `vocab_clicker_game.html` (Master), `index.html` (Replica for GitHub Pages)
    *   **JS (Core):**
        *   `js/version.js`: バージョン定義 (Universal Scope)
        *   `js/config.js`: 定数・設定値 (Global `window.GameConfig`)
        *   `js/utils.js`: 便利関数 (Global `window.GameUtils`)
    *   **JS (Logic):**
        *   `js/game_logic.js`: ゲームロジック (依存: Config, Utils)
        *   `js/ui_manager.js`: UI操作
        *   `js/firebase_app_v2.js`: クラウド連携 (Module)

## 3. 重要な開発ルール（絶対遵守）
1.  **HTML同期:** `vocab_clicker_game.html` を修正したら、必ず `index.html` にコピーすること。
2.  **読み込み順序 (超重要):**
    `version` -> `config` -> `utils` -> `chart_fallback` -> `game_logic` -> `ui_manager` -> `firebase_app_v2`
    ※この順序を守らないと `ReferenceError` でゲームが起動しません。
3.  **Service Worker (キャッシュの罠):**
    新しいJSファイルを追加したら、必ず `service_worker.js` の `ASSETS` 配列にも追加すること。
    忘れるとオフラインモードで新ファイルが見つからず壊れます。

## 4. 現在のステータス (v2.60 - 2026/01/19)
### 完了したリファクタリング (Phase 1)
*   **ファイル整理:** `js/config.js`, `js/utils.js` を新設し、`firebase_app.js` (Legacy) を `old/` に退避。
*   **バグ修正:** Cloud Syncのクラッシュ問題、Service Workerの更新不良問題を解決。
*   **安定化:** `game_logic.js` の分割はリスク過大のため**中止**。現状の構成で安定稼働中。


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

## 6. 次回の課題 (Pending Issues)
*   **(解消済み) 単語データの構造不整合:** v2.41にて正規化完了。

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
