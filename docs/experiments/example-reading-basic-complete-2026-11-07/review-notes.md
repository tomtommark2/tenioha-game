# 基礎レベルの読み方：全例対応

2026-11-07。制作完了、同日公開（`2026.1107.1446`／`72e2435e`）。[公開確認](../example-reading-basic-release-2026-11-07/review-notes.md)。

## 対応範囲

- 基礎1,231カード・全1,520用法に区切り訳と任意の全文訳を登録。最初の100例を保持し、atom以降の1,420例を追加。`complete: true`、元データ・画面側とも未対応0件。
- 正本は `data/example-readings-basic.json`。中学の1,527件、元の綴り・品詞・例文・参照先・学習キーは保持した。
- [制作方針](../../data-workflow.md#例文の区切り訳)を継続。英語の構造を追う区切りと、自然な全文訳を分ける。SVCのbeは「＝」、存在・場所、進行形・受け身、定型表現は区別する。補足は全1,520例中107例だけ。
- [一覧プレビュー](http://127.0.0.1:8067/index.html?exampleReadingPreview=1&exampleReadingLevel=basic)は1,520例を選択できる。開いたままのページは旧データを保持するため、更新後はページを再読込する。通常起動は開始待ちを保つ。

## 難所の確認

| 構造・例 | 扱い |
| --- | --- |
| `Helping you carry the bags is the least I can do.` | 長い動名詞句を主語として保つ。運ぶのはyou、`I can do`はthe leastの後置修飾。全文訳だけでは構造が見えないため短く補足。 |
| `She decided to pursue her dream of becoming a doctor.` | 決心の内容と、夢の内容を分ける。`of becoming a doctor`を目的の不定詞にしない。 |
| `The rain prevented us from going out.` / `You can trust her to keep a secret.` | 外出するのはus、秘密を守るのはher。節内の動作主を維持する。 |
| `I found myself in a difficult situation.` / `I'd like my steak medium-rare.` | 対象と、その対象について述べる状態を示す。後者のlikeは好みのlikeではなく、望む状態。 |
| `The inner walls are painted white.` | beとpaintedは一組の受け身。whiteは塗った結果の状態。`The handle of the door is broken.`など、状態を述べる分詞とは一律に扱わない。 |
| `They have been married for ten years.` | 「ずっと＝」で状態の継続を残す。場所の`I have been here since morning.`は「ずっといる」。 |
| `Few plants can survive the cold winter.` / `I can hardly hear you.` | few・hardlyの否定的な量・程度を落とさない。noを含む動詞句も、肯定の述語として誤読しないようまとめる。 |
| `The view from the top of the mountain is amazing.` | 長い主語を保ち、beは「＝」。場所を示すfrom句を主節の動作と混同しない。 |
| `The room is five meters square.` | 「1辺が5メートルの正方形」。5平方メートルと取り違えない。 |
| `Cruise ship.` / `Notice to quit.` / `Experience difficulties.` | 名詞句・不定詞による修飾・動詞句として読む。短い用例をすべて命令や、主語を補った完全な文にしない。 |

最終見直しでは、前置詞が隣の句に入った境目、助動詞と述語の対応、位置を示すbeと状態を示すbe、全文訳の語順・句読点を修正した。方式は今回の全例にも適用できたが、平らな区切りだけで入れ子の関係を完全に可視化できるとは扱わない。句・節のまとまりと短い注記で補う。

## 根拠と元データの扱い

- 『真・英文法大全』PDF423〜424頁（SVC、beと存在、他の連結動詞）を再確認。PDF439頁（人＋to不定詞）、472〜473頁（名詞の後置修飾）、553頁（感情の分詞）、560〜561頁（分詞構文）、823頁（what節）を参照した[最初の100例の判断](../example-reading-basic-100-2026-11-07/review-notes.md)も引き継ぐ。書籍固有の図・比喩・例文は転載せず、アプリ既存例文の区切りと訳を独自に編集した。
- 元データの誤記・品詞と用法の不一致26件、文脈・ラベルを再確認したい候補7件は [source-issues.json](source-issues.json)。今回追加分の確認記録であり、全語彙の校閲完了を意味しない。実際の文中の働きは読み方で示し、元の例文や学習キーを勝手に変更しない。品詞・例文の修復は別作業。

## 確認

- 全1,520例の重複・出典照合・英文復元・画面の親綴りと用法での照合。対応漏れ0件。最初の100例はオブジェクト比較、中学はSHA-256で一致。元の基礎全用法も作業前と一致。
- PC Chromium、スマホChromium、iPhone WebKit。代表21例、幅320／390／1280px、長い主語、任意の全文訳、操作バー、同綴り別品詞、レベル切替、取得中の切替、手動回復、学習記録不変を確認。
- 旧中学310件・旧基礎100件のキャッシュから最新全件への更新とオフライン取得を実Service Workerで確認。部分対応の未登録例は専用の部分データfixtureで確認する。
- 関連ブラウザー61件・キャッシュ単体4件が成功。実Service Worker検査の他2環境は対象外としてスキップ。旧基礎100件を実キャッシュへ追加した検査も、Chromiumで1件再実行して成功。HTML・版同期、変更したテストの構文も成功。最終の件数・ハッシュは [verification.json](verification.json)。
- JSONは672,506 bytes、参考gzip108,824 bytes。既存のレベル別Map・1回取得を使用。教材の量に応じた取得量は増えるが、回答ごとの通信・定期処理・翻訳API・依存パッケージは増やしていない。Firebase・公開版は変更していない。
