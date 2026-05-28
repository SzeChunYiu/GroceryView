# 06 — Task E: Data Engineering Report Scripts

## Task
Add practical report helpers/scripts that support source runs, quality gates, dead letters, DB health, and publish gates.

## Scope
```text
scripts/ops/*
packages/ingestion/*
docs/data/*
apps/web/src/lib/admin-reports/*
tests/schema/*
```

## Do
Add or scaffold:
```text
scripts/ops/source-run-report.mjs
scripts/ops/quality-report.mjs
scripts/ops/db-size-report.mjs
scripts/ops/db-index-health.mjs
scripts/ops/check-gold-publish-gate.mjs
```

Each script should run without production credentials if possible, print a clear JSON report, use local/generated fixture data if real DB unavailable, and document env vars for real DB mode.

Add:
```text
packages/ingestion/src/idempotency.ts
```

with deterministic idempotency key function.

## Do not
Do not require production DB secrets. Do not silently pass critical quality failures. Do not fake a successful production source run.

## Acceptance
Reports exist and output typed JSON; idempotency helper has tests.
