# GroceryView living specifications

Actionable engineering and product standards for GroceryView as a **multi-domain price intelligence platform** (grocery, pharmacy OTC, fuel). These specs are maintained in-repo and updated with every PR that changes behavior, metrics, or public UX.

## How to use

1. **Before building** — read the relevant domain spec and pick the right template.
2. **While building** — follow principles, avoid anti-patterns, wire required tests.
3. **Before merging** — complete [PR review checklist](../governance/pr-review-checklist.md) and update specs when behavior changes.

## Spec index

| Spec | Purpose |
|------|---------|
| [Data engineering principles](./data-engineering-principles.md) | Ingestion, idempotency, bronze/silver/gold, source runs |
| [Database architecture & scaling](./database-architecture-scaling.md) | Serving tables, partitions, indexes, public vs admin queries |
| [Data analytics semantic layer](./data-analytics-semantic-layer.md) | One metric definition reused everywhere |
| [Metric dictionary](./metric-dictionary.md) | Canonical definitions for price, deal, quality, search metrics |
| [Data quality & observability](./data-quality-observability.md) | Quality gates, reports, frontstage vs backstage evidence |
| [Analytics event tracking](./analytics-event-tracking.md) | Event naming, payloads, dashboards |
| [UI/UX living principles](./uiux-living-principles.md) | Human-centered public UX, no debug copy, accessibility |
| [Versioning & roadmap process](./versioning-roadmap-process.md) | Feature maturity, PR update rules, quarterly review |

## Templates

| Template | Use when |
|----------|----------|
| [Page spec template](../templates/page-spec-template.md) | Adding or changing a public route |
| [Feature spec template](../templates/feature-spec-template.md) | Adding or changing a user-facing capability |

## Governance & roadmap

| Doc | Purpose |
|-----|---------|
| [PR review checklist](../governance/pr-review-checklist.md) | Required PR self-review |
| [Atomic gap registry](../roadmap/atomic-gap-registry.md) | Tracked missing pieces with IDs and tests |

## Handoff source

Generated from handoff pack `groceryview-31-onward-consolidated` (docs 66–80). See [handoff README](../handoff/README.md).

## Principle

> A feature is not complete because it works once. A feature is complete when it is **specified, tested, measured, accessible, maintainable, and understandable**.
