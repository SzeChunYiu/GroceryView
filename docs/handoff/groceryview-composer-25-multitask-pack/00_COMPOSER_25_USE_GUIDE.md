# 00 — Composer 2.5 Use Guide

## Why smaller tasks

Composer 2.5 may struggle if one prompt asks it to edit every area at once. Use small, isolated tasks with tight scope, explicit files, and tests.

## Rule

```text
One Composer task = one coherent PR-sized change.
```

## Safe multitasking model

Use independent tasks that touch mostly different files:

```text
Task A: registry/tests/docs
Task B: preview components wired into search/deals/map
Task C: admin/backstage report helpers
Task D: ad slot integration
Task E: data engineering reports/scripts
Task F: analytics events
Task G: public copy and UX QA
```

## Avoid edit conflicts

Do not run two Composer tasks that both edit the same file at the same time.

Conflict-prone files:

```text
apps/web/src/app/search/page.tsx
apps/web/src/app/market/page.tsx
apps/web/src/app/map/page.tsx
docs/roadmap/atomic-gap-registry.md
docs/roadmap/feature-implementation-registry.md
```

## Composer prompt shape

```text
Task:
[one task only]

Scope:
[exact files or directories]

Do:
[concrete bullet list]

Do not:
[avoid unrelated edits]

Tests:
[exact npm test/script]

Output:
- files changed
- tests run
- gaps closed
- remaining issues
```

## Finish condition

A task is done only if:
1. code changed
2. tests updated
3. registry updated if needed
4. public copy stays human-readable
5. no debug details leak to public pages
