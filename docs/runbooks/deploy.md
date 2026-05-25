# Production deploy runbook

This runbook covers the two production surfaces for GroceryView:

- **Vercel production deploy** for the hosted web/server artifact.
- **LUNARC ingestion operation** for the daily PostgreSQL-backed price ingestion lane.

The source of truth for deploy gates is `.github/workflows/deploy.yml`; the source of truth for daily ingestion gates is `.github/workflows/daily-ingestion.yml`.

## Pre-flight checks

Before starting a production deploy, confirm:

1. `main` is green in CI and all required checks have passed.
2. The GitHub `production` environment has the secrets/variables required by `.github/workflows/deploy.yml`, especially:
   - Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
   - Runtime/API: `DATABASE_URL`, `AUTH_SECRET`, `PUBLIC_WEB_URL`, `GROCERYVIEW_API_BASE_URL`, `GROCERYVIEW_SERVER_URL`, `METRICS_TOKEN`.
   - Ingestion/readiness: `GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN`, `CATALOG_COVERAGE_TARGETS_JSON`.
   - Provider credentials used by production readiness: SendGrid, Expo, OCR.space, OpenFoodFacts, Stripe, and S3-compatible scan upload secrets.
3. A deploy workflow run can complete these gates in order:
   - `npm ci`
   - `npm run ops:check-production-secrets -- --from-env`
   - `npm test`
   - DB-backed site snapshot export
   - `npm run build`
   - `npm run typecheck`
   - Vercel pull/build/deploy
   - post-deploy hosted HTTP, readiness, and scanner-upload smokes
4. The daily ingestion workflow has a recent successful run, or the current deploy explicitly accepts that ingestion will be verified immediately after release.

## Deploy to Vercel production

Preferred path: use the GitHub Actions **Deploy** workflow on `main`.

1. Open GitHub Actions -> **Deploy**.
2. Start `workflow_dispatch` on `main` or wait for the push-to-`main` run.
3. Watch the `Verify and deploy from manifest` job. It publishes through:

   ```sh
   npx --yes vercel@latest pull --yes --environment=production --token "$VERCEL_TOKEN"
   npx --yes vercel@latest build --prod --token "$VERCEL_TOKEN"
   npx --yes vercel@latest deploy --prebuilt --prod --token "$VERCEL_TOKEN"
   ```

4. Treat the deploy as complete only after the post-deploy smoke artifacts are uploaded:
   - `deploy-hosted-http-smoke.json`
   - `deploy-hosted-readiness-smoke.json`
   - `deploy-hosted-scanner-upload-smoke.json`

If the workflow stops before Vercel deploy, fix the failed pre-flight rather than deploying manually. If it deploys but a post-deploy smoke fails, follow the rollback section.

## Run or verify LUNARC ingestion

Daily ingestion normally runs from GitHub Actions at `17 3 * * *`. It applies DB migrations, runs configured connectors, exports DB-backed site data, and checks deployed readiness endpoints.

When an operator must inspect or run ingestion from LUNARC, first ensure the persistent SSH control socket is available:

```sh
ssh -O check lunarc 2>/dev/null && echo "Connected" || /Users/billy/lunarc-init.sh
```

Then SSH to LUNARC and work from the GroceryView checkout used by operations. Required environment must include `DATABASE_URL` plus the same daily-ingestion configuration used by CI. The workflow commands to mirror are:

```sh
npm run --silent ops:check-production-secrets -- --from-env --scope daily-ingestion
npm run --silent ops:validate-production-env -- --scope daily-ingestion
npm run --silent ops:check-daily-db-connectivity
npm run --silent ops:apply-db-migrations
npm run build -w @groceryview/db
npm run build -w @groceryview/ingestion
npm run --silent ops:daily-connectors >/tmp/groceryview-daily-connectors.json
GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE=/tmp/groceryview-daily-connectors.json \
  node packages/ingestion/dist/index.js >/tmp/daily-ingestion-result.json
npm run --silent ingest:export-db-snapshot
```

After ingestion, verify the deployed app reads the same database target and has complete freshness/coverage:

```sh
curl -fsS -H "x-groceryview-metrics-token: ${METRICS_TOKEN}" \
  "${GROCERYVIEW_SERVER_URL%/}/api/readiness/postgres"
curl -fsS -H "x-groceryview-metrics-token: ${METRICS_TOKEN}" \
  "${GROCERYVIEW_SERVER_URL%/}/api/readiness/source-runs"
curl -fsS -H "x-groceryview-metrics-token: ${METRICS_TOKEN}" \
  "${GROCERYVIEW_SERVER_URL%/}/api/readiness/catalog-coverage"
```

Save JSON diagnostics from failed LUNARC runs before retrying; the CI workflow uploads the same evidence as artifacts.

## Rollback

Rollback is required when production traffic is broken, readiness is blocked after deploy, or the deployed artifact reads the wrong database.

1. In Vercel, promote the last known-good production deployment, or redeploy the previous known-good commit from GitHub Actions.
2. Confirm the hosted web route and API health recover:

   ```sh
   infra/scripts/smoke-hosted-http.sh
   infra/scripts/smoke-hosted-readiness.sh
   node infra/scripts/smoke-hosted-scanner-upload.mjs
   ```

3. If rollback involves database state, stop daily ingestion before making further writes. Use the DB recovery/cutover diagnostics from the daily ingestion workflow before changing `DATABASE_URL`.
4. If a new daily ingestion run wrote bad observations, preserve `/tmp/daily-ingestion-result.json`, `codex-tasks/ingestion-blockers.txt`, and DB IO hotspot artifacts, then repair via an audited data correction or restore path.
5. Record the rolled-back deployment id, commit SHA, failed smoke artifact, and recovery evidence in the incident channel or release notes.

## Common failure modes

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Secret audit fails before deploy | Missing GitHub `production` secret or variable | Add the missing value, rerun Deploy, do not bypass the workflow. |
| Vercel build fails | Workspace build or Vercel env mismatch | Check the Deploy log around `vercel build --prod`; compare `vercel.json` and `deploy/groceryview.manifest.json`. |
| Hosted HTTP smoke fails | Web/API route unavailable or wrong production URL | Verify `GROCERYVIEW_API_BASE_URL`, `GROCERYVIEW_PRODUCTION_URL`, and Vercel deployment alias. |
| `/api/readiness/postgres` blocked | Deployed app cannot reach the expected PostgreSQL target | Compare readiness `target` with the daily DB connectivity artifact; fix `DATABASE_URL` or rollback. |
| Source-run readiness blocked | No fresh successful chain run or accepted-row threshold not met | Inspect `/tmp/daily-ingestion-result.json` and `codex-tasks/ingestion-blockers.txt`; rerun ingestion only after connector/config issues are fixed. |
| Catalog coverage incomplete | `CATALOG_COVERAGE_TARGETS_JSON` does not match live products/stores or observations are missing | Regenerate targets with `npm run ops:catalog-coverage-targets` and verify connector store coverage before updating production config. |
| Scanner upload smoke fails | S3-compatible scan upload config or scanner bearer token is wrong | Check `S3_*`, `GROCERYVIEW_SCANNER_USER_ID`, and `GROCERYVIEW_SCANNER_BEARER_TOKEN`; rerun hosted smoke after fix. |
| LUNARC SSH fails | Control socket expired | Run `ssh -O check lunarc 2>/dev/null && echo "Connected" || /Users/billy/lunarc-init.sh`, then retry. |
