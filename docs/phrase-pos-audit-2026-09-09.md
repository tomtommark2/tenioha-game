# フレーズと品詞の適合性監査（2026-09-09）

最新状況：分類残件の3語も[第3回修復](phrase-pos-repairs-batch-03-2026-09-09.md)で修復済み。以下は各時点の記録を保持する。

追記：以下は修正前の監査記録。ユーザー承認後、既知16項目と関連用法を[第1回修復（16語・24用法）](phrase-pos-repairs-2026-09-09.md)でローカル修正した。全候補の監修は未完了。

第2回追記：元の全91抽出項目の判定は[第2回修復・判定記録](phrase-pos-repairs-batch-02-2026-09-09.md)で完了。分類変更を伴う3組は未修復。抽出条件外も含む全語彙の監修完了ではない。

## 結論

`adult ticket` は英語表現そのものを誤りとする必要はないが、「名詞 adult＝大人」を示す代表フレーズとしては採用しない。形容詞の「大人向けの」と自然に解釈でき、名詞用法の学習例として曖昧だからである。名詞は `two adults` など、adult 自身が名詞だと分かる例を選ぶ。形容詞側の既存 `adult education` は辞書にもある用例である。

- [Collins adult](https://www.collinsdictionary.com/us/dictionary/english/adult) は「大人の／大人向けの」を形容詞として扱い、adult education も形容詞用例に挙げる。adult ticket の分析はこの語義に基づく今回の判断であり、辞書がその語句そのものを品詞判定したという意味ではない。
- 名詞が名詞を修飾する構造もあるため、「名詞の前だから必ず形容詞」「日本語で『～の』と訳せるから形容詞」とは判断しない。[Cambridge：名詞句の修飾語](https://dictionary.cambridge.org/grammar/british-grammar/noun-phrases-dependent-words)
- ただし、**句全体が名詞句であることと、見出し語自身が名詞であることは別**。教材では後者を検証する。文法的に成立する解釈を探すことと、品詞を明確に学べる代表例を選ぶことを区別する。

前回の891語統合では表示・用法データの保持・履歴移行を検証したが、全フレーズの品詞・語義適合性までは監修していなかった。今回の問題は原データの `phrase` に存在し、統合描画が別品詞のフレーズへ付け替えたものではない。教材品質の確認漏れとして扱う。

## 確認範囲と限界

- 主CEFRの原データ8,018行を機械スクリーニングした。全8,018行を辞書照合して合否判定したわけではない。
- 異なる品詞で完全一致のフレーズを共用するもの：54組。これは**誤り54件という意味ではない**。省略された文脈や品詞分類の差がある場合を含む。
- 形容詞としても収録され、名詞行のフレーズが見出し語から始まる候補：37行。`back of the room` のような適切な名詞用法も含むため、これも不良件数ではない。
- 候補の原文・元レベル・配列位置は [機械抽出結果](phrase-pos-screening-2026-09-09.json)。`node scripts/audit-phrase-pos.js` で再生成できる。
- 以下は候補等を重点確認した一次判定。単語帳独自の全フレーズ、全候補の最終合否、全例文の自然さは未完了。今回は実行データ・画面・学習履歴を変更していない。

## 代表的な明確な不一致

判定は現在のアプリが使う一般的な学習文法の品詞区分に合わせる。「句全体」ではなく太字の見出し語の働きを示す。

| 元レベル／登録品詞 | 現在のフレーズ | 問題 |
| --- | --- | --- |
| A2 dress・動詞 | wear a **dress** | dress は目的語の名詞。動詞は wear。訳・例文も併せて見直す必要がある。 |
| A2 dream・動詞 | have a **dream** | dream は冠詞 a を伴う名詞。 |
| B1 delay・動詞 | without **delay** | delay は前置詞 without の後の名詞。 |
| B1 display・動詞 | on **display** | display は名詞であり、展示する動詞の例ではない。 |
| B1 release・動詞 | press **release** | release は「発表資料」の名詞。 |
| B2 research・動詞 | market **research** | research は名詞。動詞「研究する」を例示していない。 |
| B2 musical・名詞 | **musical** instrument | musical は「音楽の」の形容詞。名詞「ミュージカル」ではない。 |
| B2 joint・名詞 | **joint** venture | joint は「共同の」の形容詞。「関節・継ぎ目」の例ではない。 |
| B1 slight・名詞 | **slight** difference | slight は「わずかな」の形容詞。「軽視」の名詞用法ではない。 |
| A1 home・名詞 | go **home** | 学習辞書ではこの home は副詞。「家」という名詞の代表例と分ける。 |
| B2 underwater・副詞 | **underwater** camera | underwater は camera を修飾する形容詞。 |
| A1 along・副詞 | **along** the river | along は名詞句 the river を後ろに取る前置詞。 |
| B1 till・接続詞 | **till** tomorrow | tomorrow を伴う前置詞用法。接続詞を示す節になっていない。 |
| B1 after・接続詞 | **after** all | 「～した後に」を示す接続詞 after の例ではない。熟語の語義も登録訳と異なる。 |
| B1 round・形容詞 | all year **round** | 「一年中」という表現であり、形容詞「丸い」の例ではない。 |

独立資料による確認例：[dress](https://dictionary.cambridge.org/dictionary/english/dress)、[home](https://dictionary.cambridge.org/dictionary/learner-english/home)、[musical](https://www.collinsdictionary.com/us/dictionary/english/musical)、[joint](https://dictionary.cambridge.org/us/dictionary/english/joint)、[接続詞after](https://dictionary.cambridge.org/grammar/british-grammar/after)、[after all](https://dictionary.cambridge.org/us/dictionary/english/after-all)。それぞれの語義・構文に照らした表の判定は今回の分析である。

## 曖昧さを理由に見直すもの

- adult ticket のように、名詞の前置修飾という説明を検討できても、別の形容詞用法と見分けにくい例は名詞の最初の代表例にしない。
- 名詞の前にある全候補を自動で不合格にしない。例えば素材名・複合名詞は辞書の分類も確認する。37候補の一括置換は不可。
- `kind of`、`the same`、`less than` 等は短すぎて品詞・語義が確定しにくい。必要な語や文脈を補ってから判定する。

## 今後の合格条件

1. 見出し語そのものが、登録した品詞として働いている。
2. 同じ品詞でも、表示中の和訳・語義を例示している。
3. 別品詞の例にも読めるものは、初級の代表フレーズとして優先しない。
4. フレーズと例文の両方を確認する。一方が正しくても他方の不一致を見逃さない。
5. 品詞ラベルを変えて辻褄を合わせず、収録すべき用法に合う内容へ修復する。今回は修復案の適用はしていない。

ローカル文法参照：『真・英文法大全』PDF p.113（前置詞／接続詞／副詞の構造）、p.520（名詞の目的語と名詞同士の組合せの区別）を本文・画像で確認。p.520の「決まり文句」という説明をあらゆる名詞修飾の一般規則へ拡大せず、Cambridgeの修飾語説明と区別して参照した。書籍の本文・画像はこのリポジトリへ複製していない。
