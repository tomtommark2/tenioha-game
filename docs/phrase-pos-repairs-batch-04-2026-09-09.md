# 品詞・所有格修復 第4回（2026-09-09）

22語26行をローカル修復。未公開。綴り・参照・収録順・件数は維持し、品詞を変えた22行には旧キー用の `legacyKeyPos` を残した。[完全な変更前後](vocabulary-changes/2026-09-09-phrase-pos-batch-04.json)。

## 修正内容

- `latter`：副詞ラベルを形容詞に修正。関連する形容詞の2行も「後半」と「二つのうち後者」の意味・用例に分けた。代名詞の別用法は保持。
- `another`：冠詞ラベルを既存の形容詞区分に揃えた。別の代名詞用法は、名詞を後続させない独自例文に変更。
- `its`：独立所有代名詞のような「それのもの」と未完成フレーズを修復。2行とも所有格を示し、身体部位と組織名の用例に分けて選択肢を区別できるようにした。
- `her / his / its / my / our / their / your`：冠詞ではなく代名詞の所有格。表示は既存区分の「代」、意味には「所有格」を明記する。
- その他の名詞を限定する14行：既存の「形」に揃えた。`little` は意味の正負を区別し、例文を完成した文にした。
- データ内の「冠」は `a / an / the` の3行だけになった。限定詞区分の新設や、他の品詞体系の全面変更は行わない。

## 根拠と分類方針

英語資料参照スキルにより『真・英文法大全』PDF p.306–307を参照し、p.306を画像照合。同書の伝統的な学習文法上の区分（所有格／不定形容詞など）を現行アプリに適用した。限定詞を独立した分類で扱う辞書もあり、唯一の品詞体系とは主張しない。

- [Cambridge：限定詞の種類](https://dictionary.cambridge.org/us/grammar/british-grammar/determiners-the-my-some-this)
- [所有代名詞と所有限定詞](https://dictionary.cambridge.org/us/grammar/british-grammar/pronouns-possessive-my-mine-your-yours-etc)
- [latter](https://dictionary.cambridge.org/dictionary/english/latter)
- [anotherの限定詞／代名詞用法](https://dictionary.cambridge.org/us/grammar/british-grammar/other-others-the-other-or-another)

## 検証

- 全13,505原データ行・参照語・統合カードの修正前後のキー一致。統合済み履歴は再リセットしない。
- 単体20テスト通過、サーバー許可キー10,719件一致。
- [最新スクリーニング](phrase-pos-screening-2026-09-09-after-batch-04-final.json)：異品詞の同一フレーズ0組、名詞修飾候補は適合判断済み5例。条件外の全語彙を監修済みとはしない。`after-batch-04.json` は最終目視修正前の中間記録。
- ブラウザー検証・画像ログ：`tests/possessive-determiner-repairs.spec.js`。WebKitは `playwright.phrase-layout.config.js` で実行する。
- 全22語×幅320／390／1280px×Chromium／WebKit＝132画面で内容一致・横はみ出しなし。全語の再読み込み・Undoで回答履歴を保持。[修正一覧と画像](http://localhost:8000/screenshots/phrase-pos-repairs-2026-09-09-batch-04/index.html)。長いカードは縦スクロールする。物理端末の実機確認ではない。

次の未処理範囲は単語帳の仮例文414行の実表示確認と、取り込み元に対する収録漏れ候補。今回これらの追加・修正は行っていない。
