# Versioning and roadmap process

## Purpose

Every feature and page has a **maturity level** so the team knows what “done” means and what gaps remain. PRs advance maturity; the [atomic gap registry](../roadmap/atomic-gap-registry.md) tracks unfinished atoms.

## Feature maturity levels

| Level | Name | Meaning |
|-------|------|---------|
| 0 | idea | Problem named, no spec |
| 1 | spec | Page/feature spec exists |
| 2 | scaffold | Route/component exists, may use fixtures |
| 3 | connected | Reads real serving data |
| 4 | evidence-backed | Freshness/confidence/source shown |
| 5 | tested | Route, data, a11y tests |
| 6 | polished | UI/UX + mobile pass |
| 7 | measured | Analytics events + dashboard |
| 8 | production-ready | Ops gates, performance, docs complete |

## Page maturity checklist

Each public page should eventually satisfy:

- [ ] `page_spec_exists`
- [ ] `data_contract_exists`
- [ ] `copy_reviewed` (content-style)
- [ ] `uiux_reviewed`
- [ ] `accessibility_reviewed`
- [ ] `analytics_events_defined`
- [ ] `tests_exist`

Track gaps in [atomic gap registry](../roadmap/atomic-gap-registry.md) when any item is unchecked.

## PR requirements

Every PR touching a **public page** must update when applicable:

| Change type | Update |
|-------------|--------|
| Behavior / layout | Page spec (or create from [template](../templates/page-spec-template.md)) |
| Metric visible to users | [Metric dictionary](./metric-dictionary.md) |
| Data source / contract | Data engineering or quality spec + connector doc |
| Copy standards | Content-style rules / i18n seeds |
| New gap found or closed | [Atomic gap registry](../roadmap/atomic-gap-registry.md) |

## Quarterly review agenda

UX quality · data quality · search quality · database health · analytics metrics · ad placement · accessibility · SEO · performance

## Examples

**Good:** PR fixing market 3M/1Y columns updates metric dictionary examples, market page spec, gap registry (`market-table-missing-3m-1y` → done), and route test.

**Good:** New `/fuel` grade filter ships with feature spec, events `fuel_grade_selected`, maturity 5+ before marketing link from home.

## Anti-patterns

- Merging UI changes with no spec update “because it’s small.”
- Closing gaps in code without updating registry status.
- Shipping maturity 7 (measured) without dictionary entry for new KPIs.

## Required tests

- `atomic-gap-registry.test.mjs` — registry file valid, IDs unique, required fields present.
- CI optional: feature registry lint when `docs/roadmap/feature-registry.md` is added.

## PR update checklist

- [ ] Set maturity level in PR description for affected routes
- [ ] Link gap IDs closed: `Fixes gap: search-category-label-url`
- [ ] Schedule quarterly review item if new systemic debt found
