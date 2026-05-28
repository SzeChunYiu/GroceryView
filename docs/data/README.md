# GroceryView data documentation

Canonical definitions for metrics, analytics events, and how they connect to the ingestion and serving layers. Handoff sources: [68](../handoff/groceryview-31-onward-consolidated/68_DATA_ENGINEERING_PRINCIPLES_SPEC.md), [70](../handoff/groceryview-31-onward-consolidated/70_DATA_ANALYTICS_SEMANTIC_LAYER_SPEC.md), [71](../handoff/groceryview-31-onward-consolidated/71_METRIC_DICTIONARY_STARTER.md), [76](../handoff/groceryview-31-onward-consolidated/76_DATA_QUALITY_AND_OBSERVABILITY_SPEC.md), [77](../handoff/groceryview-31-onward-consolidated/77_ANALYTICS_EVENT_TRACKING_SPEC.md).

## Index

| Document | Purpose |
|----------|---------|
| [metric-dictionary.md](./metric-dictionary.md) | Shared metric IDs, formulas, source tables, owners, and claim boundaries |
| [event-tracking-plan.md](./event-tracking-plan.md) | UI and API event names, payloads, consent rules, and dashboard mapping |

## Related specs

Living engineering specs (Agent 4) live under [docs/specs/](../specs/):

- [data-engineering-principles.md](../specs/data-engineering-principles.md) — bronze/silver/gold pipeline and quality gates
- [data-analytics-semantic-layer.md](../specs/data-analytics-semantic-layer.md) — semantic layer shape and dashboard families
- [database-architecture-scaling.md](../specs/database-architecture-scaling.md) — fact vs serving tables and partitioning

## Code touchpoints

| Area | Location |
|------|----------|
| Product/deal analytics helpers | `packages/analytics/src/` |
| Server-side typed analytics emit | `packages/server/src/analytics/events.ts` |
| Legacy anonymous client buckets | `packages/server/src/lib/events.ts` |
| Web consent-aware client tracking | `apps/web/src/lib/analytics.ts`, `apps/web/src/lib/track.ts` |
| Dictionary structure test | `packages/server/scripts/metric-dictionary.test.mjs` |

## Principles

1. **One definition per metric** — same `deal_score` on Deals, Product, Market, and alerts.
2. **Traceability** — every public number maps to `observations` / `latest_prices` / gold snapshots via `source_run_id` where applicable.
3. **No PII in analytics** — events use entity IDs, buckets, and aggregates; never raw search text, email, or prices tied to users in event payloads.
4. **Publish gates** — gold and public pages only after critical quality checks (see handoff 76).
