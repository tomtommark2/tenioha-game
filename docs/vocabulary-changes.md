# 語彙修正履歴

各項目の「未公開」は作業完了時点の記録。2026.0909.1335の公開チェック・手順は [運用記録](operations.md) を参照。

## 2026-09-09・全体点検後 第1回：7項目修正＋7語追加

- clarify・cheat・rise・present（形）・valid（後半の形容詞行）・identify（後半の動詞行）・guarantee（後半の動詞行）のフレーズ／例文を修復。別義・別品詞の混入と不完全な例文を解消し、既存の意味・品詞・キーは保持。
- 元CSVで確認したA1のeye／factory／tomato／expensive、B1のcheck-in counter／check-in desk、B2のfireplaceを各レベル末尾へ追加。旧行の配列インデックスは維持し、別帳のexpensiveは参照化・履歴統合しない。[変更前後・根拠・追加元](vocabulary-changes/2026-09-09-overview-batch-01.json)。
- 全13,512原データ行、主CEFR7,007カード。既存キー・統合グループと旧履歴削除対象は不変、新規キーは7個だけ。サーバー許可キーを10,726件へ再生成し、既存分の削除なし。
- 検証：単体23件、Functions16件、HTML／バージョン／許可キー同期に通過。Chromium／WebKit×幅390／1280pxで、参照先を含む30か所の表示・例文切替・読み上げ・保存復元・Undo・横はみ出しを確認。追加7語の正答保存と、別帳expensiveの履歴独立性も確認。クラウドは保存変換関数での往復検証で、本番接続ではない。
- 英語参考書チェックスキルで『真・英文法大全』PDF p.413と辞書を参照。画面記録なし・未公開。公開する際は、アプリに先行または同時に更新したFunctionsの許可リストを反映する必要がある。公開は別途明示依頼を受けて行う。
- 残りはA1の同レベル差分48行（主CEFR全体に見出しがないもの41行）。活用形・別綴り・除外意図を区別して扱う。句だけの例文全体の修復、似た用法の整理、旧監査スクリプトのキー仕様対応は未実施。

## 2026-09-09・仮例文修復 第8回（対象414行を完了）

残り55語55行のフレーズ・例文を修復し、`単語 example.` 形式は0件。意味・品詞・学習キーは維持。画面記録なし・未公開。[変更と根拠](vocabulary-changes/2026-09-09-placeholder-batch-08.json)／[最終結果](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・仮例文修復 第7回

50語50行のフレーズ・例文を修復。意味・品詞・学習キーは維持、残り55行。画面記録なし。[変更と根拠](vocabulary-changes/2026-09-09-placeholder-batch-07.json)／[進捗](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・仮例文修復 第6回

50語51行のフレーズ・例文を修復。意味・品詞・学習キーは維持、残り105行。画面記録なし。[変更と根拠](vocabulary-changes/2026-09-09-placeholder-batch-06.json)／[進捗](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・仮例文修復 第5回

50語55行のフレーズ・例文を修復。意味・品詞・学習キーは維持、残り156行。画面記録なし。[変更と根拠](vocabulary-changes/2026-09-09-placeholder-batch-05.json)／[進捗](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・仮例文修復 第4回

50語57行のフレーズ・例文を修復。学習キーと既存の意味・品詞は維持、残り211行。画面記録なし。[変更と根拠](vocabulary-changes/2026-09-09-placeholder-batch-04.json)／[進捗](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・仮例文修復 第3回

50語59行を追加修復、うち3行は訳も整理。学習キーは維持、残り268行。ユーザー指示により画像記録なし。[変更と根拠](vocabulary-changes/2026-09-09-placeholder-batch-03.json)／[進捗](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・仮例文修復 第2回

次の30語36行を修復。フレーズ・例文に加えてgalaxyの1行は訳も整理。学習キーは保持。合計60語87行を修復し、残り327行。[修復記録と残件](placeholder-example-repairs-2026-09-09.md)／[変更前後](vocabulary-changes/2026-09-09-placeholder-batch-02.json)。

## 2026-09-09・仮例文修復 第1回

独立項目の仮例文414行のうち、先頭30語と別帳の同語を合わせた51行を修復。品詞と語義を合わせたフレーズ・完全文に変更し、学習キーは保持。残り363行。[修復記録と残件](placeholder-example-repairs-2026-09-09.md)。

## 2026-09-09・品詞／所有格修復 第4回

22語26行を修復。latter・another・itsと冠詞の誤分類を整理し、全学習キー・統合済み履歴を保持。[修正概要と検証](phrase-pos-repairs-batch-04-2026-09-09.md)／[完全な変更前後](vocabulary-changes/2026-09-09-phrase-pos-batch-04.json)。

## 2026-09-09・フレーズ品詞修復 第3回

分類残件 lot／most／yeah の3語6行を修復。旧品詞をキー互換用に保持し、既存の統合済み学習履歴は維持。例文切替を1行の選択欄に変更し、画像を含む4幅・2ブラウザーの表示を確認。[修正概要・表示ログ・検証](phrase-pos-repairs-batch-03-2026-09-09.md)／[完全な前後記録](vocabulary-changes/2026-09-09-phrase-pos-batch-03.json)。

## 2026-09-09・フレーズ品詞修復 第2回

残りの抽出候補と関連用法を確認し、62語・89用法を追加修復。前回と合計78語・113用法。[修正概要・候補判定・残件・検証](phrase-pos-repairs-batch-02-2026-09-09.md)／[完全な前後記録](vocabulary-changes/2026-09-09-phrase-pos-batch-02.json)。

## 2026-09-09・フレーズ品詞修復 第1回

16語・24用法のフレーズ／意味／例文を修復。学習キー・履歴は維持。[修正一覧・根拠・検証・残件](phrase-pos-repairs-2026-09-09.md)／[完全な前後記録](vocabulary-changes/2026-09-09-phrase-pos-batch-01.json)。

## 2026-09-08・第1回：表示内容8項目

[修正前の監査](vocabulary-audit-2026-09-08.md)に基づく初回修復。ローカル実装済み・未公開。
綴り・品詞・参照先・収録順・件数は変更しない。意味・フレーズ・例文のみを修正する。
各表は変更したフィールドだけを表示。全フィールドの前後データは[変更記録JSON](vocabulary-changes/2026-09-08-batch-01.json)を参照。

### 1. marketplace［exam1・名］

別の単語 fireplace の内容が混入していたため、marketplace の意味・用例に修復。fireplace の欠落は別途対応。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 意味 | 【名】暖炉 | 【名】市場、売買の場 |
| フレーズ | lit fireplace | a busy marketplace |
| 例文 | Sit by the fireplace. | We bought fresh fruit at the marketplace. |

根拠：[辞書・用法資料](https://www.collinsdictionary.com/dictionary/english/marketplace)。変更した例文は独自作成。

### 2. feed［junior・名］

名詞の項目に動詞の意味・用例が入っていたため、動物用の餌を表す名詞へ修復。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 意味 | 餌をやる | 飼料、餌 |
| フレーズ | feed the dog | animal feed |
| 例文 | Don't forget to feed the cat. | The farmer bought feed for the chickens. |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/dictionary/english/feed)。変更した例文は独自作成。

### 3. excuse［junior・名］

名詞の項目に動詞 excuse の用例が入っていたため、名詞「言い訳」へ統一。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 意味 | 言い訳、許す | 言い訳、弁解 |
| フレーズ | excuse me | a poor excuse |
| 例文 | Excuse me, where is the station? | He gave a poor excuse for being late. |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/dictionary/english/excuse)。変更した例文は独自作成。

### 4. after［basic・副］

after school は前置詞用法。副詞の項目に合わせ、名詞を後ろに伴わない soon after へ修復。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 意味 | 後で | 後で、その後に |
| フレーズ | after school | soon after |
| 例文 | Let's meet after school. | She left at noon, and I left soon after. |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/grammar/british-grammar/after)。変更した例文は独自作成。

### 5. adult［basic・形］

名詞 an adult の例文を、形容詞 adult が learners を修飾する例文へ変更。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 例文 | He is an adult now. | The class is for adult learners. |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/dictionary/english/adult)。変更した例文は独自作成。

### 6. most［basic・副］

most people は名詞を伴う用法。副詞「最も」に合わせフレーズのみ修復。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| フレーズ | most people | like it most |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/grammar/british-grammar/most-the-most-mostly)。変更した例文は独自作成。

### 7. most［basic・代］

副詞「最も」の内容が混入していたため、代名詞用法の「大部分」へ修復。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 意味 | 最も | 大部分、多くの人（もの） |
| フレーズ | most people | most of the students |
| 例文 | Which color do you like most? | Most of the students arrived on time. |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/grammar/british-grammar/most-the-most-mostly)。変更した例文は独自作成。

### 8. latter［basic・代］

形容詞用法の例文と不適切な訳を、二つの選択肢の後者を指す the latter へ修復。

| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| 意味 | 後の方で、近頃の | 後者（二つのうち後に挙げた方） |
| フレーズ | in the latter part | choose the latter |
| 例文 | The latter part of the movie was very exciting. | We can go by bus or train. I prefer the latter. |

根拠：[辞書・用法資料](https://dictionary.cambridge.org/dictionary/english/latter)。変更した例文は独自作成。

## 確認と残件

- 英語資料参照スキルに従い、『真・英文法大全』PDF p.113 の副詞／前置詞の区別を参照。個別語義は上記辞書・文法資料で補完。
- `tests/vocabulary-content-repairs.unit.spec.js` で実データと前後記録の一致、変更フィールドの制限、全行の学習キー維持を検査する。
- 検証結果：`npm run test:unit` 9件通過、`npm run check:review-word-hashes` 10,719キー一致、`git diff --check` 通過。変更前のGitデータと全13,505行を照合し、変更は記録した8行のみ。実際の参照解決処理を通した学習キーも全行不変。
- 品詞そのものが疑わしい `latter［副］`、`yeah［名］`、`its` などは未修正。重複統合・表記ゆれ・欠落語の追加も今回には含めない。学習履歴への影響を検討する次の単位として切り分ける。
- 元の監査結果・集計JSONは修正後の値で上書きしない。

## 今後の記録方法

修正は小さな単位に分け、対象（レベル・綴り・品詞）、前後の完全な行データ、変更理由、参照資料、検証結果を残す。識別子変更は表示内容の修復と分けて記録する。
