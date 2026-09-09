# Data Workflow

## Source Data

- Runtime vocabulary dataset: `data/vocabulary.js`
- IPA overlay dataset: `data/ipa_overrides.js`
- CEFR CSV inputs at repo root are source materials, not runtime files

## Current Runtime Categories

- `junior` (`A1`)
- `basic` (`A2`)
- `daily` (`B1`)
- `exam1` (`B2`)

Additional wordbook datasets also exist:

- `exam2`
- `selection1400`
- `selection1900`
- `sys_2000`

`selection1400`, `selection1900`, and `sys_2000` are not the primary CEFR source layers. They rely heavily on word-level references into the main datasets.

## Learning-State Identity

- 収録補完は既存行の位置・キー・別帳の独立履歴を維持して末尾へ追加する。新規語は `npm run generate:review-word-hashes` と名詞制作キューの再生成・検証を行う。追加語の復習スコアにはFunctions側許可リストの公開反映も必要。[全体点検後の修復・追加](vocabulary-changes.md)。

- 単語帳の `単語 example.` 形式414行は修復完了（2026-09-09、残り0件）：[仮例文の修復](placeholder-example-repairs-2026-09-09.md)。その他の内容誤りの監修完了ではない。同綴りでも品詞・語義が異なるため、別帳への一括転記や参照化をしない。

- 品詞分類：冠詞は `a / an / the`。名詞を限定する数量表現は既存の「形」、人称代名詞の所有格は「代」＋意味欄の「所有格」で示す。[第4回修復・根拠](phrase-pos-repairs-batch-04-2026-09-09.md)。

- 現行データの重複・欠落・教材内容の監査: [2026-09-08 収録単語監査](vocabulary-audit-2026-09-08.md)。修正前に、統合候補と品詞対応の修復候補を区別する。
- 修正時は[語彙修正履歴](vocabulary-changes.md)に変更前後・理由・検証結果を残す。表示内容の修復と学習キーを変える修正は分ける。
- フレーズは「句全体」ではなく見出し語自身の品詞・対象語義・例文との整合を確認する。[2026-09-09 フレーズ品詞監査](phrase-pos-audit-2026-09-09.md)の候補件数を不良件数と混同しない。
- 抽出候補の最新状況は[全体点検後の再検査](phrase-pos-screening-2026-09-09-after-overview-01.json)。既知の分類残件3語は修復済み。抽出条件外の語義不一致は別途確認する。`node scripts/audit-phrase-pos.js` は標準出力、保存は `--output 新しいパス.json`。修正前の監査を上書きしない。

- 統合対象外の学習キーは参照先レベル・綴り・品詞を使う。主CEFR層の同綴り複数行は起動時に1枚に統合し、初級側の先頭行の既存キーを共用する。
- 統合カードの分類・正答率・SRS履歴は単語単位で一つ。詳細と移行・画像ログは [単語カード統合](word-grouping.md) を参照。
- Wordbook references share learning state with the matching entry in the primary CEFR layer.
- `word`・`pos`・`ref` の変更時はキー互換性を必ず検証する。品詞修復では `legacyKeyPos` に修正前の品詞を保持すれば既存キーを維持できる。表示・意味上の分類には使わない。IPAオーバーレイは旧品詞で照合する。キーが変わる変更には明示的な保存データ移行が必要。
- Legacy spelling-only keys are retained during the v2 key transition so existing progress can be copied without data loss.

## 単語カード統合（2026-09-09）

- 同じ綴りの複数品詞は1枚のカードにまとめ、正答率・復習履歴も単語単位で一つにする。主CEFR層の所属は初級側へ統一し、元の用法別レベルは保持する。
- 既存の発音記号・品詞・意味・フレーズ・例文を落とさない。表示案は `docs/experiments/word-grouping-preview/` を参照。
- 2026-09-09の最新指示：以後の語彙修復では画面提示・スクリーンショット保存・画像一覧作成は不要。内容・表示・操作の必要なテストは続け、変更理由と検証結果だけ最小限に残す。以前の画像ログは履歴として保持する。
- ユーザー承認により、統合対象の旧分類・SRS・回答履歴・旧間隔はバックアップを作らず削除し、未学習へ戻す。対象外の履歴・累積ポイント・獲得済み復習スコアは保持する。新しい履歴を再起動で消さないよう移行版を保存する。

## Content Scripts

Useful current scripts:

- `scripts/check_data.js`
- `scripts/check_data_v2.js`
- `scripts/check_counts.py`
- `scripts/check_vocab.py`
- `scripts/sync-html.js`
- `scripts/check-html-sync.js`
- `scripts/check-version-sync.js`

Special-purpose or historical scripts should only be used after reading them and confirming they still match the current dataset shape.

## Pronunciation Workflow

- Pronunciation notation is optional display data, not a required runtime field.
- Keep pronunciation data in `data/ipa_overrides.js` until a larger import pipeline is ready.
- Follow `docs/ipa-style-guide.md` for notation rules.
- Use American English as the default pronunciation standard.
- Prefer a Duolingo-like learner-facing IPA subset over textbook-specific notation systems.
- Prefer adding pronunciation data in small verified batches rather than bulk editing without review.

## Legacy Content Scripts

- `scripts/legacy_batches/` contains batch import helpers from earlier content expansion work.
- Keep them as historical reference unless you have verified they still match the current schema.

## Backups

- Do not keep ad hoc backup files such as `*.bak` in the tracked repo.
- If a backup contains useful history, move that knowledge into docs or git history instead.
