# Quality gates and gold publish

Public gold snapshots and search documents publish only when critical checks pass.

## Critical gates (block publish)

1. Schema validation on normalized rows (required fields, unit sanity).
2. Non-empty snapshot for the target domain/region.
3. No forbidden domain claim (e.g. prescription pricing on grocery surfaces).
4. Freshness SLA: stale beyond threshold → publish with visible warning, not silent replacement.

## Warning gates (publish with flag)

- Coverage below target for a chain or category.
- Elevated duplicate-like match rate (see admin source health).
- Partial connector failure with compensating evidence.

## Gold publish gate (code)

Ingestion and server readiness consult ops checks before advertising “live” public data:

- `packages/ingestion` pipeline completion status
- `apps/web/src/lib/verified-data.ts` fail-closed readiness labels (operator-facing on `/data-sources` only)

## Observability

- Admin: `/admin/data-quality`
- Living gaps: [atomic-gap-registry.md](../roadmap/atomic-gap-registry.md)
