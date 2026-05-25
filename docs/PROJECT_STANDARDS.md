# Project Standards

Every GroceryView pull request must leave each changed atom tested, documented,
and optimized. An atom is any component, function, route, API, connector, ranker,
promotion parser, migration, cron job, button, or other independently reviewable
unit of behavior.

## Required Evidence

PRs must include concrete evidence for the atoms they touch. Link or name the
test, doc, benchmark, story, API entry, migration comment, or reviewer note that
proves each standard below is satisfied. Unknown coverage is a blocker, not a
green check.

## Tested

- Unit tests cover the happy path and at least one edge case for each changed
  atom.
- User-facing changes include at least one Playwright or equivalent end-to-end
  test that exercises the visible workflow.
- User-facing pages pass axe accessibility checks with zero violations on the
  page where the atom lives.
- Data-touching changes include fixture-based integration coverage.
- Security-sensitive changes include focused tests or verification evidence for
  the affected auth, API, user-data, or ingestion boundary.

## Documented

- New or materially changed source files start with a JSDoc or module comment
  covering purpose, public API, important edge cases, and dependencies.
- Components have Storybook stories for default, with-data, and edge-case
  states when Storybook coverage exists for the owning app or package.
- APIs have entries under `docs/api/` with request and response shape plus at
  least one example.
- Connectors have entries under `docs/connectors/` with source URL, parsing
  notes, freshness expectations, confidence boundaries, and edge cases.
- Rankers and algorithms have entries under `docs/algorithms/` with formula,
  inputs, outputs, and sample results.
- Migrations include a comment naming the ADR or issue that explains the schema
  decision.
- New scripts, routes, schemas, and public package APIs are linked from the
  nearest README or operations runbook.

## Optimized

- Lighthouse results do not regress against main beyond the budgets in
  `docs/performance/budgets.md` when the change affects rendered web
  experiences.
- New dependencies are justified in the PR description with why an existing
  dependency or platform API is insufficient.
- Hot render paths are memoized, split, or lazy-loaded when measurements or
  component shape show they can rerender frequently.
- Database queries are indexed where needed and do not introduce N+1 access
  patterns.
- Cacheable API responses set `Cache-Control` and an `ETag`.
- Failures are explicit and observable. Do not swallow exceptions silently or
  hide command failures with redirection such as `2>/dev/null`.

## Enforcement

- The PR template requires authors to acknowledge tested, documented, and
  optimized evidence.
- CI runs typecheck, lint where configured, unit tests, E2E checks where
  available, Lighthouse budgets where applicable, axe coverage where applicable,
  and repository schema tests.
- Reviewers verify that required docs entries exist before approval.
- Any missing standard must be called out in the PR with a follow-up issue or a
  maintainer-approved reason it does not apply.

## Review Checklist

Use this checklist before requesting review:

- Tested: every changed atom has unit coverage, and user-facing/data-touching
  atoms have the required higher-level coverage.
- Documented: public behavior, APIs, connectors, algorithms, migrations, and
  operational changes are discoverable from the relevant docs.
- Optimized: performance, dependency, database, cache, and failure-mode impacts
  are measured or explicitly bounded.
