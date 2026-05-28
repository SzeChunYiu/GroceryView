# GroceryView handoff packs

## 31-onward consolidated (2026-05-28)

Imported from `groceryview-31-onward-consolidated.zip` on the Desktop.

- **Path:** `groceryview-31-onward-consolidated/`
- **Start:** `MANIFEST.md` inside that folder
- **Factory lanes:** `codex-tasks/*.txt` and `docs/parallel-sessions/codex-prompts-grocery-31onward.txt`

Primary Claude entry prompts:

| Focus | File |
|-------|------|
| UI/UX redesign | `42_CLAUDE_CODE_DEEP_UIUX_PROMPT.md` |
| Previews / overlays | `64_CLAUDE_CODE_HUMAN_CENTERED_PREVIEW_PROMPT.md` |
| Living specs | `67_CLAUDE_CODE_GENERATE_LIVING_SPECS_PROMPT.md` or `80_CLAUDE_CODE_SPEC_GENERATION_TASKS.md` |

## Living specifications (generated)

Handoff pack 66–80 is synthesized into maintained repo docs:

- **Index:** [docs/specs/README.md](../specs/README.md)
- **Templates:** [docs/templates/](../templates/)
- **Governance:** [docs/governance/pr-review-checklist.md](../governance/pr-review-checklist.md)
- **Gap registry:** [docs/roadmap/atomic-gap-registry.md](../roadmap/atomic-gap-registry.md)
- **Verification:** `apps/web/scripts/atomic-gap-registry.test.mjs`
