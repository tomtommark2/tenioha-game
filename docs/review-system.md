# Review System

## SRS Cadence

Scheduled review intervals are:

`1 day -> 3 days -> 7 days -> 14 days -> 30 days -> 60 days`

- A correct answer advances the interval.
- An incorrect answer starts a five-minute relearning loop and lowers the SRS step.
- Existing `learned` words migrate as 3-day reviews.
- Existing `perfect` words migrate as 30-day reviews, with the next correct answer advancing to 60 days.

## Queue Ordering

- 復習キューは通常、苦手語を先にし、その中では期限が古い順に並ぶ。
- 「ランダム」は、現在表示中の復習問題を固定したまま、残りのキューだけをランダムに並べ替える。
- 並べ替えは現在の起動中だけ有効で、SRS の期限、学習状態、復習スコア、新規＋復習の 7:3 比率には影響しない。

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
