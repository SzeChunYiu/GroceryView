# Iteration 130 deliverable audit — basket import/export bridge

## Objective

Implement the research finding for browser extension or bookmarklet basket import/export as a real GroceryView product surface, while keeping account writes consent-gated and fail-closed for unmatched retailer rows.

## Delivered product surface

- Core planner: `planBasketImportExport` validates source metadata, shopper consent, retailer-captured rows, and known GroceryView product matches.
- Account API: `importBasketFromRetailerPage(userId, request)` imports only matched product rows into the signed-in account basket and returns unmatched retailer rows for review.
- HTTP API: `POST /api/basket/import-export` accepts bookmarklet, browser-extension, or copy-paste payloads behind user authorization and is documented in OpenAPI.
- Nest demo API route: `POST /users/demo/basket/import-export` exposes the same contract for app clients.
- Web contract: the basket ideas route now describes the bookmarklet/import-export contract next to retailer handoff guardrails.
- Static asset: `apps/web/public/bookmarklets/groceryview-basket-import.js` captures visible retailer basket text only after explicit shopper consent and copies a review payload for GroceryView.

## Safety and trust behavior

- Imports require explicit shopper consent before retailer page content is read.
- Only verified GroceryView product ids or known aliases can update an account basket automatically.
- Unmatched retailer rows remain visible as review items and are never silently added as verified catalogue products.
- Export text is generated from matched GroceryView product names so shoppers can move baskets without relying on hidden automation.
- The bookmarklet is a helper for review payload capture, not a retailer checkout or purchase-confirmation mechanism.

## Verification

| Check | Status | Notes |
| --- | --- | --- |
| Core TDD | Pass | `rtk npm run test -w @groceryview/core -- --test-name-pattern=planBasketImportExport` |
| API TDD | Pass | `rtk npm run test -w @groceryview/api -- --test-name-pattern="bookmarklet basket"` |
| Server/OpenAPI TDD | Pass | `rtk npm run test -w @groceryview/server -- --test-name-pattern="mutates favorite stores|documents proposal API routes"` |
| Nest API TDD | Pass | `rtk npm run test -w @groceryview/api-app -- --test-name-pattern="serves products|serves health"` |
| Web contract TDD | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="bookmarklet import"` |
| Full workspace tests | Pass | `rtk git diff --check && rtk npm test` |
| Build | Pass | `rtk npm run build` |
| Typecheck | Pass | `rtk npm run typecheck` |
| PR and merge | Pending | Product PR not created yet. |

## Code-review graph note

The project instruction asks to use the code-review-graph MCP before filesystem exploration. That MCP server was not available in this Codex tool context, so this round used targeted file inspection and test-first changes.

## Remaining research findings

- Production account-backed UI rendering for private basket import and review instead of static contract cards.
- Live retailer delivery or pickup slot evidence where retailers permit it.
- Secure retailer basket transfer only for retailers and contexts where the capability is verified.
- Production operations readiness checks across every required chain, store, and product coverage target.
