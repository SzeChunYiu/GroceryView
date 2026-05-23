# Iteration 174 Deliverable Audit — Scheduled production readiness audit

## Scope

This iteration turns the production configuration blocker into a first-class scheduled/manual GitHub evidence run. The repository can now record the exact missing secret and variable names as an artifact without starting a deployment.

## Added evidence

- `.github/workflows/production-readiness-audit.yml` runs in the `production` environment on `workflow_dispatch` and a daily schedule.
- The workflow runs `npm run ops:check-production-secrets -- --repo ${{ github.repository }} --env production`, writes `artifacts/production-readiness-secret-audit.json`, uploads it as `production-readiness-audit-evidence`, and exits with the audit status.
- `tests/schema/production-readiness-audit-workflow.test.mjs` locks the workflow contract so it cannot silently continue on failed audits.

## Current observed blocker

A local GitHub audit on May 23, 2026 returned `status: blocked`. Missing production GitHub values included `GROCERYVIEW_API_BASE_URL`, Vercel deploy secrets, scanner smoke token/user variables, Expo/SendGrid/Stripe/OCR/OpenFoodFacts/S3 runtime secrets, and all required production workflow variables.

## Remaining gap

This provides recurring evidence and fail-closed visibility. It does not populate the missing secrets/variables, prove a green production readiness audit workflow, or prove a successful hosted smoke/deploy run.
