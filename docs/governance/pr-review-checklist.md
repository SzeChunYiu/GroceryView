# PR review checklist

Every PR must answer these before merge. Copy into PR description or self-review comment.

## Product

- [ ] What user problem does this solve?
- [ ] What route/page/component is affected?
- [ ] Is the user flow connected (links, CTAs, breadcrumbs)?

## UI/UX

- [ ] Is the copy plain (no database/debug jargon on public pages)?
- [ ] Is there one clear primary action?
- [ ] Is the page visually consistent with MVP/design tokens?
- [ ] Does it work on mobile?
- [ ] Are previews/drawers used instead of overloading the page?

## Data

- [ ] What source/data does this depend on?
- [ ] Is freshness/confidence shown when making price claims?
- [ ] What happens if data is missing (`NoVerifiedDataPanel`)?
- [ ] Are quality gates respected ([data quality spec](../specs/data-quality-observability.md))?

## Analytics

- [ ] Are metrics defined in [metric dictionary](../specs/metric-dictionary.md)?
- [ ] Are events tracked per [event tracking spec](../specs/analytics-event-tracking.md)?
- [ ] Does this change require metric dictionary update?

## Data engineering

- [ ] Does ingestion remain idempotent?
- [ ] Are bad rows dead-lettered, not dropped?
- [ ] Does it add indexes/partitions if needed ([DB scaling spec](../specs/database-architecture-scaling.md))?
- [ ] Does it avoid expensive public-page queries against raw facts?

## Accessibility

- [ ] Keyboard usable?
- [ ] Screen reader labels on interactive controls?
- [ ] Chart/table fallback for non-visual users?
- [ ] Color not the only signal?
- [ ] Focus visible?

## Ads

- [ ] No ad on sensitive pages (checkout-like, error, empty)?
- [ ] No ad inside result/product/deal cards?
- [ ] Ad labelled “Advertisement”?
- [ ] No accidental click risk?

## Tests

- [ ] Route tests
- [ ] Data contract tests
- [ ] Content lint (no backstage phrases)
- [ ] Accessibility smoke
- [ ] Interaction tests where behavior changed
- [ ] Performance/smoke if hot path

## Spec updates (when applicable)

- [ ] Page spec updated/created ([template](../templates/page-spec-template.md))
- [ ] Feature spec updated/created ([template](../templates/feature-spec-template.md))
- [ ] [Atomic gap registry](../roadmap/atomic-gap-registry.md) — close or add gaps
- [ ] Living specs in [docs/specs/](../specs/README.md) if principles changed

## Examples

**Pass:** Search PR replaces “Server-side cursor pagination” with “Showing results”, adds content lint test, closes `public-debug-copy` gap.

**Fail:** Market PR adds columns but no dictionary update, no route test, category links still use labels.

## Anti-patterns

- “Too small for a spec” on public-facing copy or metric changes.
- Merging with failing content lint for debug phrases.
- New `/api` public endpoint without cache/serving-layer note in DB spec.
