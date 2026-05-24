# Iteration 217 Deliverable Audit

Objective: `PANE 0, MANAGER-GROCERY-DATA` should follow `codex-tasks/LAPTOP-INGEST.md`, coordinate four workers on distinct real grocery sources, reject fabricated/padded/docs-only work, and require `sourceUrl` plus `retrievedAt` on real rows in `packages/ingestion` connectors and `apps/web/src/lib/ingested`.

## Prompt-To-Artifact Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Read and follow `codex-tasks/LAPTOP-INGEST.md` | Task requires public fetch inspection, connector + wired ingested file changes, real row counts, build/typecheck, and no fabricated rows. | Verified |
| Coordinate 4 workers | Workers were assigned City Gross, Matspar, Mathem, and ICA Reklamblad. All four worker sessions errored with usage-limit messages before returning usable artifacts. A fifth availability-check worker also hit the same usage-limit error. | Blocked |
| Distinct source per worker | Assigned sources were distinct: City Gross, Matspar, Mathem, ICA Reklamblad. | Verified assignment only |
| Reject fabricated/padded/docs-only PRs | No worker artifacts were accepted. Local verification only accepted generated data that passed provenance checks and live source spot checks. | Verified |
| Require cited `sourceUrl` + `retrievedAt` | `npm run ingest:verify` passed for every configured ingested dataset with zero missing or invalid source URLs and timestamps. | Verified |
| Real rows only | Live spot checks returned public payloads for City Gross, Matspar, Mathem, and ICA offer pages; verifier row counts match metadata counts. | Verified |
| Build gate | `npm run build` completed successfully, including the web production build. | Verified |
| Typecheck gate | `npm run typecheck` completed successfully. | Verified |
| Ingestion test gate | `npm run test -w @groceryview/ingestion` completed with 163 passed, 0 failed. | Verified |
| Whitespace gate | `git diff --check` initially found extra EOF blank lines in generated `mathem.ts` and `willys.ts`; they were mechanically cleaned and `git diff --check` then passed. | Verified |
| PR/ship state | `gh pr view` for current branch reported PR #1384 already merged. Current worktree still contains mixed uncommitted changes across ingestion data plus unrelated API/UI/DB/fuel workflow files, so no new commit was made from this pane. | Not shipped from current dirty tree |

## Verified Row Counts

`npm run ingest:verify` reported:

- `apps/web/src/lib/ingested/citygross.ts`: 7,200 rows.
- `apps/web/src/lib/ingested/mathem.ts`: 8,131 rows.
- `apps/web/src/lib/ingested/matspar.ts`: 4,000 rows.
- `apps/web/src/lib/ingested/ica-reklamblad.ts`: 2,000 rows.
- `apps/web/src/lib/ingested/lidl.ts`: 8,640 rows.
- `apps/web/src/lib/ingested/apohem.ts`: 858 rows.
- `apps/web/src/lib/ingested/matpriskollen.ts`: 3,500 rows.
- `apps/web/src/lib/ingested/ica.ts`: 93,109 rows.
- `apps/web/src/lib/ingested/willys.ts`: 1,200 product rows and 44,241 weekly discount rows.
- `apps/web/src/lib/ingested/hemkop.ts`: 4,200 product rows and 51,059 weekly discount rows.
- `apps/web/src/lib/ingested/coop.ts`: 2,860 product rows and 3,874 weekly discount rows.

Every verifier-tracked dataset had matching source metadata row counts, zero missing `sourceUrl`, zero missing `retrievedAt`, zero invalid HTTP URLs, zero invalid ISO timestamps, and zero duplicate provenance/content keys.

## Live Source Spot Checks

- City Gross stores API: `https://www.citygross.se/api/v1/PageData/stores` returned HTTP 200 JSON.
- Matspar search page: `https://www.matspar.se/kategori?q=makaroner` returned HTTP 200 HTML.
- Mathem search page: `https://www.mathem.se/se/search/products/?q=makaroner` returned HTTP 200 HTML.
- ICA offer page: `https://www.ica.se/erbjudanden/ica-focus-1004247/` returned HTTP 200 with weekly offer content. The guessed `https://www.ica.se/reklamblad/` returned 404 and was rejected as evidence.

## Completion Decision

Do not mark the active goal complete yet. The real-data and validation requirements are covered, but the explicit four-worker coordination deliverable is not complete because every worker attempt failed before producing usable artifacts.
