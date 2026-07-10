# Data Workflow

## Source Data

- Runtime vocabulary dataset: `data/vocabulary.js`
- IPA overlay dataset: `data/ipa_overrides.js`
- CEFR CSV inputs at repo root are source materials, not runtime files

## Current Runtime Categories

- `junior` (`A1`)
- `basic` (`A2`)
- `daily` (`B1`)
- `exam1` (`B2`)

Additional wordbook datasets also exist:

- `exam2`
- `selection1400`
- `selection1900`
- `sys_2000`

`selection1400`, `selection1900`, and `sys_2000` are not the primary CEFR source layers. They rely heavily on word-level references into the main datasets.

## Learning-State Identity

- Runtime learning keys use the referenced base level, spelling, and part of speech.
- Homographs with different parts of speech have independent classification and SRS history.
- Wordbook references share learning state with the matching entry in the primary CEFR layer.
- Changing an existing entry's `word`, `pos`, or `ref` changes its learning identity and requires an explicit save-data migration.
- Legacy spelling-only keys are retained during the v2 key transition so existing progress can be copied without data loss.

## Content Scripts

Useful current scripts:

- `scripts/check_data.js`
- `scripts/check_data_v2.js`
- `scripts/check_counts.py`
- `scripts/check_vocab.py`
- `scripts/sync-html.js`
- `scripts/check-html-sync.js`
- `scripts/check-version-sync.js`

Special-purpose or historical scripts should only be used after reading them and confirming they still match the current dataset shape.

## Pronunciation Workflow

- Pronunciation notation is optional display data, not a required runtime field.
- Keep pronunciation data in `data/ipa_overrides.js` until a larger import pipeline is ready.
- Follow `docs/ipa-style-guide.md` for notation rules.
- Use American English as the default pronunciation standard.
- Prefer a Duolingo-like learner-facing IPA subset over textbook-specific notation systems.
- Prefer adding pronunciation data in small verified batches rather than bulk editing without review.

## Legacy Content Scripts

- `scripts/legacy_batches/` contains batch import helpers from earlier content expansion work.
- Keep them as historical reference unless you have verified they still match the current schema.

## Backups

- Do not keep ad hoc backup files such as `*.bak` in the tracked repo.
- If a backup contains useful history, move that knowledge into docs or git history instead.
