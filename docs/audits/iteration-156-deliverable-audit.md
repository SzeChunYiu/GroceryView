# Iteration 156 deliverable audit: deploy environment secret preflight

## Goal

Make deployment readiness fail closed against the actual GitHub `production` environment secrets used by the workflows, instead of only auditing repository-level secrets out of band.

## Delivered in this iteration

- Extended `scripts/ops/check-production-secrets.mjs` with `--env <environment>` support.
- The script now passes `--env production` through to `gh secret list` when requested and includes the audited environment in its JSON output.
- Added a deploy workflow preflight step that runs `npm run ops:check-production-secrets -- --repo "$GITHUB_REPOSITORY" --env production` with `GH_TOKEN` before tests, build, typecheck, manifest validation, and deployment handoff.
- Strengthened schema tests so deploy workflow coverage requires the production secret audit and the secret-audit script requires environment-scoped listing support.
- Updated the completion audit to record the deploy environment secret audit while keeping real secret values and live deployment proof as blockers.

## Files changed

- `.github/workflows/deploy.yml`
- `scripts/ops/check-production-secrets.mjs`
- `tests/schema/deploy-workflow.test.mjs`
- `tests/schema/production-secrets-script.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-156-deliverable-audit.md`

## Verification

- Red TDD check first failed because deploy did not run `ops:check-production-secrets -- --repo "$GITHUB_REPOSITORY" --env production` and the secret audit script did not support `--env`.
- `rtk node --test tests/schema/production-secrets-script.test.mjs tests/schema/deploy-workflow.test.mjs` passed after implementation.

## Remaining gaps

- This proves the deploy preflight audits environment-scoped secret names; it does not prove valid production secret values are already configured.
- Real provider deployment, migrated hosted PostgreSQL, production smoke evidence, EAS artifacts, and live scheduled-worker evidence remain blockers in `docs/status/completion-audit.md`.
