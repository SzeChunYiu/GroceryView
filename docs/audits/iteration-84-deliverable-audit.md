# Iteration 84 Deliverable Audit — Runtime S3 Scan Upload Storage

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the scanner storage gap by wiring runtime `S3_*` configuration into S3-compatible signed upload tickets for `/api/scans/upload-url`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature from remaining blockers | `docs/status/completion-audit.md` still listed production object-storage credentials and hosted upload proof after PR #333; runtime storage wiring was the next smallest prerequisite | Selected runtime S3 upload-ticket signing |
| Add failing tests before implementation | Server runtime tests were updated before production code to require `S3_*` fields in `loadRuntimeConfig()`, `hasScanUploadStorage` in health output, and a ready S3 signed upload ticket from `/api/scans/upload-url`; ops tests were updated to require `SCAN_UPLOAD_MAX_BYTES` in `.env.example` | Red verified |
| Load runtime storage configuration | `loadRuntimeConfig()` now reads `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optional `SCAN_UPLOAD_MAX_BYTES` | Implemented |
| Sign S3-compatible upload URLs | `buildRuntimeAuthOptions()` creates `scanUploadStorage` when the S3 config is complete; the storage adapter returns a SigV4 `PUT` URL, `s3://` payload URI, max byte limit, expiry, and content-type header | Implemented |
| Do not leak storage secrets | Runtime tests assert the generated upload URL excludes `S3_SECRET_ACCESS_KEY`; health only exposes a boolean `hasScanUploadStorage` | Implemented |
| Keep partial/missing storage fail-closed | `createRuntimeScanUploadStorage()` returns no storage adapter unless all required S3 fields are present, preserving the existing `failed_no_storage` route result | Implemented |
| Document local configuration | `.env.example` includes `SCAN_UPLOAD_MAX_BYTES`; `infra/README.md` documents that the server signs scanner upload tickets from the local MinIO/S3 settings | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records runtime S3-compatible upload-ticket signing and narrows remaining scanner gaps to real camera capture, production credentials, hosted CORS/upload proof, OCR providers, and live credentials | Updated |
| PR and merge to `main` after the round | PR #338 is the merge vehicle for this audit | Pending until merge |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Server runtime | `packages/server/src/index.ts`, `packages/server/src/__tests__/runtimeConfig.test.ts`, `packages/server/src/__tests__/http.test.ts` | Adds S3 config parsing, health boolean, runtime storage adapter, SigV4 signing, and route-level evidence. |
| Local ops config | `.env.example`, `infra/README.md`, `packages/ops/src/__tests__/localInfra.test.ts` | Documents local MinIO-backed scan upload ticket configuration. |
| Status docs | `docs/status/completion-audit.md` | Records the shipped runtime signing bridge and remaining live-provider gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` before implementation | Failed because `RuntimeConfig` lacked S3 fields, health lacked `hasScanUploadStorage`, and the runtime `/api/scans/upload-url` route still returned `failed_no_storage` |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/ops` before `.env.example` update | Failed because `SCAN_UPLOAD_MAX_BYTES=5000000` was absent |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server && TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/ops` after implementation | Targeted server and ops tests passed: server 42 tests, ops 16 tests; 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm test` | Full workspace test suite passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run build` | Full workspace build passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run typecheck` | Full workspace typecheck passed |
| `rtk git diff --check` | Whitespace check passed |

## Remaining gaps after this iteration

- S3-compatible signing is implemented, but production object-storage credentials and hosted CORS/upload proof are still missing.
- Real camera capture and OCR providers remain outside this runtime storage bridge.
