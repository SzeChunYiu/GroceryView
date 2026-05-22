# Iteration 127 deliverable audit: recurring basket digest product round

Date: 2026-05-22

## Objective restatement

User asked to implement the research findings as real GroceryView product functionality and to PR + merge to `main` after every round. This round implements one concrete retention/habit finding from the global benchmark: recurring weekly baskets with "changed since last shop" summaries and explicit missing-price blockers.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Turn research into real product, not only docs | `packages/core/src/index.ts` exports `planRecurringBasketDigest`; `packages/api/src/index.ts` exposes `getRecurringBasketDigest`; `packages/server/src/index.ts` exposes `/api/basket/recurring-digest`; `apps/web/src/app/weekly-basket/page.tsx` surfaces the product contract. | Complete |
| Implement recurring baskets / weekly digest research finding | Core digest computes comparable totals, price-up/down/new-item/substitute/missing-price states, headline, recommended actions, and guardrails. | Complete |
| Keep product honest/fail-closed | Digest compares only lines with current and previous verified prices; missing current prices remain blockers; substitutes never rewrite baskets automatically; static web page still withholds private rows without auth-backed data. | Complete |
| Verify with tests | Targeted tests added for core, API, server HTTP, and web route contract. `rtk git diff --check`, `rtk npm test`, `rtk npm run build`, and `rtk npm run typecheck` passed on 2026-05-22. Next build emitted SWC native-load warnings but completed successfully using WASM bindings. | Complete |
| PR and merge to main | PR URL and merged state must be recorded after merge. | Pending until PR is merged |

## Verification notes

- Code-review-graph MCP tools requested by root instructions were not available in this tool context; fallback inspection was used.
- This is one implementation round toward the broad "all findings" objective. Remaining research findings still include deeper browser extension/basket transfer work, travel-cost optimizer, live retailer handoff support matrix, and production account-backed UI rendering.
