# 標準（B1）の例文の読み方

2026-11-07。公開済み（`2026.1107.1719`）。[公開記録](../example-reading-b1-b2-release-2026-11-07/review-notes.md)。ユーザー指定の「標準を全例追加」に対応。

- 現行の統合後 `daily` は2,179カード・2,397用法。全2,397例に区切り訳と全文訳を追加し、`complete: true`。元データ側と画面の親綴り・選択用法側の対応漏れはともに0件。
- 中学・基礎の最新データはバイト単位で保持。元の綴り・品詞・参照先・英文、学習キーと保存処理は変更していない。
- 制作方針は [データ作業手順](../../data-workflow.md#例文の区切り訳) を引き継ぐ。全文訳は引き続き任意で開く。標準には短い語句が多く、主語や命令を一律に補わない。

## 難しい構造の確認

| 英文の箇所 | 判断 |
| --- | --- |
| `substitute oil for butter` | バターの代わりに油を使う。入れ替えの方向を保つ |
| `his refusal to greet her` | 彼が挨拶を拒んだことを一つの目的語として保つ |
| `enables you to do things` | you が内側の行為者であることを保つ |
| `made everyone laugh` / `something burning` | 主文の主語と、笑う人・燃えるものを混同しない |
| `of being watched` | 受け身の動名詞として読む |
| `was appointed` / `is held annually` / `is made of brass` | beを「＝」にし、動作・習慣・状態を後続の訳に残す |
| `was in a cage` / `are waiting` | 存在のbeと通常の進行形を「＝」へ一括変換しない |
| `What's up` / `To be honest` | 定型表現は機能が分かるまとまりで示す |
| `blue whale` / `draw the curtains` | 熟語の意味と、文脈がないと決められない点を保つ |

『真・英文法大全』ローカル資料PDF439頁（内側の行為者）・716頁（受け身の動作と状態）を再確認。書籍の例文や独自の説明表現は転載せず、アプリ既存の英文に独自の日本語を付けた。

## 実装・通信

- 既存のレベル別Mapへ `daily` を追加。選択用法の照合、明示的な再読込、遅延応答時の現在の教材・用法の確認を継続する。回答ごとの取得、翻訳API、定期処理、依存パッケージの追加はない。
- 標準JSONを版付きService Worker資産と再検証対象へ登録。成功した応答だけを保存し、オフライン・HTTPエラー時は成功済みキャッシュを使う。アプリは標準の例文が必要になったときに取得するが、Service Workerのインストール時にはオフライン用の取得も行う。
- 正本は [example-readings-daily.json](../../../data/example-readings-daily.json)。サイズ、ハッシュ、保持確認、関連テスト結果は [verification.json](verification.json)。
- 同じページで読み込んだMapは保持するので、教材更新後に開いたままのページは再読込する。

## 元データの確認候補

[source-issues.json](source-issues.json) に31件を記録。誤字候補（`stroy` / `eventualy`）、用例に別語が入る `worthy`、不自然な `oldest`、品詞と用例の不一致、元の意味欄に残る作業メモなど。読み方で注意が必要なものは短く注記し、元の学習キー・英文は保った。新しい和訳で原文の不備を推測で埋めない。

## プレビュー

[標準全例](http://127.0.0.1:8067/index.html?exampleReadingPreview=1&exampleReadingLevel=daily)。localhostの指定URLにだけ一覧を出し、通常起動は開始待ちを保つ。HTML・CSS・回答処理・Firebaseは今回変更していない。
