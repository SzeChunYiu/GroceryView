# Feature Spec: [Feature Name]

> Copy to `docs/specs/features/[feature-slug].md` for each user-facing capability.

## Purpose

Why this feature exists and which domain(s) it serves.

## User problem

What problem does this solve?

## Product value

Why does GroceryView need it?

## Best-in-class pattern

Reference: Google Shopping filters, Maps list/detail, Power BI drill-through, etc.

## Scope

| In | Out |
|----|-----|
| | |

## UX flow

Step-by-step user flow (mobile + desktop).

## Data required

| | Detail |
|---|--------|
| Sources | Connectors / APIs |
| Tables | Serving layer only for public UX |
| Metrics | IDs from [metric dictionary](../specs/metric-dictionary.md) |

## Data quality requirements

| | Requirement |
|---|-------------|
| Freshness | SLA hours |
| Confidence | Minimum label to show claim |
| Coverage | Minimum universe % |
| Blocked claims | What must not be shown |

## UI components

List components with states (loading / empty / error).

## Preview / full-page behavior

When to preview vs route to full page.

## Analytics events

Events and success metrics (`noun_verb`).

## Examples

Happy path screenshot description or flow snippet.

## Anti-patterns

Fixture-only forever, debug copy, duplicate metric definitions.

## Acceptance criteria

| Area | Criteria |
|------|----------|
| Functional | |
| UX | Plain copy, one primary CTA |
| Data | Evidence-backed, fail-closed empty |
| Accessibility | Keyboard + SR |
| Performance | Serving-layer reads, pagination |

## Required tests

Unit · route · data contract · a11y · analytics event smoke.

## Rollout plan

| Phase | Deliverable |
|-------|-------------|
| MVP | |
| Phase 2 | |
| Phase 3 | |

## Maturity target

Level at MVP vs production-ready.

## PR update checklist

- [ ] Page spec(s) for affected routes
- [ ] Metric dictionary if new KPIs
- [ ] Gap registry status
- [ ] Event tracking spec if new events
