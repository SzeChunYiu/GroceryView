# Iteration 169 Deliverable Audit — Scan Upload Storage Readiness Endpoint

## Goal

Continue turning GroceryView scanner research into production-operable product by making object-storage upload readiness observable in the hosted readiness path, not just available through protected user upload-ticket routes.

## Delivered

| Requirement | Evidence | Status |
| --- | --- | --- |
| Token-protected storage readiness | `GET /api/readiness/scan-upload-storage` requires the metrics token and returns `200` only for a ready report. | Implemented |
| Runtime S3 upload-ticket proof | `buildRuntimeAuthOptions()` now builds S3-compatible scan upload storage from `S3_*` env and `SCAN_UPLOAD_MAX_BYTES`; readiness creates a synthetic private receipt upload ticket. | Implemented |
| Fail closed without leaking secrets | Missing storage returns `scan_upload_storage_not_configured`; thrown provider errors return `scan_upload_storage_readiness_probe_failed` without S3 secret values. | Implemented |
| Hosted smoke coverage | `infra/scripts/smoke-hosted-readiness.sh` now checks `/api/readiness/scan-upload-storage` and records it in optional JSON evidence. | Implemented |
| Production configuration gate | `loadRuntimeConfig()`, `ops:validate-production-env`, and `ops:check-production-secrets` require S3 storage variables for production readiness. | Implemented |

## Verification

- RED: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan upload storage readiness|runtime S3-compatible|buildOpenApiDocument"` failed because `scanUploadStorageReadinessProvider` and `/api/readiness/scan-upload-storage` did not exist.
- GREEN: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan upload storage readiness|runtime S3-compatible|buildOpenApiDocument|production runtime config|production secrets|invalid public"` passed after implementation.

## Remaining blockers

This makes storage readiness observable and fail-closed, but hosted production still needs real object-storage credentials populated, a passing hosted `/api/readiness/scan-upload-storage` run, CORS/upload proof from browser/device clients, live scan provider credentials with passing `/api/readiness/scanning`, and device capture evidence.
