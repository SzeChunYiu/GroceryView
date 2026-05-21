# Iteration 122 Deliverable Audit — Required Chains in Coverage Targets

## Objective restatement

Prevent production catalog coverage targets from omitting a required chain. The daily catalog coverage gate should represent every required grocery chain before it can be used as evidence for the all-chains/all-branches objective.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Required chain list centralized in server runtime | `requiredDailyChainIds` defines `ica`, `willys`, `coop`, `hemkop`, `lidl`, and `city_gross`. | Implemented |
| Source-run readiness uses the same required chain list | Runtime source-run health receives `requiredDailyChainIds` instead of a separate inline chain array. | Implemented |
| Catalog targets must include every required chain | `parseCatalogCoverageTargets` rejects target JSON whose `targetChains` omits any required chain. | Implemented |
| Regression covers omitted chains | Runtime config test asserts omission of `ica`, `hemkop`, `lidl`, and `city_gross` fails closed. | Verified |
| Local example reflects all required chains | `.env.example` catalog target JSON lists all six required chains. | Implemented |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test -w @groceryview/server` | Pass: 55 tests |
| `rtk npm run typecheck` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- `targetChains` now cannot omit required chains, but production still needs real all-product and all-store target arrays.
- Store/branch target completeness is still only as good as the configured `targetStores` inventory.
