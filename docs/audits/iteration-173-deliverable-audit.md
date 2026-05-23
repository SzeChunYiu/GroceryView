# Iteration 173 Deliverable Audit — Production workflow variable gate

## Scope

This iteration closes a fail-open gap in production workflow configuration checks. The hosted smoke and deploy jobs already referenced production variables, but the reusable production audit only reported secrets.

## Added evidence

- `scripts/ops/check-production-secrets.mjs` now audits required GitHub workflow variables alongside secrets.
- `.github/workflows/deploy.yml` injects `GROCERYVIEW_PRODUCTION_URL`, `GROCERYVIEW_TERMINAL_PRODUCT_ID`, and `GROCERYVIEW_SCANNER_USER_ID` into the `--from-env` audit before tests, build, typecheck, deploy, and hosted smokes run.
- `.github/workflows/hosted-smoke.yml` preflights the production web URL and terminal product id in addition to scanner account and bearer-token inputs.
- `tests/schema/production-secrets-script.test.mjs`, `tests/schema/deploy-workflow.test.mjs`, and `tests/schema/hosted-smoke-workflow.test.mjs` lock the fail-closed behavior.

## Remaining gap

This validates that workflow variables are required and surfaced in the audit. It does not prove those values are populated in GitHub production, nor does it prove a hosted smoke or deploy run has passed against provisioned production infrastructure.
