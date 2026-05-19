# Iteration 1 Deliverable Audit

## Objective restatement

Ship all GroceryView deliverables iteratively, checking tasks and merging each iteration to `main` through a PR.

## Iteration 1 shipped scope

| Proposal requirement | Artifact evidence | Status |
| --- | --- | --- |
| TradingView-style market overview | `apps/web/src/main.ts`, `apps/web/public/styles.css` renders Stockholm Grocery Market, movers, market chart | Shipped initial web slice |
| Product ticker pages / metrics foundation | `packages/core/src/index.ts` exports Deal Score and score bands used by ticker rows | Domain foundation shipped, detailed route pending |
| Chart-first experience | Static market chart in `apps/web/src/main.ts`; index methodology in core | Initial chart shipped, richer charting pending |
| Favorite-store basket comparison | `compareBasketStrategies` and test `basket.test.ts` | Shipped core behavior |
| No travel-time optimization | `basket.test.ts` asserts cheapest store wins even when farther away | Verified |
| Ads do not affect Deal Score | `dealScore.test.ts` includes `sponsoredPlacement` and verifies no boost | Verified |
| Grocery indices MVP foundation | `calculateFixedBasketIndex` and `indices.test.ts` | Shipped core behavior |
| Website page | `apps/web/public/index.html`, `apps/web/src/main.ts` | Shipped static landing/dashboard |
| PR and merge after iteration | GitHub PR evidence to be added after merge | Pending until PR step |

## Verification commands

- `npm test`
- `npm run build`
- `npm run typecheck`

## Known remaining product gaps

The proposal is much larger than iteration 1. Remaining major gaps include auth, persistent database, real price ingestion, mobile apps, product/store/category routes, watchlist persistence, barcode/receipt scan, household sharing, alerts, ad integration, SEO pages, community verification, and advanced indices.

## Iteration 2 update

Iteration 2 targets more P0/P1 foundations: product search, watchlist alerts, budget summaries, and generated artifact cleanup. Evidence will be recorded in `docs/audits/iteration-2-deliverable-audit.md`.
