# Data Workflow

## Source Data

- Runtime vocabulary dataset: `data/vocabulary.js`
- CEFR CSV inputs at repo root are source materials, not runtime files

## Current Runtime Categories

- `junior`
- `basic`
- `daily`
- `exam1`

The runtime code also contains references to review and expansion buckets such as `selection1400`, `selection1900`, and `sys_2000`. Treat those as implementation details unless the current code actively uses them.

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

## Legacy Content Scripts

- `scripts/legacy_batches/` contains batch import helpers from earlier content expansion work.
- Keep them as historical reference unless you have verified they still match the current schema.

## Backups

- Do not keep ad hoc backup files such as `*.bak` in the tracked repo.
- If a backup contains useful history, move that knowledge into docs or git history instead.
