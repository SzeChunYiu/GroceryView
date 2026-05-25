# GroceryView

GroceryView is an npm-workspace monorepo for grocery price discovery: it combines source-backed product/catalog data, ingestion pipelines, comparison/ranking logic, and a Next.js web app so shoppers and operators can inspect grocery prices, source freshness, and confidence boundaries without inventing coverage.

## Screenshots

Screenshots are intentionally not checked into this README until they are captured from a current deployed or local build. For now, use these live/local routes as screenshot targets:

- Home and product discovery: [`/`](https://grocery-web-mu.vercel.app/) and `/products`
- Source/freshness ledger: `/data-sources`
- Store directory and maps: `/stores` and `/map`
- Country terms/guardrails: `/sweden/terms`, `/norway/terms`, `/iceland/terms`

When adding screenshots, include the capture date, route, environment, and any feature flag or data snapshot used.

## Supported countries

GroceryView must make honest country claims only:

- **Sweden (`SE`, SEK):** primary supported market in the current repository snapshot, with Swedish grocery/source pages and ingestion connectors represented in code.
- **Norway (`NO`, NOK), Denmark (`DK`, DKK), Finland (`FI`, EUR), Iceland (`IS`, ISK):** route/terms/readiness scaffolding exists where implemented, but public price/source coverage must stay blocked unless verified country-scoped connector rows exist.

Do not add country coverage, prices, freshness, or chain names to README copy unless the underlying code/data source exists in the repo.

## Quick start

Requirements:

- Node.js and npm compatible with the checked-in `package-lock.json`
- Docker, when running local Postgres/Redis/object storage services

Install and run the web app:

```sh
npm install
npm run dev -w @groceryview/web
```

Start and smoke-test local infrastructure when a change needs database, Redis, or object storage dependencies:

```sh
infra/scripts/smoke-local-services.sh
```

Useful focused checks:

```sh
npm run test -w @groceryview/web
npm run build -w @groceryview/web
npm run test -w @groceryview/ingestion
npm run typecheck
```

Repository-wide gates are available with:

```sh
npm run test
npm run build
npm run ingest:verify
```

## Monorepo layout

- [`apps/web`](apps/web): Next.js web application, app routes, route handlers, UI components, and web-only data helpers.
- [`apps/api`](apps/api): API service workspace.
- [`apps/jobs`](apps/jobs): job/worker workspace.
- [`apps/mobile`](apps/mobile): mobile app workspace.
- [`packages/ingestion`](packages/ingestion): source connectors, parsers, daily ingestion materialization, and provenance handling.
- [`packages/db`](packages/db): database types, query helpers, repositories, and migrations/seeding helpers.
- [`packages/core`](packages/core): shared grocery/domain logic.
- [`packages/catalog`](packages/catalog): catalog and commodity models.
- [`packages/ops`](packages/ops): operational readiness checks and reports.
- [`packages/server`](packages/server): server/API composition; see [`packages/server/README.md`](packages/server/README.md).
- [`scripts`](scripts): repository-level ingestion, ops, and verification commands.
- [`infra`](infra): Docker Compose services, infrastructure scripts, and DB migration assets.
- [`tests`](tests): repository-level tests outside a single workspace.

## Per-package docs and policy links

- [License](#license)
- [Code of conduct](#code-of-conduct)
- [Security policy](#security-policy)

## Per-package docs and contribution guides

- Contributor workflow: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Project standards for tested, documented, and optimized changes: [`docs/PROJECT_STANDARDS.md`](docs/PROJECT_STANDARDS.md)
- Server package notes: [`packages/server/README.md`](packages/server/README.md)
- Operational runbooks: [`docs/ops`](docs/ops)
- Ingestion scripts: [`scripts/ingestion`](scripts/ingestion)
- Operations scripts: [`scripts/ops`](scripts/ops)

If a package does not yet have a README, document public APIs near the code and link the new package README here when added.

## License

No top-level license file is currently present in this repository snapshot. Until maintainers add a license, do not assume rights beyond the repository host permissions granted to collaborators.

## Code of conduct

A dedicated `CODE_OF_CONDUCT.md` is not currently present. Contributors should keep discussion professional, specific, and evidence-based; use [`CONTRIBUTING.md`](CONTRIBUTING.md) for workflow expectations until a formal policy is added.

## Security policy

A dedicated `SECURITY.md` is not currently present. Do not open public issues with secrets, credentials, private user data, or exploitable details. Report sensitive findings privately to the maintainers through the repository owner's preferred private channel, and include reproduction steps, affected routes/packages, and any relevant logs with secrets redacted.
