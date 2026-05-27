# Incident response runbook

Use this runbook when GroceryView production behavior may be wrong, unsafe, slow, or stale. The goal is to protect shoppers from bad decisions while preserving enough evidence to repair the system without guessing.

## First 15 minutes

1. Name an incident lead and one scribe. Keep one active decision thread.
2. Classify severity:
   - **SEV-1:** security exposure, widespread wrong prices, checkout-affecting outage, or public trust issue.
   - **SEV-2:** ingestion freshness or correctness degraded for one major chain/country, important route slow or failing, or support-visible price complaints.
   - **SEV-3:** isolated connector, stale non-critical data, or recoverable performance warning.
3. Capture current evidence before retrying:
   - failing alert or user report
   - deployment SHA and PR range
   - affected route, country, chain, store, product, user segment, or source run
   - screenshots or JSON response bodies
   - workflow/artifact links
4. Decide whether to freeze changes:
   - pause deploys for SEV-1 and active SEV-2 incidents
   - pause daily ingestion if price correctness or source-run writes are suspect
   - pause alert/digest sends if user-facing notifications may be wrong
5. Open or update the incident record with owner, severity, start time, impact, mitigation, and next update time.

## Shared commands

Check production health and readiness:

```sh
curl -fsS "${GROCERYVIEW_SERVER_URL%/}/api/health"
curl -fsS -H "x-groceryview-metrics-token: ${METRICS_TOKEN}" \
  "${GROCERYVIEW_SERVER_URL%/}/api/readiness/postgres"
curl -fsS -H "x-groceryview-metrics-token: ${METRICS_TOKEN}" \
  "${GROCERYVIEW_SERVER_URL%/}/api/readiness/source-runs"
curl -fsS -H "x-groceryview-metrics-token: ${METRICS_TOKEN}" \
  "${GROCERYVIEW_SERVER_URL%/}/api/readiness/catalog-coverage"
```

Check deploy and daily-ingestion workflow evidence:

```sh
gh run list --workflow deploy.yml --limit 5
gh run list --workflow daily-ingestion.yml --limit 10
gh run view <run-id> --log-failed
gh run download <run-id> --dir /tmp/groceryview-incident-evidence
```

Create a local evidence bundle:

```sh
mkdir -p /tmp/groceryview-incident
date -u +"%Y-%m-%dT%H:%M:%SZ" > /tmp/groceryview-incident/captured-at.txt
git rev-parse HEAD > /tmp/groceryview-incident/local-sha.txt
```

## Scenario: ingestion alarm fires

Trigger examples: daily-ingestion workflow failed, source-run readiness blocked, accepted-row threshold missing, connector error rate spike, or catalog coverage gap opened.

Checklist:

1. Identify the alarm source:
   - GitHub Actions `daily-ingestion.yml`
   - `/api/readiness/source-runs`
   - `/api/readiness/catalog-coverage`
   - connector-specific logs or `codex-tasks/ingestion-blockers.txt`
2. Preserve workflow artifacts before rerun:
   - `groceryview-production-config-preflight`
   - `groceryview-production-ingestion-config`
   - `groceryview-daily-db-connectivity`
   - `groceryview-production-db-migrations`
   - `groceryview-daily-ingestion-result`
   - `groceryview-db-site-snapshot`
   - `groceryview-deployed-readiness`
3. Determine blast radius:
   - affected country and chain IDs
   - connector URL or virtual daily URL
   - accepted rows before failure
   - whether `latest_prices` was updated
   - whether DB-backed site snapshot export ran after the bad run
4. If DB writes may be incomplete or wrong, pause scheduled ingestion before retrying.
5. If only one connector failed before persistence, keep unaffected source runs and open a connector fix. Do not lower launch-chain readiness thresholds without incident approval.
6. If source-run readiness is blocked after successful ingestion, compare:
   - source-run finish timestamps
   - accepted-row thresholds by required chain
   - deployed `DATABASE_URL` target
   - catalog coverage target JSON
7. Mitigate:
   - rerun only after the blocker is understood
   - use bounded connector controls for canary reruns
   - rollback site snapshot or deployment if public pages now show stale or partial data without guardrails
8. Close only when readiness is green or a documented degraded-mode banner/guardrail is active.

## Scenario: price discrepancy reported

Trigger examples: user says a product price is wrong, support reports a store mismatch, public page shows a suspicious discount, or a retailer challenges a displayed observation.

Checklist:

1. Capture the report:
   - product slug or barcode
   - chain, store, country, and route URL
   - displayed price, reported correct price, currency, unit, and timestamp
   - screenshot or receipt/photo evidence if available
2. Inspect the public route and API response without editing data.
3. Locate the source row:
   - `latest_prices` row
   - originating observation ID
   - source run ID
   - raw record ID or source URL
   - confidence and provenance
4. Decide whether the display is:
   - valid but stale
   - valid but missing a caveat such as member price, promotion, or store scope
   - parsed incorrectly
   - matched to the wrong product
   - from an unavailable or superseded observation
5. Mitigate user harm:
   - hide or downrank the affected row if correctness is uncertain
   - add a visible caveat if the price is valid but conditional
   - pause affected alert/digest sends
   - avoid deleting append-only observations directly
6. Repair through an audited path:
   - add exclusion or superseding observation metadata
   - fix product alias/matching rules
   - fix connector parser and fixture test
   - regenerate DB-backed site snapshot after correction
7. Reply to the reporter with the outcome and source caveat. Do not promise live shelf accuracy unless verified by the source evidence.

## Scenario: security incident

Trigger examples: exposed secret, auth bypass, private account data leak, webhook signature bypass, suspicious admin activity, or dependency advisory with exploitable production path.

Checklist:

1. Treat as SEV-1 until proven otherwise.
2. Freeze deploys except security mitigation deploys.
3. Preserve evidence:
   - request IDs and logs
   - affected route and account IDs
   - deployment SHA
   - suspicious IPs or user agents
   - relevant webhook payload hashes, not raw secrets
4. Stop active exposure:
   - rotate leaked secrets
   - disable affected integration token or webhook secret
   - revoke compromised sessions
   - block vulnerable route, feature flag, or provider callback
5. Check common GroceryView boundaries:
   - bearer auth on user-scoped routes
   - metrics token on readiness and worker endpoints
   - billing and notification webhook signatures
   - scan upload signed URLs
   - account deletion/export authorization
   - admin and human-review routes
6. Assess data impact:
   - account profile
   - household, basket, watchlist, favorite stores
   - receipt/scan records
   - notification tokens or suppression records
   - billing entitlement metadata
7. Prepare user or regulator notice if private data may have been exposed. Keep timing and content coordinated with legal/privacy owner.
8. Add a regression test before closing:
   - invalid token
   - missing signature
   - cross-user access attempt
   - replay/stale timestamp
   - malformed input

## Scenario: performance regression

Trigger examples: Lighthouse budget failure, slow route alert, elevated 5xx/timeouts, high DB latency, large bundle growth, or slow ingestion/export step.

Checklist:

1. Identify the regressed surface:
   - public route or API endpoint
   - Next build or route render
   - database query
   - ingestion connector
   - DB-backed site snapshot export
2. Capture baseline and current evidence:
   - deployment SHA before and after regression
   - Lighthouse or Playwright trace
   - route timing and response size
   - DB query timing if available
   - bundle/build output
3. Check for obvious mitigations:
   - rollback recent deploy
   - disable non-critical rail or expensive route section
   - reduce ingestion concurrency or connector cap
   - restore cache TTL or cached snapshot
4. For frontend regressions:
   - inspect large route assets and client components
   - defer non-critical client widgets
   - avoid importing large generated data into client bundles
   - rerun the route-specific smoke after changes
5. For API/database regressions:
   - inspect query filters, indexes, and pagination
   - verify `DATABASE_URL` points to the expected target
   - compare readiness and DB connectivity evidence
   - fail closed rather than returning partial private data or fabricated prices
6. For ingestion regressions:
   - use bounded bulk ingestion controls
   - lower concurrency only as a temporary mitigation
   - preserve failed connector diagnostics before retrying
7. Close only when the affected route/job is back within budget or the regression has an accepted owner, deadline, and user-facing degraded-mode note.

## Closure checklist

1. Incident record includes severity, impact, timeline, root cause, mitigation, and follow-up owner.
2. Evidence bundle links are preserved in the incident record.
3. Any paused workflow, alert, digest, or deploy gate is intentionally resumed or left paused with an owner.
4. Any data correction keeps append-only observation history intact.
5. Regression tests or runbook updates are merged.
6. Support/user-facing message is sent if users saw wrong prices, private-data risk, or material downtime.
