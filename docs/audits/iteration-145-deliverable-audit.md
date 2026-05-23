# Iteration 145 Deliverable Audit

## Objective slice

Continue turning the research findings into real GroceryView product by replacing static per-source fixture refreshes with a DB-backed site snapshot path after daily ingestion writes verified `latest_prices` rows.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Choose a non-repeated gap | PRs #1091/#1092/#1097 were rejected for static fixture refreshes; the current accepted direction is DB-backed ingestion plus DB-to-site snapshots | Selected |
| Export public site rows from DB evidence | `createPostgresSiteSnapshotReader()` reads `latest_prices` joined to products, chains, and stores | Implemented |
| Fail closed without DB price evidence | `buildDbSiteSnapshotArtifact()` throws `No latest price rows available` for empty rows | Implemented |
| Avoid raw private payloads in public snapshot | `scripts/ingestion/export-db-site-snapshot.mjs` serializes normalized product/chain/store/price/provenance rows only | Implemented |
| Operator command | `npm run ingest:export-db-snapshot` builds `@groceryview/db` and runs the exporter with `DATABASE_URL` and `GROCERYVIEW_DB_SITE_SNAPSHOT_PATH` | Implemented |
| Runbook coverage | `docs/ops/production-daily-ingestion-readiness.md` documents DB-to-site snapshot generation after daily ingestion | Updated |
| Completion audit | `docs/status/completion-audit.md` records the new DB-to-site latest-price snapshot export row and narrows remaining ingestion gap wording | Updated |

## Verification

- `rtk npm run test -w @groceryview/db -- --test-name-pattern="createPostgresSiteSnapshotReader"`
- `rtk node --test tests/schema/db-site-snapshot-script.test.mjs`
- `rtk node --test tests/schema/production-readiness-runbook.test.mjs`
- `rtk node --test tests/schema/completion-audit.test.mjs`

## Remaining research findings

This round closes the DB-to-site snapshot-generation slice. The full objective is still not complete: production needs live secrets, hosted scheduled ingestion proof, catalog coverage readiness passing against a migrated database, real provider credentials, and remaining account/scanner/notification/billing runtime proofs.
