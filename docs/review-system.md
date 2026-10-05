# Review System

## 出題・復習設定の入口

- 入口は従来どおり「その他」内の「出題・復習設定」。ホーム画面の学習スペースを優先し、設定入口用の常設行・大きなボタン・案内行・復習キューの歯車は追加しない。
- 「その他」のドットだけで入口を案内し、メニューを一度開くと消える。表示済みキー `vocabGame_settingsMenuHintSeen_v1` はブラウザ単位で、学習データ／クラウド同期とは分離する。
- 設定内は「出題」「復習」「表示」の3タブ（2026.1004.1146）。出題は出題バランス・範囲、復習はタイミング・完璧の判定基準・おすすめの案内・並べ替え、表示はイラスト常時表示・カードの学習状況。細かな復習設定は現在値を見せる折りたたみにし、判定の説明は基準の中へまとめる。読み上げ設定は従来の音声アイコンに維持。
- 文言は項目名で伝わる補足を省き、通知の条件・適用時期・判定の例外だけ短く残す。「イラストを常時表示」「正答率・出題理由を表示」は項目名のみで、補足を添えない。通常の保存案内は常設せず、変更後の結果・保存失敗は従来どおり通知する。
- 開くたび「出題」から始まり、タブ・閉じる操作は上部に固定。矢印キー／Home／Endでも切り替えられ、非表示の項目にはTab移動しない。「復習タイミングを確認・変更」は復習タブと間隔の詳細を開く。切り替えや詳細の開閉は表示だけで、出題中の単語・分類・SRS・Undo・設定値・保存・ブラウザ履歴を変更しない。設定を変更した際の判定・保存・失敗時の復帰は既存処理を使う。

### 復習のおすすめ・イラスト常時表示（2026.1004.1146）

- 「復習」タブの「復習のおすすめを表示」は初期オン。復習キューが101件以上なら、球の右上付近に小さな吹き出しで「復習が溜まっています」「あとで」「復習する」を示す。画面中央のモーダル・暗い背景・専用の案内行は置かず、件数はキュー見出しだけに表示する。数えるのは現在の範囲・品詞・利用権で今すぐ復習できる語だけで、期限前や完璧は対象外。すでに「復習だけ」なら案内しない。
- 学習開始後の画面更新の区切りで表示し、意味の確認中・ほかのモーダル・利用制限画面には割り込まない。「復習する」を本人が押した場合のみ従来の手動切替を実行し、「あとで」は出題モード・問題・分類・履歴を変更しない。自動フォーカス移動・Tabの閉込め・スクロール固定・ブラウザ履歴追加はしない。「あとで」・Escape・外側のクリックで閉じる。外側のカードや設定はその一度の操作で動く。「あとで」または案内内でEscapeを押した場合は学習カードへ戻すが、外側の操作やフォーカスは奪わない。
- 閉じるとその起動中は再表示せず、100件以下へ減った後に再び超えた場合は案内する。設定をオフにすると案内を表示しない。強制切替・100件への切捨て・履歴削除は行わない。
- 「イラストを常時表示」は初期オフ。オンなら画像のある問題で回答前から表示し、次問・Undoでも適用。画像なし・読込失敗は通常のキャラ表示へ戻す。オフ時も手動表示と不正解後の表示は従来どおり。無料の単語帳範囲・採点は変えない。
- オンのときだけ、意味カードの左上に「常時表示中」を表示する。画像のない単語でも設定状態として示し、押すと「表示」タブを直接開く（回答・学習開始はしない）。初期画面・次問・Undo・カード再生成でも維持。オフなら消え、解除後に設定を閉じる際のフォーカスは「その他」へ戻す。オンのまま閉じる場合は元の「常時表示中」へ戻す。
- 両設定は左上「その他 → 出題・復習設定」から変更し、`vocabGame_reviewRecommendationEnabled`／`vocabGame_illustrationAlwaysVisible` にブラウザ単位で保存。学習セーブ・クラウド・回答Undoには含めない。保存失敗時はスイッチと動作を元へ戻す。SRS判定・間隔・配点・学習キー・課金・Firebaseは変更しない。

## マイ単語帳（2026.1004.1146）

- 「レベル選択 → 単語帳から選ぶ → マイ単語帳」で名前付きの複数冊を作成するプレミアム機能。既存の購入・期限判定を使い、無料／期限切れでは作成・編集・学習を止め、未ログインならアカウント、ログイン済みなら購入案内へ進む。既存の冊・自作語・履歴は保持し、再有効化後に再開可能。localhostでも機能制限は適用する。基本4レベルの無料学習・1日8分・決済処理は変えない。
- 「英単語を探す」は大小文字を区別しない前方一致で即時サジェスト（先頭12件）。完全一致→初級レベル→綴り順で並べ、`AP` でappleが見える。候補は品詞別の意味と追加済みを表示し、クリックで追加。「登録した単語」「学習状況から追加」の英語絞り込みも前方一致、日本語の意味は部分一致。
- 「単語・意味を入力して追加」は専用入力画面へ切り替える（2026.1005.1957公開対象）。収録済み語も本人の訳付きで登録し、既存の学習キーと冊別 `wordNotes[key].meaning` を使う。元の意味・画像・履歴は変更しない。独立した同綴りの別カードは品詞・元の意味を確認して選択、統合カードは1キーのまま。追加済みならその冊の訳だけ更新し、既存メモと他の冊の訳を残す。登録・自作語編集・自分用メモの画面では一覧を隠し、戻る／キャンセルで元の入力・選択・スクロールへ戻る。
- 英単語を改行・カンマ・タブ・セミコロン区切りでまとめて完全一致照合。熟語は1行に1つ。全半角・大小文字・連続空白・曲がったアポストロフィを正規化し、候補・追加済み・未収録を表示。品詞と意味を併記し、独立した同綴りの別カードは自動選択せず本人が確認する。既存の統合カードは全用法をまとめて1キーで登録し、履歴を分割／複製しない。
- 未収録語は単語・品詞・本人が入力した意味で登録（単語120字、意味500字まで）。意味は生成しない。収録語を綴りだけで上書きしない。自作語は同綴り・同品詞の重複を防ぎ、複数冊でも同じID・意味・履歴を参照する。別品詞は独立したID・履歴。既存自作語の再追加で意味を勝手に上書きしない。入力文字は候補・カード・一覧でエスケープし、意味の記号・改行は保持。長い自作語は折り返し、長い意味はカード内でスクロールする。
- 「登録した単語」の自作語には「意味を編集」を表示。意味だけを修正し、綴り・品詞・固定IDは変えない。同じ自作語を使うすべての冊へ反映することを編集画面で案内する。表示中・次の出題・再読込・回答Undo後も修正後の意味を使い、学習履歴・復習予定・ポイントは維持する。
- 「登録した単語」の各語に「自分用メモ」を置く。「自分の訳」「覚え方・メモ」はそれぞれ任意・500字までで、冊ごとの `wordNotes: { [wordKey]: {meaning,memo} }` に保存。収録語の元の意味を上書きせず、マイ単語帳の意味カードで別枠表示する。統合カードの品詞別の意味も残し、長文はカード内でスクロール。日本語の絞り込みはメモも対象。両欄を空にして保存するとそのメモを消す。
- 「学習状況から追加」は現在の復習キュー／苦手／得意／完璧から検索・選択。キューは現在の範囲・品詞・利用権を尊重し、それ以外の分類は基本4レベルを横断する。表示は60語ずつ、選択はページ間で保持。追加後の分類変化で登録語が勝手に増減する動的リストにはしない。
- 学習中は選択冊内だけを出題・復習し、品詞設定は共通。通常の復習レベル設定はこの範囲には適用せず、画面に説明する。開始時は「全語を練習」で得意・完璧も練習可能（既に復習だけならそのモードを維持）。出題バランスや分類を選ぶと通常の出題に戻る。全語練習でも期限到来の苦手／得意だけが復習スコアの対象。
- `myWordbooks: [{id,name,wordKeys,wordNotes}]`、`activeMyWordbookId`、`myCustomWords: [{id,word,pos,meaning}]` を学習セーブに保持。自作語は `word-v2:my-custom:<ID>:custom` という固定キーで、既存キーやDBを変更しない。自作語も既存のSRS・分類・回答Undoを使うが、サーバー許可リスト外なので復習スコア・送信待ちイベント・ランキング加点には入れない。
- 既存クラウド圧縮は冊・自作語・履歴を保持し、競合保護・復元・アカウントリセットも既存経路を使用。未回答でも作成済み冊／自作語を実データとして扱い、自動上書きを防ぐ。旧保存は空で補完。未解決の正規キーは保存に残し、一覧で件数を案内。
- 名前変更・追加・自作語登録・意味編集・メモ・除外・削除は端末保存失敗時に元へ戻す。編集入力は残して再試行できる。語を外しても冊のメモは残し、再追加で使う。冊の削除はその冊のメモも削除することを確認画面で案内するが、自作語の定義・SRS・履歴・ポイントは削除しない。回答Undoは冊構成・意味・メモの編集を戻さず、冊やマイ範囲の切替・学習中冊の構成変更では古い出題を復活させないようUndoをクリアする。
- 本番のログイン・クラウド保存操作はせず、圧縮／復元を隔離テストで確認。公開検証は `docs/experiments/study-settings-release-2026-10-04/` を参照。

### 登録・学習表示の改善（2026.1005.1957公開対象）

- 収録語の訳付き追加も既存の保存経路で一括確定する。保存失敗時は入力・選択・元の意味・履歴を維持し、再試行可能。英単語と意味のセット一括取込（例：`apple りんご`）は未対応で、今回の1語ずつの登録とは別。
- 自作語も収録語と同じ英単語42px・意味32pxの中央寄せに統一。自分用メモがある場合の元の意味も共通の22pxに揃える。入力した記号・改行・HTML文字の安全表示を保持する。長い自作語は折り返し・高さ180px、意味は高さ220pxを上限にカード内でスクロール。
- 学習キー・保存形式・採点・復習判定・利用権・Firebaseは変更しない。公開用環境でPC・スマホ2環境のマイ単語帳84件、単体41件・Functions18件通過。専用画面、同綴り別品詞の選択、保存失敗・Undo・再読込と通常カードへの復帰、HTML・版番号・復習キーの同期を確認。全画像の読込・全E2Eは今回の検証対象に含めない。

## SRS Cadence

Scheduled review intervals are:

`1 day -> 3 days -> 7 days -> 14 days -> 30 days -> 60 days`

- A correct answer advances the interval.
- An incorrect answer starts a five-minute relearning loop and lowers the SRS step.
- Existing `learned` words migrate as 3-day reviews.
- Existing `perfect` words migrate as 30-day reviews, with the next correct answer advancing to 60 days.

### 復習タイミング設定（2026-09-05）

- 出題・復習設定の「復習タイミング」で短め／標準／長めを選ぶ。「判定のしくみ」からも開ける。
- 正解後の間隔は、短めが上記の0.5倍、標準が1倍、長めが2倍。最初の段階は12時間／1日／2日、最終段階は30日／60日／120日。既存の±20%の分散を維持する。
- 苦手な語も過去の段階に応じて次の間隔が変わるので、UIは最初の段階の例と全段階の目安を表示する。
- 不正解時の段階を1つ戻す処理と5分後の再学習は全設定共通。完璧の判定条件・分類・既存の期限は設定変更では動かさない。
- 選択時に即時保存し、次の回答から適用する。保存失敗時は元の設定へ戻す。`reviewTiming` を端末・クラウドに保存し、欠損や不正値は `standard` にする。
- 配点は従来のSRS段階を基準とし、`scheduledIntervalDays` は倍率適用前の日数を保持する。サーバーの配点テーブル・送信形式は変更しない。短めでは同期間内の復習機会が増えるが、1回答の配点は変わらない。
- 回答Undoは回答前の期限を復元し、ユーザーが選んだタイミング設定は保持する。

## Queue Ordering

- 復習キューは通常、苦手語を先にし、その中では期限が古い順に並ぶ。
- 「ランダム」は、現在表示中の復習問題を固定したまま、残りのキューだけをランダムに並べ替える。
- 並べ替えは現在の起動中だけ有効で、SRS の期限、学習状態、復習スコア、新規＋復習の 7:3 比率には影響しない。

## Recent Accuracy（2026-09-05）

- 判定に使う回答の上限を直近5回／10回から選ぶ。5回は80%／100%、10回は80%／90%／100%を選べる。初期値は5回・80%（5回揃った場合は4回正解）。既存の保存済み設定は維持する。判定の割合は丸めない。
- 10回・90%から5回へ変更した場合は、同じ条件を満たす整数の正解数に切り上げ、5回すべて（100%）にする。変更理由を画面に表示する。10回へ戻す場合も現在の割合を保持する。
- 各SRS項目の `recentAnswers` は常に最新10件を保持し、判定に使う末尾5／10件だけを切り替える。同日・手動回答も実際の正誤操作として数える。累積件数は保持し、「戻る」で直近履歴も戻す。
- 分母は設定回数を上限とする実回答数。10回設定でも1/1は100%で完璧、2/3は約67%で得意、4/5は80%で完璧（基準80%の場合）。基準未満で半分以上なら得意、それ未満なら苦手。0件は正答率を計算せず、新規語は未学習のまま。未回答を不正解として埋めない。
- 不正解直後は苦手として5分再学習を優先し、正解後に再判定する。
- 旧保存の回答順序は推測せず、実回答記録が0件の間だけ分類を引き継ぐ。1件以上の記録があれば直近実績で再判定して `legacyReviewState` を解除する。5→10回への変更でも準備中には戻さず、保存されている最大10件で判定する。
- 設定は選んだ瞬間に分類・キュー・件数へ反映して端末保存する。適用ボタンや取り消し操作はない。保存失敗時は設定・分類・移行状態を元に戻し、失敗を表示する。
- 画面には保存結果と分類の増減、現在の復習対象／今すぐ復習の件数を表示する。復習件数は選択中のレベル・品詞で絞り込む。
- 基準変更では既存期限と表示中の問題を保持し、キャッシュ・デッキを更新する。古い基準の分類に戻らないよう回答のUndoをクリアする。
- `reviewWindowSize`、`masteryThreshold`、直近履歴、移行状態は端末保存・クラウド保存に保持する。設定欠損は5回・80%。クラウド競合は既存の保存リビジョン判定を使う。
- 通常キューは苦手／得意かつ期限到来の語のみ。完璧は対象外だが手動で解き直せる。判定基準の変更自体はSRS間隔とスコア計算式を変えない。
- カード右上には背景なしの小さな正答率（例：80%）だけを表示する。直近の実回答が0件なら非表示。色は正答率が設定基準以上なら金色、50%以上なら緑、それ未満なら赤で、再学習中という分類とは区別する。title／読み上げには実回答数も含める。下部の出題理由は維持する。固定の「あと何回」は今後の回答によって変わるため表示しない。
- UIの検証記録は `design-qa.md` を参照。

### カードの学習状況の表示（2026-09-24、2026.0924.2122で公開）

- 出題・復習設定の「表示」タブで、カード右上の正答率と下部の出題理由（苦手／得意／完璧）をまとめて表示／非表示にする。初期値は表示。上部の分類ボタン・設定内の判定基準は対象外。
- 表示だけを即時変更し、分類・回答履歴・出題順・復習予定・スコア・Undo履歴は変更しない。非表示中も回答は通常どおり記録する。
- `vocabGame_cardStatusVisible` にブラウザ単位で保存し、学習セーブ／クラウド同期から分離。再読み込み・回答Undoでも表示設定を維持する。保存失敗時は元に戻して案内する。

## Review Score

The score rewards facing scheduled weaknesses. A word scores whenever it was already due when shown, whether it came from the review queue, a manual `weak`/`learned` category, or the word list. New words, cooldown words studied early, `perfect` category study, and automatic playback do not score.

Every answer to a scheduled review of an allowed database word earns points (user-created words are excluded):

- Incorrect answer: 1 point.
- Correct answer in the five-minute relearning loop: 2 points.
- Correct answer at a 1-day or 3-day interval: 3 points.
- Correct answer at a 7-day interval: 4 points.
- Correct answer at a 14-day interval: 5 points.
- Correct answer at a 30-day interval: 6 points.
- Correct answer at a 60-day interval: 7 points.

Repeated incorrect answers continue to earn 1 point because each due review attempt counts as study effort. Correct answers remove the word from the immediate queue and earn more according to the interval being tested. There is no daily or weekly score cap.

## Invariants

- Every scheduled review answer for an allowed database word earns at least 1 point; user-created words never score.
- Client and Cloud Functions use the same fixed point table.
- Cloud Functions use the current JST date instead of trusting a client-provided date.
- Only word keys generated from the current vocabulary database can score.
- Entry path does not affect scoring; the word must be due when the question is shown.
- New words, cooldown words studied early, `perfect` category study, and automatic playback never score.
- There is no server-side elapsed-time, daily, or weekly score cap.

## Storage

### 連続Undoの検討（2026-09-13、未実装）

- ユーザー条件は「最大10回。ただし不具合リスク・通信量の極端な増加があれば見送る」。回数だけの拡張は見送った。現行Undoは端末の`reviewScore`を復元するが、送信済みランキングの取消処理はない。
- 現行の保存／Undo関数を使った隔離メモリー試験では、加点3→送信済みとする→Undo→再回答で、端末3／サーバー側加算モデル6となる。本番通信・データ操作はしていない。新規eventIdでの再回答は再送重複防止の対象外。
- 安全な拡張には、過去の各回答の加点・計上日と取消済み状態の管理、送信中Undo・再送・日週跨ぎの整合性を先に設計・検証する必要がある。サーバーの現在の記録は直近ID群と最後の回答の詳細であり、任意の過去回答の正確な取消台帳ではない。単純なローカル減算や履歴上限変更だけでは解決しない。

2026-09-09の[単語カード統合](word-grouping.md)では、主CEFR層の同綴り複数行を単語単位の1履歴にする。統合対象の旧学習履歴だけ削除して未学習へ戻す（ユーザー承認済み・バックアップなし）。累積ポイント、復習スコア、送信待ちの獲得済みスコアイベントは削除しない。`wordGroupingVersion: 1` を端末／クラウドに保持し、統合後の回答は再移行で消さない。配点式は変更しない。

Each SRS entry may contain `isRelearning` to distinguish the five-minute relearning loop from a scheduled 1-day review.

Each scored answer has an `eventId` used only to make network retries idempotent. Cloud ranking state remains keyed by Firebase user and normalized word hash. The fixed word record keeps only the 10 most recent hashed event IDs, so duplicate protection does not create an unbounded event collection. Daily and weekly collections contain aggregate scores only.

For authenticated users, the displayed daily and weekly scores use the server-confirmed total plus locally pending score events. Local history remains the immediate fallback before authentication or while the leaderboard service is unavailable. Only pending events are submitted; the client never overwrites the server with an absolute score. Answers are saved locally without starting score communication. Pending events are synchronized at startup, leaderboard display, backgrounding, the 60-second save check, and network recovery. This avoids polling and per-answer network work without adding complex conflict resolution.

`functions/review_word_hashes.json` is generated from `data/vocabulary.js`. After vocabulary identity changes, run:

```powershell
npm run generate:review-word-hashes
```

The standard `npm run test:e2e:safe` preflight fails when the generated allowlist is stale.

## Guest Participation

- Production creates a Firebase Anonymous Auth identity automatically, so an unregistered player can submit review scores and appear in the ranking.
- Firebase Authentication automatically deletes anonymous accounts that remain unlinked for more than 30 days.
- Guest names are deterministic `ゲストXXXX` labels. Guests may select an avatar but cannot choose a custom name.
- Linking a new Google account keeps the same Firebase UID. Signing in to an existing Google account merges the current JST day and week totals, then removes the guest aggregate.
- Google linking is stopped while local score events remain unsent, preventing the same pending event from being credited under both identities.
- Purchase, promo-code redemption, cloud save, and direct client access to `users/{uid}` remain available only to non-anonymous accounts.
- Ranking points and scoring rules are identical for guests, free registered users, and premium users.
