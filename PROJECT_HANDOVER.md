# プロジェクト引継ぎ資料 (To: Next AI Agent)

**⚠️⚠️ 重要: 作業を開始する前に、必ずこのファイル (`PROJECT_HANDOVER.md`) を熟読してください！ ⚠️⚠️**
**このファイルを読まずに作業を進めると、既存のルール（HTML同期やファイル構成）を破壊する恐れがあります。**

## 1. プロジェクト概要
*   **名称:** 英単語学習クリッカーゲーム (Vocab Clicker Game)
*   **目的:** クリッカーゲーム形式で英単語を学習できるWebアプリ。
*   **現状:** Web版としてGitHub Pages/Firebase Hostingで運用中。PWA対応済み。

## 2. 直近の開発内容 (v2.83 -> v2.84)

### ✅ 実装完了
1. **SRS/復習運用の安定化**
   * `reviewMode` を `on / random / off`（表示 `ON / MIX / OFF`）で運用。
   * 復習モードON時はカテゴリ選択をロックし、非直感的な操作を防止。
   * 復習キューは due ベースで出題（MIXは復習:新規=7:3サイクル）。

2. **学習状態分類の整理**
   * 分類は正答率ベースに統一:
     * `perfect >= 80%`
     * `learned 50-79%`
     * `weak < 50%`
   * 「初回一発正解語は復習キュー除外」ルールを維持。

3. **データ移行補正の強化（SRS schema v3）**
   * 移行時に履歴が薄い語の正答率を補正:
     * `learned` は最低 `1/2` 相当
     * `weak` は最低 `0/1`
     * `perfect` は履歴ゼロ時 `1/1`
   * 既存語で不自然に100%表示されるケースを緩和。

4. **UI/表示の調整**
   * 出題モード説明文を更新（復習キューの挙動説明を明示）。
   * 正答率タグを英単語カード右上に配置（四角寄り角丸デザイン）。
   * 不要になった分類基準文言（復習設定内）を削除。

5. **テスト基盤の安定化**
   * E2E回帰を強化（復習モード循環、ON/OFF挙動、閾値分類など）。
   * `test:unit` を専用設定 `playwright.unit.config.js` に分離し、`webServer` 起動を無効化。
   * `Address already in use`（ポート競合）を回避。

### ⚠️ 現在のステータス
* **Current Version**: `v2.84`
* **safe test**: `11 passed`（最新ユーザー実行結果）
* **運用ルール**:
  * `index.html` をマスター
  * `vocab_clicker_game.html` は同期コピー
  * 変更後は `sync:html` + `check:html-sync` + `test:e2e:safe`

## 3. 次のアクション (Next Steps)
1. **本番最終確認（実機）**
   * ON/MIX/OFFの体験、チュートリアル、タグ表示位置、復習キューの納得感を確認。
2. **軽量リファクタ**
   * `showNextWord` 周辺の責務分割（復習キュー選定・UI反映・状態遷移）。
3. **運用継続**
   * 変更時は `js/version.js` と `PROJECT_HANDOVER.md` を同時更新。

## 4. 技術スタック & 重要ルール
*   **HTML同期:** `index.html` (Master) -> `vocab_clicker_game.html` (Replica)。必ず同期すること。
*   **読み込み順序:** `version` -> `config` -> `utils` -> `game_logic` -> `ui_manager` -> `firebase_app_v2`。
*   **デザイン:** Premium & Rich AI Design。単純なUIはNG。

---
**Good Luck!**
