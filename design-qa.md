# Design QA

## Scope

- Flow: learning-level selector opened from the top-level button
- Source visual truth: `C:/Users/warut/.codex/generated_images/019cccb0-06f8-7f71-b588-65277c6395b2/exec-a232f011-76d5-4e2c-8308-f82c6b085d0f.png`
- Mobile implementation: `C:/Users/warut/codex_project/python_chatgpt/screenshots/level-selector-compact-mobile.png`
- iPhone SE implementation: `C:/Users/warut/codex_project/python_chatgpt/screenshots/level-selector-compact-iphone-se.png`
- Desktop implementation: `C:/Users/warut/codex_project/python_chatgpt/screenshots/level-selector-compact-desktop.png`
- Full comparison: `C:/Users/warut/codex_project/python_chatgpt/screenshots/level-selector-design-comparison.png`
- Focused comparison: `C:/Users/warut/codex_project/python_chatgpt/screenshots/level-selector-focused-comparison.png`
- State: selector open with Basic/A2 selected

## Normalization

- Source pixels: 853 x 1844.
- Primary implementation pixels: 390 x 844.
- Primary CSS viewport: 390 x 844 at device scale factor 1.
- The source was downsampled to 390 x 844 before comparison.
- The focused comparison uses the same 390 x 230 top-region crop from both frames.

## Fidelity Review

- Fonts and typography: Japanese level names and CEFR codes use the existing app fonts and preserve the selected hierarchy and optical weight.
- Spacing and layout rhythm: four levels occupy one equal-width segmented rail. The wordbook action spans the full rail below it, removing the legacy empty cell. The mobile panel is 112px high, intentionally denser than the generated mock to preserve more of the learning screen.
- Colors and visual tokens: the selected segment uses deep purple `#4f3aa7`; inactive segments use a cool-white surface and restrained gray-lavender dividers.
- Image and asset quality: the wordbook action uses the official Material Symbols library icon and the existing Lucide chevron asset. No emoji, text glyph, CSS-drawn icon, or raster placeholder is used.
- Copy and content: level names, A1/A2/B1/B2 mapping, and the wordbook destination are explicit. No learning option was added or removed.
- Focused evidence was required because the selector details are too small to assess from the full frame alone.

## Responsive Evidence

- 390 x 844: 370px panel width, 112px panel height, no clipping.
- 375 x 667: 340px panel width, no horizontal overflow.
- 1280 x 800: 420px anchored panel, no viewport overflow.

## Comparison History

- First comparison: no actionable P0, P1, or P2 mismatch was found.
- The smaller implementation height is intentional and supports the selected compact direction without changing information hierarchy.

## Verification

- Level switching still persists and restores the selected level.
- The four CEFR levels render on one row.
- The wordbook row spans the full rail, closes the selector, and opens the existing wordbook modal.
- Browser console errors: none.
- Targeted Playwright result: 3 passed.
- `npm run check:html-sync`: passed.
- `git diff --check`: passed.

final result: passed
