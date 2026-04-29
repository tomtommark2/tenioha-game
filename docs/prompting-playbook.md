# Prompting Playbook

This document captures prompt patterns that work well for ongoing work in this repo.

Primary references:

- OpenAI prompt guidance for GPT-5.5 and related prompting patterns
- OpenAI latest-model guidance for GPT-5.5

## GPT-5.5 Operating Contract

Use outcome-first prompts. Start with the result you want, the success criteria, allowed side effects, and the output shape. Avoid prescribing every step unless the path itself matters.

For this repo, Codex should default to:

- Read current code and tests before changing behavior.
- Preserve current app behavior unless the request explicitly changes it.
- Patch and verify when the request asks for implementation.
- Report blockers, assumptions, and verification results briefly.
- Ask for clarification only when a reasonable assumption would be risky.

## Default Request Shape

For non-trivial requests, include these sections in your message:

```md
Goal:
- What should change?

Success criteria:
- What must be true when this is done?

Constraints:
- What must not break?
- What should be avoided?

Source of truth:
- Which files, behaviors, screenshots, or runtime behavior matter most?

Allowed side effects:
- What files, docs, tests, or deploy surfaces may change?

Output:
- How should the result be reported?
```

This keeps requests specific without making them verbose.

## Good Defaults For This Repo

- Ask for code-first investigation when behavior is unclear.
- Prefer outcome and constraints over step-by-step instructions.
- Name the affected runtime level explicitly:
  - `junior (A1)`
  - `basic (A2)`
  - `daily (B1)`
  - `exam1 (B2)`
- Distinguish main CEFR layers from auxiliary wordbooks:
  - `selection1400`
  - `selection1900`
  - `sys_2000`
- State whether the task is:
  - investigation only
  - patch + verification
  - patch + deploy prep
- For tool-heavy work, include the expected stopping point:
  - stop after diagnosis
  - stop after patch
  - stop after local verification
  - stop after deploy guidance

## Output-Shaping Prompts

When you want tighter answers, say so directly.

Examples:

```md
Answer in 3-5 bullets only.
```

```md
First give the conclusion in 2 sentences, then the details.
```

```md
Do not brainstorm. Inspect the code, decide, and patch.
```

```md
If uncertain, state the assumption briefly before editing.
```

These follow OpenAI guidance to keep prompts simple, specific, and explicit about output shape.

## Specificity Balance

Give specific acceptance criteria, but avoid over-specifying the route unless it matters.

Good:

```md
Goal:
- Make A2 pronunciation display reliably in normal play.

Success criteria:
- A2 cards with pronunciation data show it under the word.
- Existing card layout does not shift badly.
- Playwright smoke tests pass.
```

Too prescriptive unless needed:

```md
Open file X, edit function Y, then use exact implementation Z.
```

Use exact implementation instructions only when the implementation choice is part of the requirement.

## Use Delimited Sections For Complex Tasks

For larger requests, use section headers instead of one long paragraph.

Example:

```md
Context:
- Users report that B2 words do not show pronunciation.

What I want:
- Find the cause.
- Patch it.
- Verify in Playwright if possible.

Do not:
- Change unrelated UI.
- Rename levels.

Success criteria:
- B2 keeps the current level behavior.
- Pronunciation display appears only when data exists.

Return:
- Root cause
- Files changed
- Verification result
```

This matches the guidance to structure prompts clearly and use delimiters for major sections.

## Give Examples When Format Matters

If you care about naming, display text, or exact wording, include an example.

Example:

```md
Use labels like this:
- 中学 (A1)
- 基礎 (A2)
- 標準 (B1)
- 受験 (B2)
```

Example-driven prompting is especially useful for:

- UI labels
- Markdown output shape
- changelog wording
- bug-report reply drafts

## Ask For Persistence Explicitly

For multi-step implementation work, be explicit that the task is not complete until verification is done.

Example:

```md
Please investigate, patch, and verify end-to-end.
Do not stop at analysis.
```

This aligns with OpenAI's agent guidance around persistence and complete resolution.

## Verification Loop

For coding tasks, prefer an explicit verification loop.

Example:

```md
After patching:
- run the smallest relevant syntax check
- run the focused test if one exists
- run full E2E only if the touched behavior is user-facing
- report anything you could not verify
```

This is usually better than asking for higher reasoning effort. Improve the task contract first, then increase model effort only when the work truly needs it.

## Preferred Task Templates

### Bug Fix

```md
Goal:
- Fix this bug.

Evidence:
- [paste report, screenshot path, reproduction steps]

Success criteria:
- The reported behavior no longer occurs.
- Existing expected behavior still works.

Constraints:
- Keep existing behavior unchanged outside the bug.
- Do not change layout unless required.

Output:
- Root cause explained.
- Patch applied.
- Verification result reported.
```

### Repo Cleanup

```md
Goal:
- Reorganize docs / files for maintainability.

Constraints:
- Do not delete uncertain assets without classification.
- Keep AGENTS.md short.
- Move durable knowledge into docs/.

Done condition:
- Files classified.
- Docs consolidated.
- Deletion candidates listed separately.
```

### Content Work

```md
Goal:
- Add pronunciation data for [level].

Success criteria:
- Entries match the current pronunciation style guide.
- The app still loads and displays cards correctly.

Constraints:
- Follow docs/pronunciation rules.
- Do not break runtime display.
- Work in verified batches.

Output:
- Data added.
- Counts reported.
- Tests run.
```

### Review Request

```md
Review mode:
- Prioritize bugs, regressions, missing tests, and risky assumptions.
- Findings first, summary second.
```

## Metaprompting Loop

If a request went poorly, do not rewrite everything from scratch immediately.
Use a targeted follow-up.

Example:

```md
That was close, but still too broad.
Rewrite the operating instructions you would follow next time for this repo so that:
- you inspect code earlier
- you avoid speculative suggestions
- you keep the final answer under 8 bullets
Then apply that improved approach to this task.
```

This follows the OpenAI guidance on metaprompting: ask the model to improve the prompt or instructions based on a concrete failure mode.

## Repo-Specific Notes

- `index.html` is the editable source. Sync to `vocab_clicker_game.html` when needed.
- For behavior changes, prefer code + verification over discussion-only responses.
- For pronunciation work, clarify whether you mean:
  - strict IPA
  - learner-facing pronunciation notation
  - a specific reference style such as Duolingo-like notation
- Keep stable repo instructions in `AGENTS.md` and `docs/` instead of repeating them in every task prompt.
- Put dynamic task details near the end of a prompt when reusing a long template.

## References

- [OpenAI Prompt Guidance](https://developers.openai.com/api/docs/guides/prompt-guidance)
- [OpenAI Latest Model Guidance](https://developers.openai.com/api/docs/guides/latest-model)
