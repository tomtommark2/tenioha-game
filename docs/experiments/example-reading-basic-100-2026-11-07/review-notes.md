# 基礎レベルの読み方：最初の100例

2026-11-07。ローカル反映、未公開。

## 追加内容

- 統合後の基礎1,231カード・1,520用法から、現行の並び順で最初の100例を追加。対象はlast〜athlete、82カード分。基礎の対応率は100 / 1,520＝約6.6%、残り1,420例。次はatom。元の語彙・英文・品詞・参照先・学習キーを変えない。
- 正本は `data/example-readings-basic.json`。英語の順で主語・述語・対象・修飾をたどる区切り訳と、自然な全文訳を分ける。SVCのbeは「＝」、時制・否定・疑問・命令・短縮形は働きを残す。補足は必要な26例のみ。
- 基礎・中学を同じ表示部品で扱い、JSONとMap・取得状態をレベル別に分離。アプリからの取得は各レベルの例文を使ったときの1回で、切替後も再利用する。Service Workerのインストール時は両レベルをオフライン用に取得する。自動の翻訳API・定期通信・回答ごとの取得はない。
- `complete: false` で部分対応を明示。未登録の例文は読み方を隠し、実際の読込失敗は「読み方を再読込」から回復できる。未対応例へ無駄な再試行を促さない。基礎データのService Worker登録と、ネットワーク再検証・オフライン用キャッシュも中学と同じ方針にした。
- [基礎100例プレビュー](http://127.0.0.1:8067/index.html?exampleReadingPreview=1&exampleReadingLevel=basic)。通常URLの開始待ちは維持する。選択バーはローカルの明示URLだけで表示し、基礎の用法選択に対応する。

## 難しい例での点検

| 対象 | 採用した扱い・確認点 |
| --- | --- |
| `Advertising influences what we buy.` | `what we buy`を「私たちが買うものに」という一つの対象にする。whatだけを「何」として切り離さない。 |
| `The doctor advised me to rest.` / `Please allow me to explain.` | 休む・説明するのはme。meを医師の動作と混同せず、必要なら`me to explain`をまとめて補足する。 |
| `He has an aged mother to look after.` | `to look after`はmotherの後置修飾。世話するのはHe、されるのはmother。主語・対象・修飾先を注記し、全文訳では自然な「彼には〜がいます」にする。 |
| `She has the ability to speak three languages.` | 不定詞が能力の内容を説明。`I want to study abroad next year.`の希望の内容、`to talk`の時間の修飾も一律に「目的」としない。 |
| `I love reading adventure stories.` / `One advantage of living here is the convenience.` | 動名詞句は「読むこと」「住むこと」のまとまりに保つ。loveの対象と、advantageを説明するof句を区別する。 |
| `I sprained my ankle playing soccer.` | playing soccerは同時の状況で、サッカーをしていたのもI。目的を表す「〜するために」にしない。 |
| `Such is life.` | 補語が前にある形も元の語順を保持。「そういうもの／＝／人生」とし、lifeを説明していることを注記する。 |
| `The latter part of the movie was very exciting.` / `She was amused by the story.` | 形容詞として述べる属性と、原因から受ける働きを区別。後者はここでは受け身としてまとめ、状態として読む可能性まで否定しない。見出しの品詞や-ed/-ingだけでbeの扱いを機械判定しない。 |
| `Apparently, he is not coming.` | 進行形は一組。原文だけでは文脈を限定できないため、訳へ「予定が確定している」といった情報を加えない。予定に使う場合があることは短い補足にとどめる。 |
| `The ticket costs 1000 yen for an adult.` | costsを「要する」、1000 yenを「1000円を」とし、金額が英語で対象になることを追えるようにした。全文訳は自然な「大人1人1000円」。 |

基本方針は今回の範囲でも使える。ただし、平らな区切りだけで入れ子の関係をすべて示せるとは扱わず、まとまりと短い注記で補う。中学以外の全例文や、方式の読解効果を検証したわけではない。

## 根拠

- 『真・英文法大全』PDF439頁（人＋to不定詞と内側の動作主）、472〜473頁（名詞の後置修飾と関係）、823頁（whatの名詞節）、560〜561頁（分詞構文の副詞的な働き）、553頁（感情の分詞と形容詞の境界）、60頁（予定に使う進行形）をローカル索引から参照。書籍の独自の比喩・例文は流用しない。表の区切りと訳はアプリの既存例文に対する独自の編集判断。
- assistant professorは[Oxfordの語義](https://www.oxfordlearnersdictionaries.com/us/definition/english/assistant-professor)と、東京大学の[英語](https://www.t.u-tokyo.ac.jp/en/about/info/careers)・[日本語](https://www.t.u-tokyo.ac.jp/about/info/careers)の対応表記を照合。大学教員の職名として「助教」を採り、制度で呼び名が異なる旨を補足した。

## 検証

- `node scripts/check-example-readings.cjs --level=basic`：全100件のキー・重複・日本語・英文復元・実表示側の照合を確認。中学の`--complete`も成功し、既存データはバイト単位で保持した。
- ブラウザー61件・キャッシュ単体4件成功（実Service Worker試験の他2環境は対象外としてスキップ）。PC・スマホChromium・WebKitで基礎の代表20例、320／390／1280px、用法切替、中学との切替・遅延取得、取得失敗からの回復、1レベル1取得、学習保存不変を確認。実Service Workerから基礎100例をオフラインで読めることも確認した。HTML同期・版同期・JS構文も成功。[最終結果](verification.json)。外部通信は遮断・模擬応答で検証し、本番の利用者・Firebaseへ書き込まない。
- 作業前のコード、対象100例と全基礎用法の控え、制作表と試験ログは `tmp/example-reading-basic-100-20261107/`。新しい画像や画面画像は制作していない。デプロイは行わない。
