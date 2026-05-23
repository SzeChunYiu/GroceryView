# Iteration 171 Deliverable Audit — Scan Upload Write Readiness Endpoint

## Goal

Continue turning GroceryView scanner work into production-operable product by making actual hosted object-storage upload writes observable, not just signed-ticket and CORS configuration.

## Delivered

| Requirement | Evidence | Status |
| --- | --- | --- |
| Token-protected write readiness | `GET /api/readiness/scan-upload-write` requires the metrics token and returns `200` only for a ready report. | Implemented |
| Runtime signed upload PUT probe | `buildScanUploadWriteReadinessReport()` creates a synthetic private upload ticket and performs a one-byte `PUT` to the signed URL with the ticket headers. | Implemented |
| Fail closed without leaking signed URLs or secrets | Missing storage and failed PUT return blocker codes; thrown errors return `scan_upload_write_readiness_probe_failed` without S3 secret values. | Implemented |
| Hosted smoke coverage | `infra/scripts/smoke-hosted-readiness.sh` now checks `/api/readiness/scan-upload-write` and records it in optional JSON evidence. | Implemented |
| Operator documentation | `infra/README.md` and `docs/status/completion-audit.md` describe scan upload write readiness and remaining actual browser/device upload proof gaps. | Implemented |

## Verification

- RED: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan upload write readiness|runtime scan upload write|buildOpenApiDocument"` failed because `scanUploadWriteReadinessProvider`, `scanUploadWriteFetch`, and `/api/readiness/scan-upload-write` did not exist.
- GREEN: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan upload write readiness|runtime scan upload write|buildOpenApiDocument"` passed after implementation.

## Remaining blockers

This proves the hosted server can create a signed scan upload ticket and write a synthetic payload when credentials are present, but production still needs real object-storage credentials, passing hosted scanner readiness endpoints, live scan provider credentials with `/api/readiness/scanning`, actual browser/device upload proof, and device capture evidence.
