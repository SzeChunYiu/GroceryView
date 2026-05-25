# Contributing to GroceryView

GroceryView is an npm-workspace monorepo for grocery price discovery, comparison,
ingestion, ranking, and operations tooling. It includes a Next.js web app plus
shared packages for catalog, ingestion, API, analytics, auth, database, jobs, and
ops workflows.

## Repository map

- `apps/web`: Next.js web UI (`@groceryview/web`). Routes live in
  `apps/web/src/app`; shared web UI and helpers live in `components`, `hooks`,
  `lib`, and `types`.
- `apps/api`, `apps/jobs`, `apps/mobile`: service, job, and mobile workspaces.
- `packages/ingestion`: retailer/source connectors, parsing, daily ingestion,
  and provenance materialization.
- `packages/core`, `packages/catalog`, `packages/db`, `packages/ops`, and other
  `packages/*`: shared business logic, schemas, adapters, and operational checks.
- `scripts/`: repo-level ingestion, ops, and verification commands.
- `infra/`: local Docker services, database migrations, and infrastructure notes.
- `tests/`: repository-level tests not owned by one workspace.

## Local development setup

Use npm; the repository is configured with `package-lock.json` and npm
workspaces.

```sh
npm install
npm run dev -w @groceryview/web
```

When your change needs local Postgres, Redis, or object storage, run the local
service setup/smoke script:

```sh
infra/scripts/smoke-local-services.sh
```

The script starts the Docker Compose services from `infra/docker-compose.yml`,
waits for Postgres/Redis/MinIO health, initializes the raw bucket, and prints
service diagnostics if a dependency fails to become ready.

Useful focused checks:

```sh
npm run test -w @groceryview/web
npm run build -w @groceryview/web
npm run test -w @groceryview/ingestion
npm run test -w @groceryview/db
npm run typecheck
```

Before opening a broad PR, prefer the affected workspace tests first, then run
broader checks if the change touches shared contracts:

```sh
npm run test
npm run build
npm run ingest:verify
```

## Branching and commit messages

- Branch from the current `origin/main` unless a maintainer asks for a stacked
  branch.
- Use short, ticket-oriented branch names such as `ticket-cn070-p28-1234` or
  `feat/connector-willys-promotions`.
- Keep each branch atomic: one ticket, one fix, or one feature slice.
- Commit messages should use an imperative subject and optional scope, for
  example:
  - `Add Coop weekly discount parser`
  - `Fix basket comparison freshness label`
  - `docs: expand connector runbook`
- Do not mix generated data, formatting-only changes, and feature code unless
  the ticket explicitly requires them together.

## How to add a connector

1. Add or update the connector in `packages/ingestion/src/connectors/`.
2. Keep parsing pure where possible: expose URL builders, parser functions, and
   fetch functions separately so tests can pass fixture HTML/JSON without live
   network access.
3. Return real source fields only: source URL, retrieved timestamp, product or
   store identifiers, currency, country, availability, and price text/number as
   observed. Do not fabricate prices, stores, freshness, or coverage.
4. Materialize connector output through `packages/ingestion/src/index.ts` when it
   participates in daily ingestion. Preserve `sourceUrl`, `parserVersion`,
   `rawSnapshotRef`, `chainId`, domain, and store scope.
5. Add focused tests in `packages/ingestion/src/__tests__/ingestion.test.ts` or a
   nearby test file. Fixture tests should cover parsing, deduplication, required
   fields, and daily materialization when applicable.
6. If the connector needs local services or ops visibility, document the command
   in `scripts/ops/` or the relevant `docs/ops/` runbook.

## How to add a ranker

1. Put reusable ranking/scoring logic in the narrowest shared module that owns
   the data shape, usually `packages/core`, `packages/catalog`, or
   `apps/web/src/lib` for web-only presentation rankers.
2. Define explicit inputs, output fields, tie-breakers, and confidence/freshness
   labels. Ranking must degrade to “not enough evidence” instead of filling gaps
   with synthetic values.
3. Keep deterministic sorting: after score comparisons, add stable tie-breakers
   such as label, slug, product id, or observed timestamp.
4. Add tests for score boundaries, missing data, ties, stale evidence, and any
   country/domain filters.
5. Surface ranker caveats in the UI when results depend on limited coverage,
   community observations, or non-branch-scoped data.

## Pull request checklist and template

Use this structure in PR descriptions:

```md
## Summary
- What changed?
- Which route/package/script owns the change?

## Evidence
- Tests/checks run, or why they were intentionally skipped.
- Source fixtures, real endpoints, DB migrations, or UI screenshots when useful.

## Risk and rollback
- Data/source claims affected.
- How to disable, revert, or gate the change if CI/production catches an issue.
```

PR expectations:

- Link the issue (`Closes owner/repo#123` when applicable).
- Include screenshots for visible web UI changes.
- Include fixtures or executable checks for docs/runbook/ops changes; docs-only
  PRs should still point to a command, config, route, or UI evidence when the
  docs describe operational behavior.
- Note any skipped local checks. CI still needs to run the required gates.

## Data and source-claim rules

- Real data only: no fabricated prices, stores, source names, metrics, coverage,
  freshness, or rankings.
- Show confidence, caveats, and freshness wherever a source can be incomplete,
  stale, community-sourced, or not branch-scoped.
- Keep country/domain filters explicit. Nordic pages must list only actual
  connectors for that country and must fail closed for markets without verified
  rows.
- Do not infer branch prices, inventory, checkout totals, or loyalty pricing from
  chain-wide catalogues, location records, or metadata-only sources.

## Public top-level modules

- Apps: `@groceryview/web`, `@groceryview/api`, `@groceryview/jobs`, and
  `@groceryview/mobile`.
- Shared packages: `@groceryview/analytics`, `@groceryview/api-contracts`,
  `@groceryview/auth`, `@groceryview/catalog`, `@groceryview/core`,
  `@groceryview/db`, `@groceryview/geo`, `@groceryview/image-cache`,
  `@groceryview/ingestion`, `@groceryview/monetization`,
  `@groceryview/notifications`, `@groceryview/ops`, `@groceryview/scanning`, and
  `@groceryview/server`.
