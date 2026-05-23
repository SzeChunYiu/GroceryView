# Iteration 155 deliverable audit: workflow production secret audit coverage

## Goal

Keep production readiness fail-closed by ensuring the production secret audit covers the secrets required by the newly shipped notification-worker and mobile EAS workflows.

## Delivered in this iteration

- Added `GROCERYVIEW_API_BASE_URL` to `requiredGithubActionSecrets` for the scheduled notification worker workflow.
- Added `EXPO_TOKEN` to `requiredGithubActionSecrets` for the mobile EAS device-build workflow.
- Strengthened `tests/schema/production-secrets-script.test.mjs` so the audit fails when either workflow-required secret is omitted.
- Updated the completion audit with the workflow secret-audit coverage while keeping real secret population and live proof as blockers.

## Files changed

- `scripts/ops/check-production-secrets.mjs`
- `tests/schema/production-secrets-script.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-155-deliverable-audit.md`

## Verification

- Red TDD check first failed because `GROCERYVIEW_API_BASE_URL` and `EXPO_TOKEN` were absent from `scripts/ops/check-production-secrets.mjs`.
- `rtk node --test tests/schema/production-secrets-script.test.mjs` passed after adding both secrets.

## Remaining gaps

- This audits required secret names; it does not prove the GitHub production environment currently has valid values.
- Live notification-worker runs, EAS mobile build artifacts, provider credentials, hosted database readiness, and production smoke evidence remain blockers in `docs/status/completion-audit.md`.
