# Iteration 100 Deliverable Audit — Current-Inclusive 52-Week Ranges

## Objective restatement

Keep stock-style grocery price numbers internally consistent for customers. If the current best quote is a new low or high, the displayed 52-week range in the product terminal and market mover API must include that live quote instead of showing a stale historical range.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Detect inconsistent 52-week range | Fresh API output showed milk current price `13.9` below its displayed range low `14.9` | Reproduced |
| Add regression test before implementation | API tests now assert milk mover and product terminal ranges are `{ low: 13.9, high: 16.9 }` | Red then green |
| Fix product terminal range | `productPriceTerminalFor()` uses a shared range helper that includes the current best quote | Implemented |
| Fix market mover range | `marketMoverFor()` uses the same range helper before calculating 52-week position | Implemented |
| Preserve existing coffee range behavior | Existing coffee terminal and mover expectations remain unchanged | Verified by API tests |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/api` | API regression tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Hosted proof still depends on deployment plus fresh Open Prices/imported or retailer-approved observations.
- Current-inclusive range fixes the API semantics; downstream live UIs still depend on configured API base and deployed data freshness.
