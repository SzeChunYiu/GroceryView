# Iteration 172 Deliverable Audit — Hosted scanner upload smoke

## Scope

This iteration narrows the remaining scanner gap by adding a hosted smoke check that exercises the account-bound upload-ticket endpoint and the returned signed object-storage `PUT`. It is release evidence for hosted scanner upload wiring, not a replacement for real browser camera or mobile device capture evidence.

## Added evidence

- `infra/scripts/smoke-hosted-scanner-upload.mjs` requests `/api/scans/upload-url?userId=...` with a scanner user id and bearer token, requires a ready private payload ticket, then uploads a one-byte JPEG placeholder through the returned signed URL and headers.
- `.github/workflows/hosted-smoke.yml` runs the scanner upload smoke in the production environment and stores `artifacts/hosted-scanner-upload-smoke.json`.
- `.github/workflows/deploy.yml` gates post-deploy evidence on the same smoke and stores `artifacts/deploy-hosted-scanner-upload-smoke.json`.
- `scripts/ops/check-production-secrets.mjs` now fails closed when the scanner smoke bearer token is not available to production workflow audits.

## Safety notes

The smoke output records only safe evidence labels, `scanId`, and `checkedAt`. It intentionally does not serialize the bearer token or the signed upload URL.

## Remaining gap

The product is still not complete. A passing hosted workflow run, real browser upload proof, and mobile device camera capture evidence are still required before claiming the full scanner path is production-ready.
