# Incident Response Runbook

This runbook gives the on-call responder a first 30-minute checklist for the
GroceryView incidents that most often affect data freshness, price correctness,
security, or user-facing latency.

Use it together with:

- [`docs/data-sources.md`](../data-sources.md) for source ownership, endpoint,
  license, and generated-artifact details.
- [`docs/ingestion-playbook.md`](../ingestion-playbook.md) for connector probing
  and source-specific ingestion notes.
- `package.json` operational scripts such as `ingest:verify`,
  `ops:daily-connectors`, `ops:check-daily-db-connectivity`,
  `ops:check-supabase-health`, and `ops:validate-production-env`.

## Universal incident checklist

- [ ] Acknowledge the alert or report in the incident channel with owner,
      timestamp, suspected severity, and current customer impact.
- [ ] Open or link an incident issue with the symptom, affected environment,
      first observed time, and any dashboard/log URLs.
- [ ] Freeze risky deploys or ingestion backfills if they could make evidence or
      customer impact worse.
- [ ] Capture the current state before changing anything: relevant logs, failing
      request examples, source-run IDs, commit SHA, deployment URL, and database
      timestamps.
- [ ] Pick one incident commander and one note-taker for high-severity events.
- [ ] Prefer the smallest reversible mitigation first; document any manual data
      edits, disabled jobs, or rolled-back releases.
- [ ] Keep status updates time-boxed: every 15 minutes for severe incidents,
      every 30-60 minutes for degraded/non-urgent incidents.
- [ ] After mitigation, verify the user-visible path and the underlying signal
      that alerted.
- [ ] Close with a post-incident note containing root cause, impact window,
      remediation, prevention follow-ups, and owners.

## Severity guide

| Severity | When to use it | Initial response target |
| --- | --- | --- |
| SEV-1 | Data breach, credential exposure, destructive data corruption, or site-wide outage | Immediate page and deploy freeze |
| SEV-2 | Major feature unavailable, widespread stale prices, incorrect prices shown as current | 15 minutes |
| SEV-3 | Single connector/source failing, limited price discrepancy, slow page/API with workaround | Same business day |
| SEV-4 | Documentation/process issue or non-user-visible regression | Next planning cycle |

## Scenario: ingestion alarm fires

Use this when a scheduled connector, generated data artifact, source freshness
monitor, or provenance verifier reports stale/missing/invalid data.

- [ ] Identify the failing connector or generated artifact from the alarm and map
      it to the source entry in [`docs/data-sources.md`](../data-sources.md).
- [ ] Check whether the failure is isolated to one source or systemic:
      database connectivity (`npm run ops:check-daily-db-connectivity`),
      Supabase health (`npm run ops:check-supabase-health`), and production env
      configuration (`npm run ops:validate-production-env`) are the first shared
      dependencies to inspect.
- [ ] Review the last successful source run: connector id, row count, started
      time, completed time, error message, and generated module timestamp.
- [ ] Compare the current row count with the connector's minimum guardrail. Do
      not publish a partial or empty generated artifact unless the code already
      fails closed for that case.
- [ ] Probe the public source manually with the documented User-Agent and rate
      limits to distinguish a source outage, schema change, block/captcha, or an
      internal parser regression.
- [ ] If the source is temporarily unavailable, pause only that connector, keep
      serving the last known-good snapshot, and mark the source as degraded in
      the incident notes.
- [ ] If the parser or schema changed, patch the connector in
      `packages/ingestion/src/connectors/`, regenerate the affected artifact,
      and run the narrow provenance verifier for the changed data path.
- [ ] If database persistence failed, confirm migration state before retrying a
      backfill and avoid duplicate observations by checking connector
      idempotency keys.
- [ ] Verify recovery with both the freshness signal and one user-facing route or
      API that reads the affected data.
- [ ] Update source documentation with any new endpoint, schema, blocker, or
      operational guardrail discovered during the incident.

## Scenario: price discrepancy reported

Use this when a user, retailer, support report, or automated comparison flags a
price, unit price, product match, store, or availability value as wrong.

- [ ] Record the exact report: product name, EAN/SKU when available, retailer,
      store or region, displayed price, expected price, screenshot/receipt URL,
      observation time, and reporter contact.
- [ ] Determine whether GroceryView labels the value as current, historical,
      aggregate, chain-wide, regional, per-store, or user-submitted. Do not treat
      aggregate sources as branch-level evidence.
- [ ] Find the observation provenance: source connector, source URL, retrieved
      date, generated artifact, database observation id, and any transformation
      that normalized unit price or locale-specific product name.
- [ ] Compare against at least one authoritative source for that claim type:
      retailer page/API for public catalog prices, generated source snapshot for
      historical values, or receipt/photo evidence for branch-specific values.
- [ ] Check common transformation mistakes: decimal comma parsing, unit
      conversion (`kr/kg`, `kr/l`, package count), deposit/pant handling,
      promotion validity dates, VAT/category assumptions, and stale product
      merges by name instead of EAN.
- [ ] If the shown value is wrong, suppress or correct the affected observation
      without deleting raw evidence; document the manual action and reason.
- [ ] If the source is correct but the UI wording is misleading, change the label
      to clarify scope, freshness, or source type rather than changing data.
- [ ] If the report concerns retailer-provided data, keep communication factual:
      what GroceryView displayed, source and retrieval time, and whether it has
      been corrected or marked stale.
- [ ] Add or update a regression test, parser fixture, validation rule, or
      provenance check that would catch the discrepancy class in CI.
- [ ] Reply to the reporter with resolution, impact window, and whether any
      similar products or stores were audited.

## Scenario: security incident

Use this when there is suspected credential leakage, unauthorized access,
malicious input, dependency compromise, privacy breach, or abuse of receipt/user
data.

- [ ] Treat as SEV-1 until scoped lower. Start an incident channel, assign an
      incident commander, and restrict details to people needed for containment.
- [ ] Preserve evidence before cleanup: suspicious request ids, IPs, auth user
      ids, webhook payloads, deployment SHAs, package versions, audit logs, and
      timestamps in UTC.
- [ ] Contain immediately: disable compromised tokens/webhooks, rotate affected
      secrets, revoke sessions if user access is suspected, and pause vulnerable
      jobs or endpoints.
- [ ] Validate production configuration with `npm run ops:validate-production-env`
      and check for accidental secret exposure in logs, generated artifacts,
      environment files, and recently opened pull requests.
- [ ] If database access may be affected, check Row Level Security assumptions,
      service-role key usage, recent migrations, and unusual read/export volume.
- [ ] If receipt images or account data may be affected, scope impacted users,
      data classes, retention windows, and legal/notification obligations before
      making broad statements.
- [ ] Patch the vulnerability on a private branch if public disclosure would
      increase risk; request security review before merging when feasible.
- [ ] Rotate credentials again after deploying a fix if any secret was present in
      an environment that the vulnerable code could read.
- [ ] Verify containment with a negative test for the original exploit path and a
      log search showing the suspicious pattern has stopped.
- [ ] Complete the post-incident review with root cause, affected data, user
      notification decision, hardening work, and owner/date for each follow-up.

## Scenario: performance regression

Use this when a page, API route, connector, database query, or build path becomes
slower, times out, or exceeds its budget.

- [ ] Define the failing experience and budget: endpoint/page, p50/p95/p99 or
      Lighthouse metric, affected region/device, expected threshold, current
      measurement, and first bad deployment or data run.
- [ ] Reproduce using the same path as users or CI. Capture request ids,
      deployment SHA, browser/device profile, query parameters, and response
      sizes.
- [ ] Decide whether to mitigate before root cause: rollback the release, disable
      the expensive feature flag, serve a cached snapshot, reduce connector
      concurrency, or add a temporary page-size limit.
- [ ] For API/database latency, inspect slow queries, N+1 patterns, missing
      indexes, connection pool exhaustion, row counts, and recent migrations.
      Use `npm run ops:db-io-hotspots` or `npm run ops:compare-db-io-hotspots`
      when database IO is suspected.
- [ ] For web regressions, compare bundle size, server-rendered data payloads,
      image dimensions, cache headers, and any new client-side hydration work.
      Check `apps/web/lighthouserc.cjs` and `apps/web/lighthouserc.preview.cjs`
      for the enforced budgets.
- [ ] For ingestion regressions, compare source response time, retry/backoff
      behavior, fixture size, parser complexity, and generated artifact size.
- [ ] Add instrumentation or logging around the suspected bottleneck before a
      risky rewrite if current evidence is inconclusive.
- [ ] Verify the fix with the same metric that failed and at least one adjacent
      user flow to ensure the mitigation did not move latency elsewhere.
- [ ] Record the before/after numbers in the incident issue and add a budget,
      alert, fixture, or regression test if none existed.
- [ ] Remove temporary mitigations only after the permanent fix is deployed and
      monitored through one normal traffic or ingestion cycle.

## Closing checklist

- [ ] The original alert/report no longer fires or has been explicitly muted
      with an owner and expiration date.
- [ ] User-facing pages or APIs affected by the incident were checked after the
      fix.
- [ ] Data corrections, backfills, credential rotations, or rollbacks are listed
      in the incident notes.
- [ ] Documentation and runbooks changed when the incident exposed missing or
      outdated operational knowledge.
- [ ] Follow-up issues have owners and due dates, including any test, monitor, or
      dashboard gap discovered during response.
