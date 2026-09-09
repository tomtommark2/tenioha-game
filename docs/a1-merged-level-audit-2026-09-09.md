# A1統合カードのレベル一次点検（2026-09-09）

最新：[B1/B2由来160語の一次分類](a1-b1-b2-review-160-2026-09-09.md)を経て、[16語の所属とexcuseの入口を修復](a1-level-repair-01-2026-09-09.md)。133語を原則維持、残り10候補は保留。以下の8語案は初期案であり、focus等の移動先は追加資料により保留へ更新した。未学習増加は問題にしない方針。第1回修復は学習キーを維持できたためリセットしていない。

## 優先8語の再評価（同日・反映前の提案）

一次点検後、8語の全主CEFR行（意味・品詞・フレーズ・例文）を確認した。以下は**実際に教える用法の辞書レベルを優先する場合の推奨案**。CSVを唯一の所属基準とする方針からの例外を含むため、まだ語彙・実装・履歴には反映していない。アプリ全体をCambridge基準に切り替える承認でもない。

| 語 | カード所属案 | 確認結果・内容面の見直し |
|---|---|---|
| excuse | A1維持 | 入口を注意を引くExcuse meへ。名詞「言い訳」はB1の発展用法として保持。現行は名詞のa poor excuseが先頭で、動詞側もフレーズexcuse meと謝罪例文Excuse my latenessが一致していない。[辞書](https://dictionary.cambridge.org/us/dictionary/essential-british-english/excuse) |
| since | A2 | 「～以来」の前置詞はCSV・辞書ともA2。現行の前置詞用例は継続の文脈として成立し、レベル移動のために易しい別義へ差し替える必要はない。[辞書](https://dictionary.cambridge.org/dictionary/essential-british-english/since) |
| tax | B1 | 税金の名詞はCSV・辞書ともB1。A1側の完全文は利用可能。上位側のtax return／Income tax.は対応を整える。[辞書](https://dictionary.cambridge.org/dictionary/english/tax) |
| tunnel | B1 | 地下等の通路という通常義は辞書B1（CSVはB2）。前回のB2候補を更新。上位側のtunnel visionは通常のトンネルとは異なる表現で、意味欄「トンネル」・例文Train tunnel.との不一致も修復対象。[辞書](https://dictionary.cambridge.org/dictionary/english/tunnel)／[tunnel vision](https://dictionary.cambridge.org/dictionary/english/tunnel-vision) |
| support | B1 | チームを応援する動詞は辞書B1。名詞の援助も辞書B1で、前回の「CSVの名詞A2を入口にする案」から更新。上位側はフレーズがチーム、例文が家族の扶養なので用法ごとに整える。金銭的扶養や抽象的賛同をすべて同じ難度とはしない。[辞書](https://dictionary.cambridge.org/dictionary/english/support) |
| though | B1 | 現行の譲歩の接続詞は辞書B1（CSVはA2）。前回のA2候補を更新。even thoughというフレーズとThoughで始まる例文をそろえる。副詞の文末用法は別用法として保持。[辞書](https://dictionary.cambridge.org/dictionary/learner-english/though?q=though_1) |
| judge | B1 | 意見・判断を形成する動詞は辞書B1（CSVはA1）。動詞の意味欄から名詞「裁判官」を分離し、Check and judge clearly.を対象がわかる完全文へ。名詞側のjudge of characterは裁判官を描く例文と別義なので、こちらも対応を整える。[辞書](https://dictionary.cambridge.org/us/dictionary/english/judge) |
| focus | B2 | 現行のfocus onと名詞の注意の焦点は辞書B2。簡単な命令文でも用法がA1になるわけではない。名詞側のmain focusとOut of focus.は注意の焦点／画像のピントが混ざるため、対象語義をそろえる。[動詞](https://dictionary.cambridge.org/dictionary/english/focus-on)／[名詞](https://dictionary.cambridge.org/dictionary/learner-english/focus) |

このレベル案は教材編集上の提案であり、各語の全用法に対する普遍的なCEFR認定ではない。7語の所属変更とexcuseの代表用法変更に限定し、その他の289語や同じ辞書レベルの全単語には自動適用しない。

### 実装前に確定すること

- 上記の用法優先案を採用するか。元CSV準拠だけならtunnel=B2、support/though=A2、focus/judge=A1となり、今回の案とは結果が異なる。
- 採用する場合も、一語一カードと現在の学習履歴・ポイントは維持する。レベル表示を変えるために既存キーを単純に変えたり、統合版番号を上げて再リセットしたりしない。表示所属と保存上の識別子の分離または限定的な互換移行が必要。
- excuseの用法順序・発音も含めて確認する。名詞行を動詞の意味だけに上書きする方法は使わない。既存名詞の意味は保持する。
- 上位用法の一律非表示、用法別SRS、新規UIはこの8語の修復と分ける。現状の一履歴では、基本義と発展義の習得を別々には判定できない。

英語参考書チェックを使用。『真・英文法大全』PDF p.73でsinceの継続文脈・副詞用法を本文／画像照合。『英語イメージ大図鑑』PDF p.147でfocus onの意味を再確認（画像は直前の点検でも照合済み）。参考書は語義・文法確認に限り、CEFRレベルの根拠にはしていない。今回の更新は本節のみで、以下は一次点検時の候補・件数を残す。

## 結論

懸念はある。ただし「上位にしかなかった単語が統合でA1へ移った」のではない。元から存在するA1行を基準に、上位の用法もA1カードへ集約されている。対処候補は **元A1行の所属見直し** と **カード内の学習対象語義の区別** の二つ。カード全体を一律に上位へ移すと、bookの「本」などもA1から失われる。

調査のみ。語彙・所属・学習キー・履歴・アプリ表示は変更せず、公開もしていない。

## 範囲と件数

- 未学習が約380語増えたというユーザー観測について：現行A1の統合374カードは初回移行で旧履歴を削除する対象。約380という規模と近いが、端末の変更前後の保存を比較していないため増分の全内訳は未確定。未学習増加を新規収録増加と同一視しない。統合処理自体はA1原データに綴りがない語をA1へ追加しない。
- B1/B2用法を含むA1統合カードは160語（上位原データ173行）。すべて同綴りのA1原データ行が既に存在する。したがって「B1/B2だけの語がA1へ新規移入」と「既存A1語への上位用法の集約」を分けて点検する。
- 現行 `data/vocabulary.js` と `js/word_grouping.js`、ルートの `CEFR-J Wordlist Ver1.6 - A1/A2/B1/B2_sep.csv` を照合。CSVはローカル保管資料であり、公式配布ファイルとの同一性までは今回検証していない。
- A1原データ1,225行 → 1,114カード。うち複数行の統合374語、A1と上位にまたがる統合297語。残る77語はA1内だけの統合。
- 297語に上位350行が集約される。上位層別ではA2を含む165語、B1を含む105語、B2を含む60語（重複あり）。350行は350種類の別義という意味ではない。
- 297語すべての品詞・意味・フレーズを一覧で一次確認。うち233語は元A1 CSVにも綴りが存在し、64語は元A1 CSVにない。綴り一致は語義・品詞までの正しさを保証しない。
- 全297語の外部辞書による個別認定は未実施。64語は「誤配置確定数」ではなく元資料との差分。全A1の適切性監修が終わったという意味でもない。
- [全297語・現行用法・CSV品詞別レベル](a1-merged-level-audit-2026-09-09.json)。

## 1. 元A1行の所属を先に点検する候補

元A1 CSVにない64語は、元CSVの最初の収録層で集計するとA2が56語、B1が7語、B2が1語。すべてs以降に集中するが、追加経緯・原因は未特定。

| 優先候補 | 現在のA1用法 | ローカル元CSV | 判断案（未承認） |
|---|---|---|---|
| tax | 名・税金 | B1・名 | B1への所属見直しを優先 |
| tunnel | 名・トンネル | B2・名 | 元CSV準拠ならB2候補。身近さだけで確定しない |
| support | 動・支える、応援する | A2・名／B1・動 | 少なくともA1の根拠を再確認。カード最初の導入はA2候補 |
| since | 前・～以来 | A2・前／B1・接／B2・副 | A2から導入する候補 |
| though | 接・～だけれども | A2・接／B2・副 | A2から導入する候補 |
| sheet / taste / tent | 名・シーツ、紙／動・味がする／名・テント | B1（tasteは名・動） | 元CSVとの差分として個別確認 |

一方、sometimes・strawberryは元CSVではB1でも、これだけでA1から外すとは決めない。日常性の高い語や学習者に必要な基本用法は、採用基準をそろえて判断する。sportsも元CSVはB1形容詞のみで、現行A1の名詞と品詞が異なるため単純移動の根拠にしない。

64語のうちA2の56語：shout, shut, sightseeing, silver, simple, since, skate, ski, slowly, snack, soap, sock, soft, sound, south, space, spaghetti, speaker, speed, spoon, stadium, stamp, steal, supper, support, surprised, sweater, table tennis, tape, tear, textbook, theirs, third, thirsty, though, thousand, tie, toe, tour, traffic, trouble, twice, understand, uniform, university, useful, video game, village, violin, voice, weak, website, west, windy, wood, yeah。

B1の7語：sheet, sometimes, sports, strawberry, taste, tax, tent。B2の1語：tunnel。

補足：A1全体では元A1 CSVに綴りがないものが66語。残るsoftball／Webは今回の上位統合297語の対象外で、4層CSVに完全一致なし。別綴りや独自補完の可能性があるため欠陥と断定しない。

## 2. A1所属を残し、上位用法を区別したい代表語

以下のレベルは外部で再認定したものではなく、現行原データの層を示す。

| 語 | 現行A1用法 | 統合された上位用法 |
|---|---|---|
| book | 本 | B1・予約する |
| fine | 元気な、晴れた | B1・罰金／B2・罰金を科す |
| mine | 私のもの | B2・鉱山、地雷 |
| will | 助動詞 | B2・意志、遺言 |
| mean | 意味する | A2・意地悪な／B2・平均 |
| arm | 腕 | B1・武装させる |
| wind | 風 | B2・巻く、曲がりくねる |
| sentence | 文 | B2・刑を宣告する |

この群は一語一カードを維持できる。ただし現状は全用法を一緒に表示し、学習履歴も一つなので、「A1を学んだ」と「上位の全語義まで学んだ」を区別できない。元レベルは `senses[].__sourceLevel` に残っているため、今後は基本用法と発展用法の表示区別を検討できる。段階別の出題・習得判定まで求めるなら、表示だけでなく履歴仕様の判断が必要。

## 3. CSV自体がA1でも、選んだ語義を再確認したい語

- **excuse**：元CSVは名詞A1、現行A1は「言い訳」。Cambridgeではこの名詞はB1で、注意を引く定型句のexcuse meはA1。カードを丸ごとB1へ移すより、初級の代表用法を整える候補。[Cambridge excuse](https://dictionary.cambridge.org/us/dictionary/english/excuse)
- **focus**：元CSVは動詞A1、現行フレーズはfocus on。Cambridgeの集中する用法はB2。CSV準拠の転記誤りではないが、A1教材の選定として再審査したい。[Cambridge focus on](https://dictionary.cambridge.org/dictionary/english/focus-on)
- **judge**：元CSVは動詞A1。Cambridgeの意見・判断を形成する動詞はB1。現行意味欄は動詞に「裁判官」も混在し、レベルだけでなく品詞・語義の整理が必要。[Cambridge judge](https://dictionary.cambridge.org/us/dictionary/english/judge)
- **feed / review / saw / following / living**：元CSVにも同じ品詞でA1指定あり。現行の「飼料」「批評」「のこぎり」等の選定を次の個別照合候補にする。今回、移動先レベルは未確定。

元CSVと辞書の尺度差を「CSVが誤り」とは断定しない。英語参考書チェックの手順で、田中茂範『英語イメージ大図鑑』PDF p.34（excuseの用例）、p.147（focus on）を本文・画像照合した。これは語義確認のみで、CEFR判定には使用していない。

## 推奨する次の判断

1. まずtax / tunnel / support / since / thoughの所属と、excuse / focus / judgeの代表語義を個別確定する。
2. 64語を機械的に移動せず、元CSV準拠と独自の初級補完を区別する。
3. book等の基本語はA1に残す方針で、上位語義の扱いを別に決める。

所属変更を実装する場合、現在は初級側の先頭行が学習キーになるため、先にキー・参照・履歴・サーバー許可キーへの影響を設計する。今回の点検はその変更を承認・実施したものではない。
