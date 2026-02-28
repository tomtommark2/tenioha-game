# プロジェクト引継ぎ資料 (To: Next AI Agent)

**⚠️⚠️ 重要: 作業を開始する前に、必ずこのファイル (`PROJECT_HANDOVER.md`) を熟読してください！ ⚠️⚠️**
**このファイルを読まずに作業を進めると、既存のルール（HTML同期やファイル構成）を破壊する恐れがあります。**

## 1. プロジェクト概要
*   **名称:** 英単語学習クリッカーゲーム (Vocab Clicker Game)
*   **目的:** クリッカーゲーム形式で英単語を学習できるWebアプリ。
*   **現状:** Web版としてGitHub Pages/Firebase Hostingで運用中。PWA対応済み。

## 2. 直近の開発内容 (v2.82 -> v2.83)

### ✅ 実装完了・デプロイ済み
1.  **統計・学習カウントの修正 (v2.70)**:
    *   計算ロジックを `actionCounts` ベースに刷新し、学習回数の多重計上バグを修正。
2.  **Focus Leaderboard 表示バグ修正 (v2.77)**:
    *   **原因**: Firestore Security Rules の不備（サブコレクション `daily_logs` への書き込み権限不足）。
    *   **対応**: `firestore.rules` を修正し、認証ユーザーによる書き込みを明示的に許可。
3.  **シャッフルバッグ（山札）方式の導入 (v2.79)**:
    *   **目的**: 復習モード（苦手・完了）での同一単語の連続出題を防止。
    *   **仕組み**: 単語リストをシャッフルした「山札」を作成し、尽きるまでそこから出題。
4.  **カテゴリ・フィルタ分離の徹底 (v2.80)**:
    *   レベル変更やPOSフィルタ変更時に山札 (`gameState.decks`) をリセットする処理を追加し、カテゴリ混入バグを修正。

### ⚠️ 現在のステータス
*   **Current Version**: `v2.83`
*   **Firestore Rules**: v2.78で更新・適用済み。
*   **Hosting**: v2.81 適用済み（予定）。

## 3. 次のアクション (Next Steps)
1.  **v2.80 の本番動作確認**:
    *   ユーザーによる実機（スマホ等）での確認待ち。特に「山札機能」による連続出題の解消と、「カテゴリ分離」が正常か。
2.  **コードの整理 (Refactoring)**:
    *   `game_logic.js` が肥大化および複雑化しているため、クラス化やモジュール分割の検討が必要。
    *   特に `showNextWord` と新設の Shuffle Bag ロジックの分離推奨。

## 4. 技術スタック & 重要ルール
*   **HTML同期:** `index.html` (Master) -> `vocab_clicker_game.html` (Replica)。必ず同期すること。
*   **読み込み順序:** `version` -> `config` -> `utils` -> `game_logic` -> `ui_manager` -> `firebase_app_v2`。
*   **デザイン:** Premium & Rich AI Design。単純なUIはNG。

---
**Good Luck!**
