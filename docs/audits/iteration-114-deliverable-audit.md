# Iteration 114 Deliverable Audit — Daily Database Ingestion Runner

## Objective restatement

Make the database-backed ingestion path executable every day, fail closed when the deployed PostgreSQL database or daily source runs are not healthy, and require configured daily product connectors for every priority chain before the cron can claim success.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Database is set | `.github/workflows/daily-ingestion.yml` runs the existing deployed PostgreSQL readiness check after the ingest job; `npm run test -w @groceryview/db` verifies schema, migrations, repository adapters, and source-run freshness logic. | Implemented / verified |
| Ingest data every day | `.github/workflows/daily-ingestion.yml` runs on cron `17 3 * * *` and adds `Run configured daily ingestion`, which builds DB + ingestion packages and executes `node packages/ingestion/dist/index.js`. | Implemented / verified |
| Persist daily ingest rows to DB | `packages/ingestion/src/index.ts` adds `runDailyIngestionFromEnv`, `runDailyIngestion`, DB-backed source-run/raw-record/price-observation persistence, product and chain upserts, and JSON result status. | Implemented / verified |
| All priority chains must be configured | `requiredDailyIngestionChainIds` requires `ica`, `willys`, `coop`, `hemkop`, `lidl`, and `city_gross`; `buildDailyConnectorConfigsFromEnv` fails closed if any are missing. | Implemented / verified |
| All branches / all stores readiness stays fail-closed | Existing source-run readiness endpoint is still checked in the workflow after ingestion and blocks on missing fresh chain runs. This does not prove every physical branch has prices yet. | Partially covered; branch-level price completeness remains a data-source blocker |
| All products from all stores ready | Runner can persist accepted products from configured connectors, but actual completeness depends on external connector payloads and source coverage. | Not complete; needs live connector payloads and coverage audits |
| PR and merge to main after the round | This branch is the round vehicle; merge must happen after verification passes. | Pending after verification |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test -w @groceryview/ingestion` | Pass: 65 tests, including daily config completeness and DB persistence tests |
| `rtk npm run test -w @groceryview/db` | Pass: 97 tests, including schema/migration/repository/source-run readiness tests |
| `rtk node --test tests/schema/daily-ingestion-workflow.test.mjs` | Pass: workflow schedule/readiness contract |
| `rtk npm run test -w @groceryview/web` | Pass: 5 verified-data UI tests |
| `rtk npm run build -w @groceryview/web` | Pass: Next build generated 197 static pages |
| `rtk npm run typecheck` | Pass |
| `rtk npm test` | Pass: full workspace tests |
| `rtk npm run build` | Pass: full workspace build |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- The cron now executes a real DB-backed daily ingestion runner, but production still needs `DATABASE_URL` and `GROCERYVIEW_DAILY_CONNECTORS_JSON` secrets populated with all required chain connectors.
- The runner requires all priority chains, but it cannot prove every branch/store/product is complete unless the configured connector payloads contain those rows and a coverage verifier checks them.
- Per-branch price coverage is still externally blocked for sources that only expose chain-wide prices or require additional discovery, especially ICA/Coop/Lidl/City Gross branch-specific coverage.
