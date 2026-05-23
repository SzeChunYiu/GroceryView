# Iteration 157 deliverable audit

## Goal

Move GroceryView closer to production readiness by making hosted smoke proof a repeatable GitHub Actions gate instead of a manual runbook command.

## Delivered

- Added `.github/workflows/hosted-smoke.yml` with manual and daily triggers in the `production` environment.
- The workflow fails closed before network calls when `GROCERYVIEW_API_BASE_URL` or `METRICS_TOKEN` is missing.
- The workflow runs `infra/scripts/smoke-hosted-http.sh` against API health, product terminal, and optional web URL.
- The workflow runs `infra/scripts/smoke-hosted-readiness.sh` against token-protected PostgreSQL readiness.
- The workflow uploads smoke JSON evidence artifacts when available.
- Added schema coverage in `tests/schema/hosted-smoke-workflow.test.mjs`.
- Updated `docs/status/completion-audit.md` with the new workflow and clarified that successful hosted smoke evidence is still required.

## Verification

- RED: `rtk node --test tests/schema/hosted-smoke-workflow.test.mjs` failed because `.github/workflows/hosted-smoke.yml` did not exist.
- GREEN: `rtk node --test tests/schema/hosted-smoke-workflow.test.mjs`
- Full verification before PR: `rtk git diff --check && rtk ruby -e 'require "yaml"; YAML.load_file(".github/workflows/hosted-smoke.yml"); puts "yaml-ok"' && rtk node --test tests/schema/hosted-smoke-workflow.test.mjs && rtk npm run typecheck && rtk npm test && rtk npm run build`

## Remaining gaps

This workflow creates the repeatable production smoke lane, but GroceryView still needs the real hosted deployment, populated production secrets, a migrated PostgreSQL service, and an observed passing hosted smoke run before the deployment gap can be closed.
