# 04 — Task C: Backstage Real Report Helpers

## Task
Admin routes exist, but many are scaffolded. Connect them to shared report helpers or label them clearly as scaffolded.

## Scope
```text
apps/web/src/app/admin/*
apps/web/src/lib/admin-backstage-scaffold.tsx
apps/web/src/lib/admin-reports/*
apps/web/scripts/admin-backstage-routes.test.mjs
docs/data/source-run-contract.md
docs/data/quality-gates.md
docs/roadmap/feature-implementation-registry.md
```

## Do
Create shared admin report helpers:
```text
apps/web/src/lib/admin-reports/source-runs.ts
apps/web/src/lib/admin-reports/dead-letters.ts
apps/web/src/lib/admin-reports/data-quality.ts
apps/web/src/lib/admin-reports/search-analytics.ts
apps/web/src/lib/admin-reports/query-performance.ts
apps/web/src/lib/admin-reports/storage.ts
```

Each helper should export typed rows and a clear scaffold/source label. Admin pages should read from these helpers, not inline sample arrays.

If data is mock/scaffold, show:
```text
Backstage scaffold
Source: local report helper
Next integration: [specific real source/table]
```

## Do not
Do not expose admin technical details on public pages. Do not require production DB credentials.

## Tests
```bash
npm run test -w @groceryview/web -- apps/web/scripts/admin-backstage-routes.test.mjs
npm run test -w @groceryview/web -- apps/web/scripts/content-copy-audit.test.mjs
```
