# Incident response runbook

Use this runbook when GroceryView production data, user trust, security, or performance is at risk. The goal is to restore safe service first, preserve evidence, and then follow up with durable fixes.

## Triage rules for every incident

1. **Declare an incident owner.** One person coordinates updates, assigns tasks, and closes the incident only after the exit criteria are met.
2. **Create an incident log.** Record the start time, reporter, affected surface, links to dashboards/logs/PRs, decisions, and customer-facing messages.
3. **Classify severity.** Use the highest applicable severity until proven otherwise:
   - `SEV-1`: user data exposure, account compromise, widespread outage, or unsafe price data reaching production pages.
   - `SEV-2`: major feature unavailable, ingestion blocked for a high-traffic chain, or a significant performance regression.
   - `SEV-3`: limited chain/category impact, isolated stale data, or a non-urgent regression with a workaround.
4. **Stabilize before optimizing.** Prefer disabling a feed, hiding untrusted evidence, rolling back a release, or raising review routing over shipping risky fixes under pressure.
5. **Communicate on a cadence.** Post an initial acknowledgement, status updates at least every 30 minutes for SEV-1/SEV-2, and a final resolution note with follow-up owners.
6. **Preserve evidence.** Save relevant logs, raw payload samples, screenshots, run ids, commit SHAs, and database query outputs before deleting or overwriting data.
7. **Close with a follow-up.** File remediation tickets for code fixes, tests, monitoring gaps, documentation gaps, and customer-support follow-up.

## Scenario: ingestion alarm fires

Use when scheduled ingestion, connector materialization, freshness checks, or chain coverage alarms indicate missing or stale product observations.

### Checklist

- [ ] Acknowledge the alarm and identify the affected connector, country, chain, category, and scheduled run id.
- [ ] Check whether this is a data-source outage, authentication/rate-limit issue, parser failure, schema change, deployment regression, or storage/export failure.
- [ ] Compare the current run with the last known good run: observation count, rejected rows, low-confidence rows, freshness timestamps, and chain coverage.
- [ ] Inspect representative raw payloads and normalized observations before re-running ingestion so the failure mode is preserved.
- [ ] If emitted data may be wrong, pause the connector or mark affected rows as needing review rather than publishing them as verified.
- [ ] If data is merely stale, surface the stale/freshness state and avoid deleting the last known good observations unless they are unsafe.
- [ ] Re-run only the smallest safe scope first, then widen to the full connector once counts and sample rows match expectations.
- [ ] Verify downstream export/snapshot generation completed and web-visible freshness reflects the recovery.
- [ ] Document root cause, recovery command/run id, affected time window, and any missing monitor or fixture coverage.

### Exit criteria

- The failing connector has either recovered with expected observation counts or is intentionally disabled with stale/unsafe data hidden.
- Product pages, chain pages, and generated snapshots show accurate freshness and trust labels for the affected source.
- A follow-up ticket exists for any parser, fixture, credentials, rate-limit, or monitoring gap discovered during triage.

## Scenario: price discrepancy reported

Use when a customer, retailer, reviewer, or automated check reports that a displayed price, unit price, promotion, origin, or certification claim is inconsistent with source evidence.

### Checklist

- [ ] Capture the report URL, product slug/id, store/chain, country, displayed price, reported correct price, timestamp, and reporter contact path if available.
- [ ] Find the backing observation and record source URL/payload, scraper run id, confidence state, normalization path, and generated snapshot row.
- [ ] Determine the discrepancy type: stale price, unit conversion error, member-only price shown as shelf price, promotion window mismatch, wrong store scope, wrong origin/certification, or duplicate product match.
- [ ] If the displayed value is likely misleading, remove the verified badge, route the item to low-confidence review, or suppress the affected row until corrected.
- [ ] Check nearby rows for the same connector/category so one parser bug does not leave related incorrect prices live.
- [ ] Correct the source-backed normalization or fixture; do not invent replacement rows without evidence from the retailer/source.
- [ ] Regenerate affected snapshots or trigger the normal export path so the web UI reflects the corrected evidence.
- [ ] Reply to the reporter with the resolution or review status when a contact channel exists.
- [ ] Record before/after values, evidence links, and whether any user-facing claims were wrong long enough to require a public note.

### Exit criteria

- The affected product no longer displays unsupported price/origin/certification evidence.
- Any code/data fix is covered by a source-backed fixture, parser test, or documented manual review path.
- Related rows from the same source were sampled and found safe or added to the same remediation plan.

## Scenario: security incident

Use for suspected account compromise, secret exposure, dependency compromise, injection, authorization bypass, data leakage, malicious PR/activity, or unexpected privileged access.

### Checklist

- [ ] Treat as `SEV-1` until the blast radius is understood; assign an incident owner and restrict discussion to trusted responders.
- [ ] Preserve evidence: audit logs, request ids, deployment ids, package lockfile diffs, secret names, affected accounts, IPs, timestamps, and screenshots.
- [ ] Contain immediately: revoke leaked tokens, rotate credentials, disable compromised integrations, block abusive traffic, or roll back the suspect deploy.
- [ ] Freeze risky changes touching auth, billing, review queues, notification delivery, ingestion credentials, and production database access until containment is confirmed.
- [ ] Identify affected data classes: credentials, account profiles, watchlists, baskets, reports, review decisions, retailer payloads, and operational logs.
- [ ] Validate that authorization boundaries still hold for protected API routes, admin/reviewer flows, export/delete routes, and signed upload/session bridges.
- [ ] Patch the root cause on a fresh branch, request review, and prefer small auditable changes over broad refactors.
- [ ] Decide whether legal, privacy, customer, or partner notification is required based on affected data and jurisdiction.
- [ ] Add or tighten tests, secret scanning, dependency pinning, logging, alerting, and runbook steps before closing.

### Exit criteria

- Compromised access paths are revoked or blocked, vulnerable code/dependency/configuration is fixed, and affected data scope is documented.
- Required notifications have owners and deadlines.
- Preventive controls are tracked in follow-up tickets and linked from the incident log.

## Scenario: performance regression

Use when Lighthouse/CI budgets fail, API latency increases, pages become slow, bundle size grows unexpectedly, or ingestion/export jobs exceed expected runtime.

### Checklist

- [ ] Identify the regressed surface: route/page, API endpoint, background job, generated snapshot, connector, or CI workflow.
- [ ] Record baseline vs current metrics: p50/p95 latency, page weight, bundle diff, Lighthouse category, query count, memory, job duration, and affected commit range.
- [ ] Confirm whether the regression is production-visible or limited to preview/CI by checking the same scenario in the most comparable environment.
- [ ] Look for recent changes in data volume, generated artifacts, client-side rendering, dependency upgrades, image/assets, database query shape, and cache headers.
- [ ] Apply the safest mitigation first: rollback, feature flag, reduce payload, paginate, cache, defer non-critical work, or temporarily disable an expensive panel.
- [ ] Keep trust-critical labels and freshness indicators visible when simplifying UI; do not hide data-quality warnings to recover a performance score.
- [ ] Re-measure the exact failing scenario after each mitigation and record the command, run id, or dashboard link.
- [ ] Add a regression guard when possible: budget, route assertion, fixture size cap, query limit, or generated artifact size check.
- [ ] Document residual risk if the final fix is a mitigation rather than a root-cause removal.

### Exit criteria

- The affected route, API, job, or workflow is back within its agreed budget or has an explicit temporary exception with an owner and expiry date.
- The regression source is linked to a commit, data change, dependency, or infrastructure event.
- A durable guard or follow-up ticket exists so the same regression is detected earlier next time.

## Post-incident review template

Copy this block into the incident log after any SEV-1/SEV-2, and for SEV-3 incidents that required code or data rollback.

```md
## Summary
- Incident:
- Severity:
- Started:
- Detected by:
- Resolved:
- Owner:

## Impact
- Affected users/surfaces:
- Affected data or chains:
- Customer-visible symptoms:

## Timeline
- HH:MM Event
- HH:MM Mitigation
- HH:MM Recovery

## Root cause
-

## What worked
-

## What did not work
-

## Follow-up actions
- [ ] Owner/date/action
```
