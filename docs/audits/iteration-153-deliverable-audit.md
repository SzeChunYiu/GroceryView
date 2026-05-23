# Iteration 153 deliverable audit: notification worker cron trigger

## Goal

Turn the existing protected notification worker endpoint into an operational scheduled path without pretending provider credentials or live delivery are already configured.

## Delivered in this iteration

- Added `.github/workflows/notification-worker.yml` with a two-hour schedule and manual dispatch.
- The workflow runs in the `production` environment and fails closed before contacting production when `GROCERYVIEW_API_BASE_URL` or `METRICS_TOKEN` secrets are absent.
- The worker step calls `POST /api/workers/notifications/run` with the metrics token bearer header.
- The workflow validates the JSON response and fails when the worker report is not healthy or when retry/dead-letter delivery failures remain.
- Added schema-test coverage for the schedule, environment, secret preflight, endpoint call, bearer auth, and failure gates.
- Updated the completion audit to move the notification-worker cron runtime from missing to shipped, while leaving live evidence/provider blockers explicit.

## Files changed

- `.github/workflows/notification-worker.yml`
- `tests/schema/notification-worker-workflow.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-153-deliverable-audit.md`

## Verification

- Red TDD check first failed because `.github/workflows/notification-worker.yml` did not exist.
- `rtk node --test tests/schema/notification-worker-workflow.test.mjs` passed after adding the workflow.

## Remaining gaps

- This is not live delivery proof: production secrets, provider credentials, production metrics scraping, and observed scheduled-run/alert delivery evidence are still required.
- Full GroceryView production readiness remains blocked by the broader hosted deployment, database, data coverage, mobile build, and provider-credential gaps in `docs/status/completion-audit.md`.
