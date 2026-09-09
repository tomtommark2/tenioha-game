# フレーズ品詞修復・第1回（2026-09-09）

追記：この後、残りの抽出候補は[第2回（62語・89用法）](phrase-pos-repairs-batch-02-2026-09-09.md)で精査・修復した。以下の残件は第1回終了時点の記録。

ローカル実装済み・未公開。既知の16項目と同じ単語の関連用法を確認し、16語・24用法の表示内容を修復した。全語彙の監修完了ではない。

## 修正内容

綴り・品詞ラベル・参照先・収録順・件数・保存形式は変更しない。既存の単語統合は維持し、今回の教材修復では学習履歴をリセットしない。完全な変更前後は[記録JSON](vocabulary-changes/2026-09-09-phrase-pos-batch-01.json)。

| 対象 | 変更内容 | 判断理由 |
| --- | --- | --- |
| adult［名・basic］ | フレーズ: adult ticket → two adults | 名詞自体が複数形となる明確な例にする。 |
| along［副・junior］ | フレーズ: along the river → move along<br>意味: ～に沿って → 前へ、先へ<br>例文: We walked along the beach. → The line moved along slowly. | 後続の名詞を取らない移動の副詞用法に統一する。 |
| home［名・junior］ | フレーズ: go home → a new home<br>例文: I want to go home. → They bought a new home near the park. | 名詞を冠詞と形容詞で限定する。 |
| dream［動・basic］ | フレーズ: have a dream → dream about flying<br>意味: 夢 → 夢を見る、夢に思い描く<br>例文: I had a strange dream last night. → I often dream about flying. | 動詞の意味・フレーズ・例文へ修復する。 |
| dress［動・basic］ | フレーズ: wear a dress → dress warmly<br>意味: ドレス、衣服 → 服を着る、服を着せる<br>例文: She was wearing a beautiful black dress. → Please dress warmly for the walk. | 動詞の意味・フレーズ・例文へ修復する。 |
| delay［動・daily］ | フレーズ: without delay → delay the meeting | delay が目的語を取る動詞の例にする。 |
| display［動・daily］ | フレーズ: on display → display the results | 名詞の慣用句から目的語を取る動詞へ変更する。 |
| release［動・daily］ | フレーズ: press release → release a prisoner | 解放するという既存例文の語義に合わせる。 |
| research［動・exam1］ | フレーズ: market research → research a topic | 研究する動詞を明示する。 |
| musical［名・exam1］ | フレーズ: musical instrument → a Broadway musical | 名詞ミュージカルを冠詞付きで示す。 |
| joint［名・exam1］ | フレーズ: joint venture → aching joints | 関節という名詞の語義に合わせる。 |
| slight［名・daily］ | フレーズ: slight difference → a deliberate slight<br>意味: 【名】軽視 → 【名】侮辱、軽んじる扱い<br>例文: Feel a slight. → She took his refusal to greet her as a deliberate slight. | 名詞の可算用法と語義が分かる文脈にする。 |
| underwater［副・exam1］ | フレーズ: underwater camera → swim underwater | 水中で泳ぐ副詞用法を示す。 |
| till［接・daily］ | フレーズ: till tomorrow → till I return<br>例文: Wait till I come. → Please wait here till I return. | 後ろに主語と動詞を置いて接続詞を明示する。 |
| after［接・daily］ | フレーズ: after all → after you arrive | 登録語義に合う節を伴わせる。 |
| round［形・daily］ | フレーズ: all year round → a round table | 丸いという形容詞用法に合わせる。 |
| round［副・basic］ | フレーズ: all year round → turn round<br>意味: あちこち回って、丸く → ぐるりと、回って<br>例文: We walked round the lake. → She turned round when she heard her name. | 前置詞用法の例文を副詞用法へ変更し、語義も揃える。 |
| till［前・basic］ | 例文: Wait till the rain stops. → The shop is open till six. | 節ではなく時刻を取る前置詞の例文にする。 |
| underwater［形・basic］ | 例文: Fish breathe underwater. → We used an underwater camera to photograph the fish. | camera を修飾する形容詞の例文にする。 |
| musical［形・basic］ | 意味: 音楽の、ミュージカル → 音楽の、音楽の才能がある | 名詞の訳が混在しないよう既存フレーズ・例文の形容詞語義を示す。 |
| joint［形・daily］ | 例文: Joint effot. → They opened a joint account at the bank. | 既存の誤綴り effot を含む断片を、フレーズと一致する文へ修復する。 |
| round［前・exam1］ | フレーズ: all round → round the corner | 前置詞に後続する名詞句を明示する。 |
| round［動・exam1］ | フレーズ: round up → rounded the bend<br>例文: Round the bend. → The bus rounded the bend slowly. | round up の別語義を避け、過去形で前置詞と区別し、回るという動詞用法を明示する。 |
| slight［形・exam1］ | フレーズ: not in the slightest → a slight change | 熟語ではなく、わずかなという形容詞用法に合わせる。 |

## 根拠と検証

- 英語参照スキルに従い『真・英文法大全』PDF p.113を本文・画像で確認し、前置詞と接続詞の後続構造を判定基準にした。教材の新しい例文は独自作成。
- 個別の語義・用法は [along](https://dictionary.cambridge.org/dictionary/english/along)、[slight](https://dictionary.cambridge.org/dictionary/english/slight)、[till/until](https://dictionary.cambridge.org/us/grammar/british-grammar/until)、[after](https://dictionary.cambridge.org/grammar/british-grammar/after)、[dress](https://dictionary.cambridge.org/dictionary/english/dress)、[musical](https://dictionary.cambridge.org/dictionary/learner-english/musical)、[round](https://www.collinsdictionary.com/dictionary/english/round) と[元監査の辞書資料](phrase-pos-audit-2026-09-09.md)を参照。round の副詞・前置詞用法は主に英国式だが、既存の収録用法として保持する。
- 自動テストは文法の正しさを判定するものではない。監修した修正記録との一致、変更フィールドの制限、全行の参照解決後の学習キー維持を検査する。
- `npm run test:unit`：13件通過。`npm run check:review-word-hashes`：10,719キー一致。既存8行の修復と今回24行を除き、Git基準との差分がないことを確認する。
- `tests/phrase-pos-repairs-visual.spec.js`：修正した全フレーズと用法タブ切替後の例文を照合。1280px／390pxで32枚を保存し、文字がカード外にはみ出さないことを検査。スマートフォン幅のエミュレーションであり、物理端末の確認ではない。
- 画像ログ：[manifest](../screenshots/phrase-pos-repairs-2026-09-09/manifest.json)。前回の統合レビュー画像は当時の記録として残すため、新しい修正内容はそちらの静止画像には反映されない。

## 残件

元のスクリーニング結果（異品詞同一フレーズ54組・名詞修飾候補37行）は修正前の証跡として保持する。不良件数や現在の残件数ではない。次の対象はこの候補群の未修復分。例えば `sleep［動］go to sleep`、`mobile［名］mobile phone`、`early［副］early morning` などについて、フレーズ・訳・例文を一組で確認する。名詞修飾が適切な例は一律置換しない。

`yeah［名］` など品詞ラベル自体が疑わしい項目は、表示内容だけで辻褄を合わせない。保存キー・互換性への影響を含む別の修復単位として扱う。
