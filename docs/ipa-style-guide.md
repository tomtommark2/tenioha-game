# Pronunciation Style Guide

## Scope

- This project uses learner-facing pronunciation notation as a display aid.
- Audio remains the primary pronunciation source.
- Pronunciation text should not change gameplay logic or card flow.

## Positioning

- Use American English pronunciation as the default.
- Keep the notation IPA-based, but optimize for readability over dictionary-level precision.
- Use a Duolingo-like learner-facing subset as the reference style.
- Do not copy textbook-specific systems such as Target 1900 notation wholesale.
- Prefer the user-facing label `発音記号` over `IPA`.

## Storage

- Store pronunciation text without surrounding slashes in data.
- The UI is responsible for displaying `/.../`.
- The UI may still wrap the stored value with `/.../` for readability.

## Standard

- Prefer broad, learner-friendly transcription over narrow phonetic detail.
- Keep one default pronunciation per entry unless the code explicitly supports variants.
- Favor symbols that are common in mainstream learner tools and dictionaries.

## Core Rules

- Include primary stress with `ˈ`.
- Include secondary stress with `ˌ` only when it improves clarity.
- Use rhotic American forms.
- Use `oʊ`, `eɪ`, `aɪ`, `aʊ`, and `ɔɪ` for common diphthongs.
- Prefer readable r-colored forms such as `ər` when that improves learner comprehension.
- Avoid rare or highly narrow symbols unless they materially help understanding.
- Avoid textbook-only helper notations such as parenthesized optional sounds.

## Data Rules

- Add pronunciation text in `data/ipa_overrides.js` first.
- Match entries by `level + word + pos` when duplicates exist.
- Do not bulk-edit `data/vocabulary.js` just to add IPA unless the data pipeline is ready.
- For `selection1400`, `selection1900`, and `sys_2000`, prefer inheriting IPA from referenced source entries.
- Treat the CEFR-aligned runtime levels as the main source layers:
  - `junior` = `A1`
  - `basic` = `A2`
  - `daily` = `B1`
  - `exam1` = `B2`

## Migration Note

- The main CEFR-aligned layers `junior`, `basic`, `daily`, and `exam1` now use this learner-facing standard.
- Continue to normalize new batches before release rather than mixing stricter dictionary IPA with learner-facing notation.

## Quality Bar

- Avoid mixing American and British forms in the same release batch.
- If a word has multiple common pronunciations, choose the most general American learner form first.
- When uncertain, leave the entry blank rather than adding questionable notation.
