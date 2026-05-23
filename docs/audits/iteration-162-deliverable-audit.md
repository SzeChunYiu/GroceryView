# Iteration 162 deliverable audit

## Goal

Move notification operations toward production readiness by making production notification metrics scraping a scheduled, artifact-backed workflow instead of a manual endpoint check.

## Delivered

- Added `.github/workflows/notification-metrics-scrape.yml` with manual and six-hour scheduled triggers.
- The workflow uses the `production` environment and fails closed when `GROCERYVIEW_API_BASE_URL` or `METRICS_TOKEN` is absent.
- It scrapes `/api/metrics/notifications` with the metrics token header.
- It fails when the Prometheus worker event counter or delivered/failed status series are missing.
- It uploads `artifacts/notification-metrics.prom` as operations evidence.
- Added schema coverage in `tests/schema/notification-metrics-scrape-workflow.test.mjs`.
- Updated the completion audit to record the metrics scrape lane and clarify that an observed passing scrape is still required.

## Verification

- RED: `rtk node --test tests/schema/notification-metrics-scrape-workflow.test.mjs` failed because `.github/workflows/notification-metrics-scrape.yml` did not exist.
- GREEN: `rtk node --test tests/schema/notification-metrics-scrape-workflow.test.mjs tests/schema/completion-audit.test.mjs`
- Full verification before PR: `rtk git diff --check && rtk ruby -e 'require "yaml"; YAML.load_file(".github/workflows/notification-metrics-scrape.yml"); puts "yaml-ok"' && rtk node --test tests/schema/notification-metrics-scrape-workflow.test.mjs tests/schema/completion-audit.test.mjs && rtk npm run typecheck && rtk npm test && rtk npm run build`

## Remaining gaps

This creates the production metrics scrape lane, but GroceryView still needs production credentials populated, an observed passing metrics scrape, live scheduled notification-worker evidence, and observed SendGrid/Expo delivery proof.
