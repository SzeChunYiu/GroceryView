# @groceryview/core

Shared TypeScript domain logic for GroceryView. This package keeps pure, framework-independent helpers for deal scoring, basket comparison, price history, product matching, household and pantry planning, notifications, privacy flows, and related grocery workflows.

## Code location

- Source: `packages/core/src/index.ts`
- Tests: `packages/core/src/__tests__/`
- Build output: `packages/core/dist/`
- Test output: `packages/core/dist-test/`

## Local commands

Run commands from `packages/core`:

```sh
npm run build
npm test
```

In the monorepo, use your package manager's workspace filter for `@groceryview/core` when running the same scripts from the repository root.

## Public modules

The package exposes one public entrypoint, `@groceryview/core`, backed by `src/index.ts`. Its top-level exports include helpers and types for:

- Deal scoring, historical deal scoring, and deal opportunity ranking
- Basket strategy comparison, store coverage, trip cost, fulfilment slots, import/export, retailer handoff, and recurring basket digests
- Fixed basket, brand tier, chain price, and personal grocery inflation indices
- Price history summaries, confidence disclosures, and chart series adapters
- Product search, category deal leaders, watchlist alerts, budgets, notifications, and smart substitutions
- Commodity comparison, human review queues, community report controls, and receipt review
- Household sharing, pantry replenishment, ad policy, nutrition-per-krona ranking, meal suggestions, expiry deal radar, and privacy/export flows

Import from the package root rather than from internal files:

```ts
import { calculateDealScore, compareBasketStrategies } from '@groceryview/core';
```
