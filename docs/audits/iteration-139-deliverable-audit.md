# Iteration 139 deliverable audit — adaptive total and unit price cards

## Objective

Turn the research finding that grocery users need both actual pack prices and comparable unit prices into a real GroceryView product surface, without hiding the observed total price or fabricating unit prices when package-size evidence is missing.

## Delivered product surface

- Product-card model: added `adaptiveProductCards` and `homepageAdaptiveProductCards` in `apps/web/src/lib/verified-data.ts`, derived only from generated Axfood chain rows and OpenPrices observations already visible in the product universe.
- Comparable-unit normalization: added package parsing for `kg`, `g`, `l`, `cl`, `ml`, `st`, and simple multipacks; unit prices are computed only from observed price plus reported package size.
- Adaptive display: added `apps/web/src/components/product-price-cards.tsx`, a client component with an explicit compare-mode toggle for Adaptive, Total, and Per kg/l/st sorting.
- Product and homepage surfaces: replaced the old mixed product rail on `/products` and the homepage with `ProductPriceCards`, preserving links to verified product pages and showing both total and unit labels on every card.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Targeted route tests | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="adaptive total and unit price product cards"` exited 0; web route suite reported 62 passing tests including the new adaptive card contract. |
| Typecheck smoke | Pass | `rtk npm run typecheck` (`tsc --noEmit -p tsconfig.json`) exited 0 before full verification. |
| Full repository tests | Pass | `rtk git diff --check && rtk npm test` exited 0 on the product branch after fast-forwarding to `origin/main`. |
| Build | Pass | `rm -rf apps/web/.next && rtk npm run build` completed workspace TypeScript builds and the Next.js production build for 203 static routes. |
| Typecheck | Pass | `rtk npm run typecheck` (`tsc --noEmit -p tsconfig.json`) exited 0 after the build. |
| Product PR merge | Pass | PR #889 merged at 2026-05-22T12:59:58Z with merge commit `99ab3b011e303ccd9087ae412669acb4df56082a`; verified as an ancestor of `origin/main`. |
| Audit PR merge | Pending | This follow-up audit branch records the product PR merge proof; merge proof must be added after this audit PR lands. |

## Guardrails checked

- The card component says `No synthetic unit prices` and falls back to explicit missing-package copy when no package quantity can be parsed.
- Adaptive mode never hides the actual observed pack price; it only changes which verified price signal leads and sorts the card.
- Links continue to resolve to generated `/products/[slug]` routes rather than demo data.

## Code-review graph note

The project instruction asks for code-review-graph MCP tools before file scanning. Those MCP tools were not available in this execution context, so this audit was produced from direct repository inspection and verification output instead.

## Remaining research findings after this round

- Complete the full OpenFoodFacts all-Sweden metadata catalog using a durable bulk export/filter strategy instead of fragile deep public search pagination.
- Complete production readiness checks across every required chain, store, and product target.
- Replace manual fulfillment evidence snapshots with official live retailer fulfillment APIs where contracts and compliance allow.
- Add a real retailer transfer adapter only after legal/commercial capability verification supplies an endpoint and signing contract.
- Continue remaining data-source backlog: ICA Handla per-branch, Coop discovery, Mathem probing, refresh scripts for Axfood/OpenPrices, and receipt scanner ground-truth ingestion.
