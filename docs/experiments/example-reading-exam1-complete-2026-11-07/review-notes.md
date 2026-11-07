# 受験（B2）の例文の読み方

2026-11-07。公開済み（`2026.1107.1719`）。[公開記録](../example-reading-b1-b2-release-2026-11-07/review-notes.md)。ユーザー指定の「次のレベルの例文もすべて」に対応。

- 現行の統合後 `exam1` は2,499カード・2,580用法。全2,580例に区切り訳と全文訳を追加し、`complete: true`。元データと画面の親綴り・選択用法の双方で対応漏れ0件。
- 元の語彙ファイルと、中学・基礎・標準の最新の読み方データはバイト単位で保持。綴り・品詞・参照先・英文・学習キー、回答・保存・分類・配点は変更していない。
- 制作方針は [データ作業手順](../../data-workflow.md#例文の区切り訳) を引き継ぐ。語句を無理に主語付きの文や命令へ変えず、全文訳は引き続き任意で開く。

## 構造・意味の確認

| 対象 | 判断 |
| --- | --- |
| `helped us identify the bird` | 鳥を特定する行為者が us であることを残す |
| `admitted that he had cheated` | 節の関係と、認めた時点より前の不正を保つ |
| `Neither answer is correct` | neither にある否定を保持し、beだけを否定へ変えない |
| `is valid` / `Be hospitalised` / `was overbooked` | beを「＝」にし、時制・否定・状態・受け身を残す。過去分詞という理由だけで過去時制にしない |
| `is visiting` / `is leaking` | 通常の進行形を動詞と一組にする |
| `Get irritated` / `Remain unchanged` | get・remain の変化・維持の意味を消さない |
| `hail a taxi` / `sustain injury` | 代表訳を機械的に当てず、呼び止める・けがを負うという用法に合わせる |
| `elective surgery` / `dignify with a reply` | 語句としての意味を確認し、必要な場合だけ短く補足する |
| `probable cause` / `skim milk` | 文脈・品詞によって読みが異なる点を短く示す |

文法は『真・英文法大全』ローカル資料PDF80頁（過去完了）・439頁（内側の行為者）・716頁（受け身の動作と状態）を再確認。既存の英語に独自の日本語を付け、書籍の例文・独自表現は転載していない。

語義の確認には [Cambridgeのdignify with](https://dictionary.cambridge.org/dictionary/english/dignify-with)、[elective](https://dictionary.cambridge.org/dictionary/english/elective?topic=surgery)、[probable cause](https://dictionary.cambridge.org/dictionary/english/probable-cause) を参照。elective surgeryが事前に予定する手術である点は [Royal College of Surgeons](https://www.rcseng.ac.uk/patient-care/having-surgery/types-of-surgery/) でも照合した。日本語の言い回しは今回の教材向けの独自訳。

## 元データの確認候補

[source-issues.json](source-issues.json) に35件を記録。誤字候補、品詞と用例の使い方、見出し語を使わない説明文、不完全な文、先頭空白など。名詞が後続名詞を修飾する例には成立するものも含まれるため、一律に誤りとは扱わない。

読み方で注意が必要な箇所には注記し、元の英文・学習キーは保持した。`Strictly amazingly.` や `Rich whereas poor.` のような断片に、推測の主語や内容を補って正しい英文として扱わない。

## 実装・検証

- 既存のレベル別Map、ローカルプレビュー、照合スクリプトへ `exam1` を追加。各教材を通常一度だけ取得し、回答ごとの通信・翻訳API・新しい依存パッケージは増やさない。
- 版付きService Worker資産へ登録。成功した取得内容だけを保存し、オフライン・HTTPエラーでは成功済みキャッシュを返す。Service Workerのインストール時にはオフライン用の取得がある。
- `identify` の同綴り・同品詞の別例文と、`edit` の名詞・動詞を個別に照合する。取得失敗・遅い応答・教材切替、幅320／390／1280px、操作バーの位置、開閉で回答・学習保存が増えないことを確認する。
- 件数・容量・保持比較・ハッシュ・実施結果は [verification.json](verification.json)。HTML・CSS・Firebaseは今回変更していない。

[受験全例プレビュー](http://127.0.0.1:8067/index.html?exampleReadingPreview=1&exampleReadingLevel=exam1)。一覧はlocalhostの指定URLだけに表示する。開いたままのページは読み込んだMapを保持するので、教材更新後は再読込する。
