# AGENTS.md

Use the current code as the source of truth.

Priority order:
1. Runtime code and tests
2. This `AGENTS.md`
3. Standard repo docs
4. `.agent/`, `old/`, `js/old/`, and `scripts/legacy_batches/` as legacy reference only

Entry points:
- `README.md`: project overview and quickstart
- `SETUP.md`: local environment setup
- `ARCHITECTURE.md`: runtime structure and file map
- `docs/operations.md`: day-to-day workflow
- `docs/data-workflow.md`: vocabulary and content maintenance
- `docs/prompting-playbook.md`: prompt patterns for working with Codex in this repo
- `docs/legacy-reference.md`: how to treat OpenClaw-era assets

Working rules:
- Read the relevant code before editing.
- Keep docs concise and non-duplicated.
- Prefer progressive disclosure: short entry docs, detailed docs under `docs/`.
- Do not promote legacy instructions over current implementation.
- Prefer concise, decision-oriented answers.
- Avoid repeating points that are already established.
- Prefer grounded reasoning over speculative suggestions.

