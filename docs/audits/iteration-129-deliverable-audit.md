# Iteration 129 deliverable audit — retailer handoff support matrix

## Objective

Implement the research finding for an honest action layer in GroceryView: turn a signed-in basket into retailer handoff actions while making retailer support explicit, falling back when basket transfer is unsupported, and never claiming checkout or purchase confirmation without verified retailer evidence.

## Delivered product surface

- Core planner: `planRetailerHandoff` validates basket lines and support metadata, then emits ordered copy-list, product-link, app-search, and basket-transfer actions with explicit statuses.
- Account API: `getRetailerHandoffPlan(userId, retailerId)` builds retailer-aware handoff reports for saved baskets.
- HTTP API: `GET /api/basket/handoff/{retailerId}` returns the support matrix driven action plan for authenticated user baskets and is documented in OpenAPI.
- Nest demo API route: `GET /users/demo/basket/handoff/:retailerId` exposes the same contract for the deployed app shell without fabricating private account data.
- Web contract: the basket ideas route now surfaces the retailer handoff support matrix contract and keeps static snapshots fail-closed via `NoVerifiedData`.

## Support-matrix behavior

- Willys and Coop expose product deep-link actions where product URLs are known.
- Lidl remains manual for product links until verified link templates exist.
- Basket transfer is marked unsupported for current retailers unless the matrix explicitly verifies support.
- Copy-list fallback remains the primary ready action so shoppers can continue manually without hidden automation claims.
- Missing product links stay visible as manual-review blockers before leaving GroceryView.

## Checkout-confirmation guardrail

The implementation fails closed: unsupported checkout confirmation produces a clear reason that GroceryView cannot claim purchase completion. The API response keeps this separate from handoff aids, so GroceryView does not imply a retailer checkout, delivery slot, or successful purchase from local basket data.

## Verification

| Check | Status | Notes |
| --- | --- | --- |
| Core TDD | Pass | `rtk npm run test -w @groceryview/core -- --test-name-pattern=planRetailerHandoff` |
| API TDD | Pass | `rtk npm run test -w @groceryview/api -- --test-name-pattern="retailer handoff"` |
| Server/OpenAPI TDD | Pass | `rtk npm run test -w @groceryview/server -- --test-name-pattern="mutates favorite stores|documents proposal API routes"` |
| Nest API TDD | Pass | `rtk npm run test -w @groceryview/api-app -- --test-name-pattern="serves products|serves health"` |
| Web contract TDD | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="retailer handoff"` |
| Full workspace tests | Pass | `rtk git diff --check && rtk npm test` |
| Build | Pass | `rtk npm run build` |
| Typecheck | Pass | `rtk npm run typecheck` |
| PR and merge | Pending | Product PR not created yet. |

## Code-review graph note

The project instruction asks to use the code-review-graph MCP before filesystem exploration. That MCP server was not available in this Codex tool context, so this round fell back to targeted file inspection and test-first changes.

## Remaining research findings

- Browser extension or bookmarklet basket import/export for retailer pages.
- Production account-backed UI rendering for private basket handoff instead of static contract cards.
- Live retailer delivery or pickup slot evidence where retailers permit it.
- Secure retailer basket transfer only for retailers and contexts where the capability is verified.
- Production operations readiness checks across every required chain, store, and product coverage target.
