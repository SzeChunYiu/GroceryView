# Iteration 125 Deliverable Audit — Production Env Value Validator

## Objective restatement

Add a reusable validator for production environment values, not just secret names, so operators can prove daily connector JSON and catalog coverage target JSON are structurally valid and include all required chains before enabling production ingestion.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Required env values are checked | `scripts/ops/validate-production-env.mjs` requires all runtime and workflow env names. | Implemented |
| Daily connector JSON covers all chains | Validator parses `GROCERYVIEW_DAILY_CONNECTORS_JSON`, checks required connector fields, and requires ICA, Willys, Coop, Hemköp, Lidl, and City Gross. | Implemented |
| Catalog target JSON covers all chains | Validator parses `CATALOG_COVERAGE_TARGETS_JSON`, requires non-empty target arrays, all required chains, and product-store matrix mode. | Implemented |
| Operator command is discoverable | Root script `ops:validate-production-env` runs the validator. | Implemented |
| Local self-test and failure test exist | Schema test covers successful `--self-test` and missing-env failure. | Verified |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk node --test tests/schema/production-env-validation-script.test.mjs` | Pass: 3 tests |
| `rtk npm run typecheck` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- Actual production values are still absent/not visible in GitHub Actions secrets, so the validator cannot pass against real deployment env yet.
- Once values are provided, operators should run `npm run ops:validate-production-env` in the deployment environment before relying on the daily workflow.
