# Review System

## SRS Cadence

Scheduled review intervals are:

`1 day -> 3 days -> 7 days -> 14 days -> 30 days -> 60 days`

- A correct answer advances the interval.
- An incorrect answer starts a five-minute relearning loop and lowers the SRS step.
- Existing `learned` words migrate as 3-day reviews.
- Existing `perfect` words migrate as 30-day reviews, with the next correct answer advancing to 60 days.

### 復習タイミング設定（2026-09-05）

- 出題モードの「復習タイミング」で短め／標準／長めを選ぶ。「判定のしくみ」からも開ける。
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

- 判定に使う回答を直近5回／10回から選ぶ。5回は4回以上／5回すべて、10回は8回以上／9回以上／10回すべて正解を選べる。初期値は10回中8回。割合は補足表示し、丸めず正解数で判定する。
- 10回・90%から5回へ変更した場合は、同じ条件を満たす整数の正解数に切り上げ、5回すべて（100%）にする。変更理由を画面に表示する。10回へ戻す場合も現在の割合を保持する。
- 各SRS項目の `recentAnswers` は常に最新10件を保持し、判定に使う末尾5／10件だけを切り替える。同日・手動回答も実際の正誤操作として数える。累積件数は保持し、「戻る」で直近履歴も戻す。
- 選択した回数分が集まるまでは完璧にせず判定準備中。正解が半分以上なら得意、それ未満なら苦手。必要な履歴が集まると選択基準で完璧を判定する。
- 不正解直後は苦手として5分再学習を優先し、正解後に再判定する。
- 旧保存の回答順序は推測せず、`legacyReviewState` で分類を引き継ぐ。必要な履歴が集まるか不正解になると引継ぎを終了する。移行完了後、5→10回への変更で履歴不足になった語は準備中に戻り、過去の旧分類は復活させない。
- 設定は選んだ瞬間に分類・キュー・件数へ反映して端末保存する。適用ボタンや取り消し操作はない。保存失敗時は設定・分類・移行状態を元に戻し、失敗を表示する。
- 画面には保存結果と分類の増減、現在の復習対象／今すぐ復習の件数を表示する。復習件数は選択中のレベル・品詞で絞り込む。
- 基準変更では既存期限と表示中の問題を保持し、キャッシュ・デッキを更新する。古い基準の分類に戻らないよう回答のUndoをクリアする。
- `reviewWindowSize`、`masteryThreshold`、直近履歴、移行状態は端末保存・クラウド保存に保持する。旧保存の設定欠損は10回・80%。クラウド競合は既存の保存リビジョン判定を使う。
- 通常キューは苦手／得意かつ期限到来の語のみ。完璧は対象外だが手動で解き直せる。判定基準の変更自体はSRS間隔とスコア計算式を変えない。
- 新規語も必要な履歴が集まるまでは復習対象に残る。間隔は標準で最大60日（分散前）まで伸びるため、判定まで長期間かかる場合がある。
- UIの検証記録は `design-qa.md` を参照。

## Review Score

The score rewards facing scheduled weaknesses. A word scores whenever it was already due when shown, whether it came from the review queue, a manual `weak`/`learned` category, or the word list. New words, cooldown words studied early, `perfect` category study, and automatic playback do not score.

Every answer to a scheduled review earns points:

- Incorrect answer: 1 point.
- Correct answer in the five-minute relearning loop: 2 points.
- Correct answer at a 1-day or 3-day interval: 3 points.
- Correct answer at a 7-day interval: 4 points.
- Correct answer at a 14-day interval: 5 points.
- Correct answer at a 30-day interval: 6 points.
- Correct answer at a 60-day interval: 7 points.

Repeated incorrect answers continue to earn 1 point because each due review attempt counts as study effort. Correct answers remove the word from the immediate queue and earn more according to the interval being tested. There is no daily or weekly score cap.

## Invariants

- Every scheduled review answer earns at least 1 point.
- Client and Cloud Functions use the same fixed point table.
- Cloud Functions use the current JST date instead of trusting a client-provided date.
- Only word keys generated from the current vocabulary database can score.
- Entry path does not affect scoring; the word must be due when the question is shown.
- New words, cooldown words studied early, `perfect` category study, and automatic playback never score.
- There is no server-side elapsed-time, daily, or weekly score cap.

## Storage

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
