# Product Design for Competition

## Goal

Make `てにをは英単語` feel competition-ready: clear value, polished first impression, reliable demo flow, and a product story that judges can understand quickly.

## Product Positioning

`てにをは英単語` is not just a word list app. It is a vocabulary training app that:

- Contains about 8,000 words across A1, A2, B1, and B2.
- Automatically classifies words into 未学習 / 得意 / 完璧 / 苦手 from actual answers.
- Uses review queues and SRS-like timing to bring weak words back.
- Supports pronunciation display and audio playback.
- Lets learners progress without manually managing flashcards.

One-line pitch:

> 8000語を、正解・不正解の履歴から自動で得意・苦手分類し、復習まで導く英単語アプリ。

## Competition Design Principles

### 1. First Screen Must Explain the App

Within 5 seconds, the screen should communicate:

- What am I learning now?
- What should I tap next?
- Why are these four categories important?
- Is the app tracking my progress?

Avoid making judges infer the system from hidden settings.

### 2. Demo Flow Must Be Stable

The demo should not depend on rare states, old user data, or long learning history.

Recommended demo path:

1. Open the app.
2. Show the English card, meaning card, example, pronunciation, and audio button.
3. Answer a few times to show automatic classification.
4. Open review queue / study mode to explain复習.
5. Open learning log to show progress visualization.
6. Open account / premium only if needed.

### 3. Show Intelligence, Not Complexity

The app has many systems: SRS, review mode, levels, wordbooks, IPA, cloud save, premium, learning logs.

For competition presentation, surface only:

- 自動分類
- 苦手復習
- 発音サポート
- 復習ランキング
- 8000語データ

Keep implementation details out of the main UI and presentation unless asked.

### 4. Reduce Anxiety Around Hidden Rules

Users should understand why a word appears.

Priority explanations:

- この単語は未学習です
- 苦手として復習中です
- 復習予定になったため出題されています
- 復習が終わったら通常出題に戻ります

These can be small labels or modal explanations; they do not need long text.

### 5. Polish Beats Feature Count

For competition, visible quality matters:

- consistent spacing
- consistent icon style
- no dead buttons
- no confusing labels
- smooth first-run experience
- no console errors
- no broken audio
- no layout jumps between mobile and desktop

## Current Strengths

- Strong data scale: about 8,000 words.
- Clear four-state learning model.
- Existing E2E test coverage.
- Pronunciation and example sentence support.
- Review queue and study mode already exist.
- GitHub Pages deployment is simple and stable.

## Current Product Risks

- Too many controls are visible early, especially for new users.
- Review mode / queue rules are powerful but hard to explain.
- Audio relies on browser speech synthesis, so device/browser differences can appear.
- Some legacy concepts and settings may feel implementation-driven rather than learner-driven.
- The character and gamification layer is visually distinctive but needs consistency with the learning UI.

## Competition-Ready Priorities

### P0: Must Fix Before Submission

- No broken primary actions: answer buttons, speaker button, card flip, review mode toggle.
- No stale deployment/version confusion.
- Mobile first screen must fit cleanly without awkward overlaps.
- Audio button should fail gracefully when the browser does not support speech synthesis.
- Demo account/data should be prepared and predictable.

### P1: High Impact Polish

- Add a short first-run explanation for the four categories.
- Add a compact "why this word appeared" label for review words.
- Make the review queue explanation simpler: ON / MIX / OFF should map to learner language.
- Improve learning log entry point and make its value obvious.
- Ensure all icons follow one style: pictogram, not mixed emoji/UI.

### P2: Nice to Have

- Competition demo mode with seeded progress data.
- Before/after learning summary.
- Small achievement moment after clearing weak words.
- Better onboarding animation for the character.

## UI Copy Direction

Use learner-facing language, not system-facing language.

Prefer:

- 苦手を自動で復習
- 今の単語を聞く
- 学習状況を見る
- 復習をまぜて出題

Avoid:

- activeReviewLevels
- queue filter
- manual weak mode
- system WORDS
- internal level names unless needed

## Demo Script

Short version:

> このアプリは、約8000語の英単語を、回答履歴から自動で「未学習・得意・完璧・苦手」に分類します。ユーザーは細かく単語帳を管理しなくても、苦手な単語が復習キューに戻ってくるため、学習と復習が自然につながります。発音表記と音声、例文、復習ランキングも備えているので、単なる暗記カードではなく、継続しやすい英単語トレーニングとして使えます。

Demo beats:

1. 1問解く。
2. 例文と音声を見せる。
3. 間違える/正解することで分類が変わることを説明する。
4. 苦手が復習に戻る仕組みを見せる。
5. 復習ランキングで継続する動機を作る。

## Judging Checklist

Before a competition demo, verify:

- App opens from the production URL.
- Version shown in the UI matches `js/version.js`.
- Speaker button works on the demo device.
- Card flip works.
- Four category buttons are visible and not overlapping.
- Review queue state is understandable.
- Learning log opens.
- Login/premium prompts do not block the main demo.
- Mobile view is clean.
- Desktop view is clean.
- Console has no fatal errors.

## Implementation Rule

When improving for competition, prefer changes that:

- Make the first 30 seconds clearer.
- Reduce explanation burden.
- Improve confidence that the app works.
- Preserve existing learning data and behavior.

Do not add large new systems unless they directly improve the demo story or learner clarity.
