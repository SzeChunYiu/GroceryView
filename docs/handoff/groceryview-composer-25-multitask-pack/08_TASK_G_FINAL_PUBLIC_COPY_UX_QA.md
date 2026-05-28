# 08 — Task G: Final Public Copy and UX QA

## Task
Clean remaining public copy and make pages human-readable.

## Scope
```text
apps/web/src/app/**
apps/web/src/components/**
apps/web/scripts/content-copy-audit.test.mjs
docs/roadmap/atomic-gap-registry.md
```

## Do
Remove public/backstage copy leaks:
```text
Server-side cursor pagination
source_run_id
raw_record_id
COPY staging
Redis cache
pgbouncer
parser version
buildPriceChartSeries
```

Replace technical copy:
```text
source tape → source history
terminal view → price view
domain=fuel observations → verified fuel price rows
fail closed → unavailable until source is ready
```

Every public page should have:
- plain H1
- user question
- simple subtitle
- primary action
- evidence/freshness/confidence if claim is made
- useful empty state

## Do not
Do not change admin technical copy unless it appears on public pages. Do not remove evidence, only translate it.

## Tests
```bash
npm run test -w @groceryview/web -- apps/web/scripts/content-copy-audit.test.mjs
```
