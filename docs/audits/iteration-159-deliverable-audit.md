# Iteration 159 deliverable audit

## Goal

Move GroceryView deployment from "publish command ran" toward real production evidence by making deploy fail unless post-publish hosted smokes pass.

## Delivered

- Added post-deploy HTTP smoke to `.github/workflows/deploy.yml` using `infra/scripts/smoke-hosted-http.sh`.
- Added post-deploy token-protected PostgreSQL readiness smoke using `infra/scripts/smoke-hosted-readiness.sh`.
- Uploads deploy smoke JSON evidence artifacts on every deploy attempt.
- Extended `tests/schema/deploy-workflow.test.mjs` so the deploy workflow must include the hosted smoke scripts and artifact paths.
- Updated `docs/status/completion-audit.md` to track the deploy-time smoke gate and clarify the remaining need for a successful run against provisioned production infrastructure.

## Verification

- RED: `rtk node --test tests/schema/deploy-workflow.test.mjs` failed because deploy did not run `smoke-hosted-http.sh` / `smoke-hosted-readiness.sh` or upload deploy smoke artifacts.
- GREEN: `rtk node --test tests/schema/deploy-workflow.test.mjs`
- Full verification before PR: `rtk git diff --check && rtk ruby -e 'require "yaml"; YAML.load_file(".github/workflows/deploy.yml"); puts "yaml-ok"' && rtk node --test tests/schema/deploy-workflow.test.mjs && rtk npm run typecheck && rtk npm test && rtk npm run build`

## Remaining gaps

This makes the deploy workflow require hosted smoke proof, but GroceryView still needs real production secrets, a provisioned migrated PostgreSQL service, and an observed passing deploy run before the hosting/database gap can be closed.
