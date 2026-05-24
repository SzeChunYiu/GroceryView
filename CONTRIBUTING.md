# Contributing to GroceryView

Thanks for helping improve GroceryView. This repository is an npm workspace monorepo with the web app, API/server packages, ingestion connectors, database adapters, ops scripts, and shared domain packages.

## Quick local setup

1. Install the runtime used by CI: Node.js 22 and npm.
2. Install dependencies from the repository root:

   ```bash
   npm ci
   ```

3. Copy the example environment when you need local services or app runtimes:

   ```bash
   cp .env.example .env
   ```

4. Start and verify the local infrastructure stack before API, worker, scanning, or database work:

   ```bash
   infra/scripts/smoke-local-services.sh
   ```

   This is the local-dev setup/smoke script for the repo. It starts `infra/docker-compose.yml` services for PostgreSQL/PostGIS, Redis, and MinIO, then verifies Postgres readiness, Redis `PING`, and the configured object-storage bucket. See `infra/README.md` for environment overrides and troubleshooting.

5. Run the workspace you are editing. Common entry points:

   ```bash
   npm run build
   npm test
   npm run typecheck
   npm run ops:daily-connectors
   npm run ingest:verify
   ```

   For package-scoped work, prefer workspace commands such as:

   ```bash
   npm run test -w @groceryview/ingestion
   npm run build -w @groceryview/server
   npm run test -w @groceryview/web
   ```

## Branching

- Branch from the latest `origin/main`:

  ```bash
  git fetch origin main
  git checkout -B <short-topic-branch> FETCH_HEAD
  ```

- Use descriptive branch names, for example `docs/contributing`, `connector/apotek1-source-evidence`, or `ranker/organic-guardrails`.
- Keep branches focused on one issue or PR-sized change.
- Never force-push shared branches unless you own the PR branch and are only rewriting your own work.

## Commit-message convention

Use short imperative subject lines:

```text
Add Apotek 1 source evidence
Document products API endpoint
Guard organic ranker confidence inputs
```

Guidelines:

- Keep the subject under about 72 characters.
- Start with an imperative verb: `Add`, `Fix`, `Document`, `Refactor`, `Guard`, `Validate`.
- Mention the affected area when helpful: `ingestion`, `server`, `web`, `db`, `docs`.
- Do not include secrets, tokens, customer data, or raw provider payloads in commits.

## Pull requests

Open a PR against `main`. Use this template in the PR body:

```markdown
## Summary
- 
- 

## Evidence / Tests
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run typecheck`
- [ ] Package-specific command(s): `<command>`
- [ ] Not run: `<reason>`

## Risk and rollout
- Data/backfill impact:
- User-facing impact:
- Rollback plan:

## Checklist
- [ ] Branch is based on latest `origin/main`
- [ ] Public API or behavior changes are documented
- [ ] Connector changes include source, robots/legal, provenance, and fixture notes
- [ ] Ranker changes include guardrails and regression coverage
- [ ] No secrets or raw sensitive payloads are committed
```

CI runs tests, builds, typechecking, bundle budgets, Lighthouse budgets, and release validation. If you intentionally skip a local command, say why in the PR.

## How to add a connector

Most ingestion work lives in `packages/ingestion/src/connectors/` and is exported from `packages/ingestion/src/index.ts`.

1. Confirm the source is allowed before fetching live data.
   - Record source URLs, robots policy, legal review status, and data-agreement status where applicable.
   - Prefer fixture or stub work until the gate is approved.
2. Add a focused connector module under `packages/ingestion/src/connectors/<chain-or-source>.ts`.
   - Keep HTTP URL builders and pure parsers separately testable.
   - Preserve source provenance: source URL, captured time, parser version, raw snapshot reference, and content hash when available.
   - Do not commit raw provider payloads if licensing or privacy is unclear.
3. Export the connector from `packages/ingestion/src/index.ts`.
4. Add fixture-based tests in `packages/ingestion/src/__tests__/ingestion.test.ts` or a connector-specific test file.
5. If the connector participates in daily ingestion, update the daily connector configuration and verify with:

   ```bash
   npm run ops:daily-connectors
   npm run ops:daily-connector-stores
   npm run ingest:verify
   ```

6. For live smoke work after approval, follow `infra/README.md#retailer-connector-smoke` and use bounded pulls with timeouts.

Connector PRs should explicitly state:

- source surface and URLs;
- approval/legal/robots status;
- parser version and provenance fields;
- fixture coverage and any skipped live-smoke reason;
- expected row counts or minimum accepted rows if wired into daily ingestion.

## How to add a ranker

Rankers and ranking guardrails usually live in `packages/core/src/index.ts`, with API exposure in `packages/api/src/index.ts`, server routes in `packages/server/src/index.ts`, and UI integration under `apps/web/src/`.

1. Define the ranker input and output types in the smallest shared package that needs them, usually `@groceryview/core`.
2. Keep the ranking function pure and deterministic:
   - no network calls;
   - no wall-clock reads unless `asOf` is an explicit input;
   - stable tie-breakers such as product name, chain id, or store id;
   - explicit handling for missing prices, stale data, low confidence, and sponsored placements.
3. Add guardrails to the output when ranking could be misread by users or downstream automation.
4. Add regression tests in the package that owns the ranker, for example `packages/core/src/__tests__/dealScore.test.ts` or a new focused test file.
5. Wire the ranker outward only after core behavior is covered:
   - API DTO and fixtures in `packages/api`;
   - server route/OpenAPI docs in `packages/server` if public;
   - UI copy and empty states in `apps/web` if user-facing.
6. Document any public endpoint, user-facing ranking explanation, or operational implication in `docs/`.

Ranker PRs should include examples that prove both the happy path and failure/guardrail paths, especially sponsored separation, confidence thresholds, missing data, and deterministic ties.

## Documentation changes

Documentation-only PRs still need a reviewable scope. Link docs to concrete code paths where possible, and keep examples aligned with current route names, package scripts, and workflow names.

## Security and data handling

- Never commit production secrets, bearer tokens, signed upload URLs, customer data, or raw restricted provider payloads.
- Use `.env.example` for names and safe defaults only.
- Prefer generated evidence summaries over raw bodies for connector and hosted-smoke artifacts.
- When adding logs, avoid sensitive request headers, cookies, session ids, and personally identifiable data.
