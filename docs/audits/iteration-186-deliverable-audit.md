# Iteration 186 deliverable audit

## Scope

Harden the daily connector-to-PostgreSQL write path so failed persistence after a
`source_runs` row has been created leaves terminal operational evidence instead
of a stuck `running` source run.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Terminal source-run evidence after write aborts | `persistDailyConnectorOutput()` marks the created source run `failed` with the persistence error before rethrowing | Implemented |
| Regression coverage | `packages/ingestion/src/__tests__/ingestion.test.ts` simulates an observation insert failure and asserts `update source_runs` writes status `failed` with the error message | Implemented |
| Operator diagnosis | `docs/ops/production-daily-ingestion-readiness.md` documents `<chain>:persistence_failed:<message>` and the failed source-run behavior | Implemented |
| Completion audit updated | `docs/status/completion-audit.md` records the terminal failure evidence gate | Implemented |

## Verification

- Red: `rtk npm run test -w @groceryview/ingestion -- --test-name-pattern "marks the source run failed when daily observation persistence aborts after run creation"` failed because no `update source_runs` call existed.
- Green focused and full verification will be run before PR.
