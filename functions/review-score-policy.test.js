const test = require("node:test");
const assert = require("node:assert/strict");
const {
    calculateReviewEventPoints,
    guestRankingName,
    isAnonymousFirebaseUser,
    nextRecentReviewEventIds,
    reviewEventIdHash,
    reviewWordKeyHash,
} = require("./review-score-policy");
const reviewWordHashes = new Set(require("./review_word_hashes.json"));

test("予定復習の正解はSRS間隔に応じて3点から7点を返す", () => {
    const points = [1, 3, 7, 14, 30, 60].map((intervalDays) => (
        calculateReviewEventPoints("scheduled-correct", intervalDays)
    ));
    assert.deepEqual(points, [3, 3, 4, 5, 6, 7]);
});

test("不正解は1点、5分再学習の正解は2点を返す", () => {
    assert.equal(calculateReviewEventPoints("incorrect", 30), 1);
    assert.equal(calculateReviewEventPoints("relearning-correct", 1), 2);
});

test("不正な結果または間隔は0点を返す", () => {
    assert.equal(calculateReviewEventPoints("unknown", 30), 0);
    assert.equal(calculateReviewEventPoints("scheduled-correct", 2), 0);
});

test("eventIdハッシュは同じ再送だけを同一視する", () => {
    assert.equal(reviewEventIdHash("event-12345678"), reviewEventIdHash("event-12345678"));
    assert.notEqual(reviewEventIdHash("event-12345678"), reviewEventIdHash("event-87654321"));
});

test("直近eventIdは10件に制限し同一再送を拒否する", () => {
    const existing = Array.from({ length: 10 }, (_, index) => `event-${index}`);
    assert.equal(nextRecentReviewEventIds(existing, "event-9"), null);
    assert.deepEqual(
        nextRecentReviewEventIds(existing, "event-10"),
        Array.from({ length: 10 }, (_, index) => `event-${index + 1}`)
    );
});

test("単語キーのハッシュは登録語だけを許可できる", () => {
    const wordKey = "word-v2:basic:ability:%E5%90%8D";
    assert.equal(reviewWordKeyHash(wordKey), reviewWordKeyHash(wordKey));
    assert.notEqual(reviewWordKeyHash(wordKey), reviewWordKeyHash(`${wordKey}-other`));
    assert.equal(reviewWordHashes.has(reviewWordKeyHash(wordKey)), true);
    assert.equal(reviewWordHashes.has(reviewWordKeyHash("word-v2:fake:fake:other")), false);
});

test("匿名認証だけをゲストとして判定する", () => {
    assert.equal(isAnonymousFirebaseUser({firebase: {sign_in_provider: "anonymous"}}), true);
    assert.equal(isAnonymousFirebaseUser({firebase: {sign_in_provider: "google.com"}}), false);
    assert.equal(isAnonymousFirebaseUser({}), false);
});

test("ゲスト表示名はUIDから8文字以内で安定して生成する", () => {
    assert.equal(guestRankingName("abcdef1234"), "ゲスト1234");
    assert.equal(guestRankingName("abcdef1234"), guestRankingName("abcdef1234"));
    assert.ok(guestRankingName("x").length <= 8);
});
