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

- `illustrated`（イラスト単語帳）は `data/word-illustrations.js` に登録済みの名詞だけを起動時に抽出する。新しい履歴キーは作らず、統合前提の元カードのキーを共有する。名詞用法だけを表示し、この単語帳の復習も収録語に限る。画像を登録すると一覧へ自動で加わる。
- 「単語帳 → イラスト単語帳」で画像・語・意味を一覧表示し、各語または「学習する」から出題へ移る。出題時は絵を隠し、意味カード右上の「イラスト」で回答前にも現在の絵を表示できる（未収録語ではボタン非表示）。「前の絵」は直前の回答済み語を同じキャラ枠へ表示し、「イラスト」で現在の絵へ切り替える。表示中の絵をタップすると拡大する。前の絵は未収録語の回答、Undo、単語帳切替・再読込で消え、現在の未回答語と同じキーなら「前の絵」を隠す。
- 表示切替で画面を上下させないため、意味カードは表裏を同じグリッド領域へ置き、未回答の意味は `visibility: hidden` で領域だけ確保する。「前の絵」も非表示時の領域を保持する。キャラ／画像は元から同じ固定枠を使う。`tests/illustration-layout.spec.js` で位置・高さと回答前の非表示を検証する。
- 「前の絵」「戻る」は横並びの高さ44pxとし、各操作のタップ領域も44px以上を保つ。イラストの閲覧の有無で採点を変えず、正解／不正解は本人の自己申告に委ねる。閲覧による減点・自動不正解・練習扱い・成績除外は設けず、正答率・完璧判定・復習スコア・復習間隔は通常の回答と同じ処理にする。
- 2026-09-10：作成済みピクトグラム新版50枚へ順次切替を開始。共用表記（airplane/aeroplane、bicycle/bike）を含む52語が新版、残り48語は既存版を保持。原画・旧画像・語義・学習キーは変更しない。[今回の対応表](experiments/noun-production/pictogram-rollout-01/sources.json)／[可逆変換の検証](experiments/noun-production/pictogram-rollout-01/encoding.json)。

- 収録補完は既存行の位置・キー・別帳の独立履歴を維持して末尾へ追加する。新規語は `npm run generate:review-word-hashes` と名詞制作キューの再生成・検証を行う。追加語の復習スコアにはFunctions側許可リストの公開反映も必要。[全体点検後の修復・追加](vocabulary-changes.md)。

- 単語帳の `単語 example.` 形式414行は修復完了（2026-09-09、残り0件）：[仮例文の修復](placeholder-example-repairs-2026-09-09.md)。その他の内容誤りの監修完了ではない。同綴りでも品詞・語義が異なるため、別帳への一括転記や参照化をしない。

- 品詞分類：冠詞は `a / an / the`。名詞を限定する数量表現は既存の「形」、人称代名詞の所有格は「代」＋意味欄の「所有格」で示す。[第4回修復・根拠](phrase-pos-repairs-batch-04-2026-09-09.md)。

- 現行データの重複・欠落・教材内容の監査: [2026-09-08 収録単語監査](vocabulary-audit-2026-09-08.md)。修正前に、統合候補と品詞対応の修復候補を区別する。
- A1と上位にまたがる297語の[レベル一次点検](a1-merged-level-audit-2026-09-09.md)：元A1 CSVにない64語と、基本語に集約された上位語義を区別。64語は誤配置確定数ではない。
- B1/B2由来の[A1統合160語の一次分類](a1-b1-b2-review-160-2026-09-09.md)を経て、[16語の所属・excuseの入口を修復](a1-level-repair-01-2026-09-09.md)。履歴キーを維持し、残り10候補は保留。発展表示は未実装で、元レベルだけで発展扱いにせず、重複用法と内容不一致を先に区別する。
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
