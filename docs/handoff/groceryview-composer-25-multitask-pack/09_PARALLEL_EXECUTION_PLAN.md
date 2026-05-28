# 09 — Parallel Execution Plan

## Safe to run in parallel

### Batch 1

```text
Task A: registry/tests
Task C: backstage report helpers
Task E: data engineering scripts
Task F: analytics events
```

These mostly touch different files.

### Batch 2

```text
Task B: preview wiring
Task D: ad integration
Task G: public copy QA
```

Run Batch 2 after Batch 1 if possible, because they touch public pages.

## Avoid parallel conflict

Do not run these together:

```text
Task B and Task G
Task D and Task G
Task A and any task updating atomic gap registry
```

## Branch strategy

```text
composer/task-a-registry
composer/task-b-preview-wiring
composer/task-c-admin-reports
composer/task-d-ad-integration
composer/task-e-data-reports
composer/task-f-analytics-events
composer/task-g-copy-qa
```

## Merge strategy

```text
1. Merge Task A first.
2. Merge Task C/E/F.
3. Rebase Task B/D/G.
4. Merge Task B.
5. Merge Task D.
6. Merge Task G last.
```
