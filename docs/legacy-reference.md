# Legacy Reference

## Status

The following areas are legacy reference, not primary instructions:

- `.agent/`
- `old/`
- `js/old/`
- `scripts/legacy_batches/`
- archived handover notes under `docs/archive/`

## How To Use Legacy Material

- Read only when current code does not explain historical intent.
- Never override current code or tests with legacy instructions.
- If legacy notes contain still-valid operational knowledge, absorb that into `docs/` and stop depending on the legacy file.

## Legacy Knowledge Already Absorbed

These rules were preserved from older notes because they still match the code:

- `index.html` is the editable source HTML.
- `vocab_clicker_game.html` is the synchronized distribution copy.
- Version changes are centered on `js/version.js`.
- HTML and version sync should be checked before release.

## Legacy Files Worth Keeping As Reference

- `.agent/workflows/sync_files.md`
- `old/game_logic_v1.js`
- `js/old/firebase_app_v1_legacy.js`
- `scripts/legacy_batches/*`

These remain useful only for historical comparison.
