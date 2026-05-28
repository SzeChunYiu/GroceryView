# 01 — Master Multitask Prompt

```text
You are working on GroceryView latest main after merged PR #3765.

PR #3765 implemented the implement-everything lock pack, including:
- feature implementation registry
- preview components
- backstage admin route scaffolds
- ad slots/policy
- metrics package
- spec-to-code tests
- many atomic gaps closed

Now run a focused follow-up pass.

Goal:
Convert remaining scaffolded features into usable website behavior and make tests/registries reflect reality.

Do not add new feature ideas.

Work only on one assigned task from this pack:
- Task A: close registries and tests
- Task B: wire preview components into public flows
- Task C: connect backstage pages to shared report helpers
- Task D: integrate ad slots safely into public pages
- Task E: add data engineering report scripts/helpers
- Task F: add analytics event helper and event usage
- Task G: public copy and UX QA

Before editing:
1. Read docs/roadmap/feature-implementation-registry.md
2. Read docs/roadmap/atomic-gap-registry.md
3. Read docs/specs/README.md
4. Read the specific task file.

After editing:
1. Update tests.
2. Update registry/gap docs.
3. Run relevant tests.
4. Summarize remaining gaps.

Important:
- Public pages must not show backstage/debug phrases.
- User-facing UI must use plain language.
- Evidence/freshness/confidence must stay visible when making claims.
- Admin pages may show technical details.
- Ads must be labelled Advertisement and never nested inside cards/tables/charts/maps.
```
