# GroceryView project standards

Every PR must prove each changed atom is tested, documented, and optimized before merge. An atom is any component, function, route, API, connector, ranker, promotion parser, migration, cron job, or button.

## Tested

- At least one unit test covers the happy path and one edge case.
- User-facing work has at least one Playwright/E2E test that exercises the behavior.
- A11y checks pass axe with zero violations on the page where the atom lives.
- Data-touching work has a fixture-based integration test.

## Documented

- Each file starts with a JSDoc block covering purpose, public API, edge cases, and dependencies.
- Components include Storybook stories for default, with-data, and edge-case states.
- APIs have `docs/api/<name>.md` entries with request/response shapes and examples.
- Connectors have `docs/connectors/<chain>.md` entries with source URL, parsing notes, and edge cases.
- Rankers and algorithms have `docs/algorithms/<name>.md` entries with formula and sample outputs.
- Migrations include a comment naming the ADR they implement.

## Optimized

- No measurable Lighthouse regression versus `main`; the budget lives in `docs/performance/budgets.md`.
- No new dependency unless the PR description justifies it.
- Memoize or lazy-load atoms on hot render paths.
- Database queries are indexed and never N+1.
- Cacheable API responses set `Cache-Control` and `ETag`.
- No silent failures: do not hide errors with `2>/dev/null` or try/catch-swallow patterns.

## Enforcement

- The PR template asks authors to check: tested, documented, optimized.
- CI gates typecheck, lint, unit tests, E2E, Lighthouse budget, and axe; any failure is red.
- A human or AI reviewer verifies the required docs entry exists.

## Cadence

This is not a one-off cleanup. Every new PR must clear this bar forever.
