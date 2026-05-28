# Analytics documentation

Canonical analytics docs for GroceryView. The implement-everything lock pack references this folder; content is split by audience:

| Document | Location |
|----------|----------|
| Metric dictionary | [../data/metric-dictionary.md](../data/metric-dictionary.md) |
| Event tracking plan | [../data/event-tracking-plan.md](../data/event-tracking-plan.md) |
| Living event spec | [../specs/analytics-event-tracking.md](../specs/analytics-event-tracking.md) |
| Metric code | `packages/metrics/src/definitions.ts` |
| Server emitters | `packages/server/src/analytics/events.ts` |
| Web consent-aware tracking | `apps/web/src/lib/analytics.ts` |
