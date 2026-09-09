# フレーズ品詞修復・第2回（2026-09-09）

追記：下記の分類残件3語は[第3回](phrase-pos-repairs-batch-03-2026-09-09.md)で修復済み。本文・画像は第2回時点の記録。

ローカル実装済み・未公開。第1回に続き **62語・89用法** の意味・フレーズ・例文を修復した。第1・2回の合計は78語・113用法。綴り・品詞ラベル・参照先・収録順・件数・学習履歴は変更していない。

## 何を直したか

| 対象 | 修正前 → 修正後の例 |
| --- | --- |
| sleep・動詞 | go to sleep → sleep well |
| mobile・名詞 | mobile phone → use your mobile |
| early・副詞 | early morning → get up early |
| left・形容詞 | turn left → the left hand（例文も修復） |
| being・動詞 | human being → is being careful（意味・例文も修復） |
| several・代名詞 | several people → several of them（意味・例文も修復） |
| human・名詞 | human rights → humans and animals（例文も修復） |
| bold・名詞 | bold type → in bold（意味欄の内部メモも除去） |

フレーズだけを差し替えず、同じ語の関連用法も確認した。誤文ではなくても語義や品詞が伝わりにくいものは、代表例として明確なものに変更した。細かい理由と完全な変更前後は[89用法の修正記録](vocabulary-changes/2026-09-09-phrase-pos-batch-02.json)。

## 抽出候補の判定

修正前の「異品詞で同一フレーズ54組＋名詞修飾候補37行」について、全91抽出項目に判定を付けた。同じ単語・用法の重複を含むので、91件の誤りを直したという意味ではない。[全判定記録](phrase-pos-decisions-2026-09-09.json)

- 第1・2回で修正した抽出項目：83項目。
- フレーズを保持：5例。`back of the room`、`silver ring`、`top of the mountain`、`round of applause`、`standard of living`。中心の名詞、または素材名の名詞修飾として成立する。standard は意味に「水準」を補足した。
- 品詞分類の見直しを残す：3組。下表を参照。

| 残件 | 表示内容だけで修復しない理由 |
| --- | --- |
| lot［代／名］ | 数量表現 a lot (of) 全体の働きと、lot 自身の品詞を混在させている。句を学習単位にするか、単語の品詞に統一するかの設計と旧キー互換性が必要。 |
| most［冠／形］ | 数量限定詞を「冠詞」と表示している分類を整理する必要がある。形容詞側の「最高の」という訳も同時に見直す。 |
| yeah［名／副］ | oh yeah は名詞の例ではない。辞書の副詞／間投詞の分類と照合し、旧名詞キーを含む移行を伴う修復が必要。 |

再抽出でも、異品詞同一フレーズはこの3組、名詞修飾候補は適合する5例となった。[修正後スクリーニング](phrase-pos-screening-2026-09-09-after-batch-02.json)。この抽出は二つの条件による候補検出であり、条件外を含む全8,018行の言語監修完了や、未知の誤りがないことを意味しない。

## 判断の根拠

- 英語参照スキルに従い『真・英文法大全』PDF p.113（後続構造）、p.520（動名詞と分詞）を参照。p.520の名詞同士の組合せについての説明は一般化せず、[Cambridgeの名詞修飾](https://dictionary.cambridge.org/grammar/british-grammar/noun-phrases-dependent-words)と区別した。
- 分類差のある語は個別に確認：[being](https://dictionary.cambridge.org/grammar/british-grammar/be-expressions-with-be)、[same](https://dictionary.cambridge.org/dictionary/english/same)、[such](https://www.collinsdictionary.com/dictionary/english/such)、[least](https://dictionary.cambridge.org/us/dictionary/english/least)、[bold](https://api.collinsdictionary.com/dictionary/english/bold)、[single](https://dictionary.cambridge.org/dictionary/english/single)、[oral](https://dictionary.cambridge.org/dictionary/english/oral)、[yeah](https://dictionary.cambridge.org/dictionary/english/yeah)。新しい例文は独自作成した。
- 名詞前の数量限定詞を形容詞として扱う既存の学習文法上の分類は維持した。「冠」の扱いや句全体と単語の分類の混在は別の残件である。

## 確認結果と再実行

- `npm run test:unit`：16件通過。変更記録との一致、表示フィールド以外が不変、全行の学習キー維持、91項目の判定漏れ、現データと再抽出結果の一致を確認。
- `npm run check:review-word-hashes`：10,719キー一致。
- 全13,505行をGit基準に照合し、差分は記録した先行8行＋第1回24行＋第2回89行のみ。
- `node node_modules/playwright/cli.js test tests/phrase-pos-repairs-visual.spec.js`：第1・2回とも通過。同じ品詞が複数ある場合も、元レベル・フレーズ・例文で用法を特定して表示を照合。
- 第2回は62語×1280px／390px＝124枚を保存。全画像が存在し、通常フォントの読み込みとカード境界外への文字はみ出しがないことを確認。being／short／least／last等のスマホ幅を目視確認した。物理スマートフォンでは未確認。
- [第2回の画像一覧](../screenshots/phrase-pos-repairs-2026-09-09-batch-02/index.html)／[画像manifest](../screenshots/phrase-pos-repairs-2026-09-09-batch-02/manifest.json)。旧レビュー画像は当時の静止画として保持する。
- 画像一覧の検索・62語の表示・画面幅切替・変更前後の展開もブラウザーテストで通過。
- 抽出の標準出力：`node scripts/audit-phrase-pos.js`。保存する場合は `--output docs/新しい名前.json` を指定する。既存ファイルを上書きしない仕様にした。元の監査JSONは修正前の証跡として維持する。
