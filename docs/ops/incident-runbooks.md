# GroceryView executable incident runbooks

Every incident below has an executable status check. The checks avoid fabricated metrics: they only report values observed from configured endpoints, the local repository, or environment variables. If required credentials are absent, the check returns `unknown` with the missing prerequisite instead of inventing health.

Run all checks:

```bash
node scripts/ops/check-incident-runbooks.mjs
```

Run one check:

```bash
node scripts/ops/check-incident-runbooks.mjs --incident ingestion-failure
```

The command exits non-zero only when a check observes a failing condition. `unknown` means the operator must supply the listed env var or endpoint before making a production claim.

## 1. Ingestion failure

**Symptoms**: daily connector job failed, zero accepted rows, missing `raw_records`, or CI ingestion verifier regressed.

**Immediate checks**

```bash
node scripts/ops/check-incident-runbooks.mjs --incident ingestion-failure
npm run ingest:verify
```

**Triage**
1. Open the latest ingestion workflow/job log and identify the first failing connector.
2. Run `npm run ops:daily-connectors` to confirm the connector config still resolves.
3. If the failure is source-specific, pause only that connector in the scheduler/config; do not disable unrelated sources.
4. Verify `rawSnapshotRef`, `sourceUrl`, `parserVersion`, and accepted/rejected row counts are present before replaying.
5. Re-run the ingestion verifier and compare accepted counts against the previous successful run.

**Recovery evidence**: successful ingestion verifier output, non-zero accepted rows for the repaired connector, and fresh provenance for replayed rows.

## 2. DB outage

**Symptoms**: app APIs return connection errors, ingestion cannot write, Supabase/Postgres health is degraded.

**Immediate checks**

```bash
node scripts/ops/check-incident-runbooks.mjs --incident db-outage
npm run ops:check-daily-db-connectivity
npm run ops:check-supabase-health
```

**Triage**
1. Confirm whether `DATABASE_URL`/`GROCERYVIEW_DATABASE_URL` is configured for the affected environment.
2. Check provider health and connection limits before restarting writers.
3. If migrations recently ran, inspect `npm run ops:db-recovery-packet` before rollback.
4. Stop non-critical ingestion jobs if connection saturation is observed.
5. Restore read path first, then re-enable write/replay jobs.

**Recovery evidence**: successful `select 1` connectivity check, provider health normal, app API read path returns 2xx.

## 3. Stale data

**Symptoms**: shopper pages show old observations, freshness badges exceed SLO, source rows are not updating.

**Immediate checks**

```bash
node scripts/ops/check-incident-runbooks.mjs --incident stale-data
```

Set `GROCERYVIEW_FRESHNESS_URL` to a JSON endpoint that returns one of `latestObservedAt`, `generatedAt`, `observedAt`, or `updatedAt` when checking production freshness.

**Triage**
1. Confirm latest observed timestamp from the freshness endpoint or DB query.
2. Compare stale source(s) with source health/admin pages; do not claim coverage from stale rows.
3. Run the affected connector in dry-run/snapshot mode and inspect parser errors.
4. If only one chain is stale, suppress that chain's public freshness claim until repaired.
5. Replay successful connector output only when source provenance is newer than the stale threshold.

**Recovery evidence**: freshness endpoint timestamp within SLO and UI freshness/confidence labels updated from real observed rows.

## 4. Vercel deploy failure

**Symptoms**: production deployment failed, preview is red, or release is stuck on an old build.

**Immediate checks**

```bash
node scripts/ops/check-incident-runbooks.mjs --incident vercel-deploy-failure
```

Set `GROCERYVIEW_DEPLOY_URL` to the production or preview URL. The check records HTTP status and Vercel headers when present.

**Triage**
1. Open the failing Vercel build log and identify the first build/typecheck error.
2. Verify env var presence with `npm run ops:validate-production-env` before redeploying.
3. If production is still serving the previous healthy deployment, avoid emergency rollback.
4. If production is broken, promote the last known-good deployment and open a fix PR.
5. Confirm canonical routes and health-sensitive admin pages return 2xx after redeploy.

**Recovery evidence**: Vercel deployment is ready, target URL returns 2xx/3xx, and no required production env check is failing.

## 5. Bad source parser

**Symptoms**: connector accepted zero rows, duplicate conflicts spike, parser throws on changed source markup/API JSON.

**Immediate checks**

```bash
node scripts/ops/check-incident-runbooks.mjs --incident bad-source-parser
npm run ops:daily-connectors
```

Set `GROCERYVIEW_PARSER_SAMPLE_URL` to a source URL when a live parser sample should be fetched.

**Triage**
1. Capture and hash the failing source snapshot before editing parser logic.
2. Compare parsed row count, required fields, and `rawSnapshotRef` against the previous passing snapshot.
3. If parsing changed source semantics, add/update a fixture before resuming live ingestion.
4. Keep the affected source disabled or confidence-blocked until fixture and live sample both pass.
5. Verify duplicate conflict alerts on the admin source dashboard after replay.

**Recovery evidence**: fixture/live parser check returns required fields, duplicate alert level normalized, and provenance remains intact.

## 6. API latency spike

**Symptoms**: API route p95/p99 exceeds SLO, Vercel function duration spikes, users report slow search/compare pages.

**Immediate checks**

```bash
node scripts/ops/check-incident-runbooks.mjs --incident api-latency-spike
```

Set `GROCERYVIEW_API_HEALTH_URL` to the slow endpoint or health route. Optional `GROCERYVIEW_API_LATENCY_BUDGET_MS` defaults to `1500`.

**Triage**
1. Check whether the spike is global or route-specific using Vercel/provider metrics.
2. Probe the slow endpoint with the executable check from the same region/network when possible.
3. Inspect DB wait/IO with `npm run ops:db-io-hotspots` if DB-backed routes are slow.
4. Temporarily lower expensive result limits or disable non-critical enrichment if the route is shopper-facing.
5. Re-test latency and confirm no stale/fabricated fallback data was shown.

**Recovery evidence**: endpoint response time below budget, provider p95 normalized, and DB hotspot report no longer shows the route query as degraded.
