# Iteration 170 Deliverable Audit — Scan Upload CORS Readiness Endpoint

## Goal

Continue turning GroceryView scanner work into production-operable product by making hosted browser upload CORS readiness observable instead of leaving it as an unverified storage configuration assumption.

## Delivered

| Requirement | Evidence | Status |
| --- | --- | --- |
| Token-protected CORS readiness | `GET /api/readiness/scan-upload-cors` requires the metrics token and returns `200` only for a ready report. | Implemented |
| Runtime preflight probe | `buildScanUploadCorsReadinessReport()` creates a synthetic private upload ticket, sends an `OPTIONS` preflight with the configured public web origin, and verifies origin, `PUT`, and `content-type` CORS headers. | Implemented |
| Fail closed without leaking signed URLs or secrets | Missing storage/origin and failed preflight return blocker codes; thrown errors return `scan_upload_cors_readiness_probe_failed` without S3 secret values. | Implemented |
| Hosted smoke coverage | `infra/scripts/smoke-hosted-readiness.sh` now checks `/api/readiness/scan-upload-cors` and records it in optional JSON evidence. | Implemented |
| Operator documentation | `infra/README.md` and `docs/status/completion-audit.md` describe scan upload CORS readiness and remaining actual browser/device upload proof gaps. | Implemented |

## Verification

- RED: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan upload CORS readiness|runtime scan upload CORS|buildOpenApiDocument"` failed because `scanUploadCorsReadinessProvider`, `scanUploadCorsFetch`, and `/api/readiness/scan-upload-cors` did not exist.
- GREEN: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan upload CORS readiness|runtime scan upload CORS|buildOpenApiDocument"` passed after implementation.

## Remaining blockers

This makes CORS preflight readiness fail-closed and observable, but hosted production still needs real object-storage credentials, passing hosted `/api/readiness/scan-upload-storage` and `/api/readiness/scan-upload-cors`, live scan provider credentials with passing `/api/readiness/scanning`, actual browser/device upload proof, and device capture evidence.
