# Iteration 1 MVP Web Core Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the first GroceryView slice that proves the TradingView-for-groceries concept with tested domain calculations and a responsive web dashboard.

**Architecture:** Keep the domain math in `packages/core` so web and future mobile apps share deal scoring, basket comparison, and index calculations. Build `apps/web` as a static TypeScript dashboard that renders seeded Stockholm MVP data without requiring native bundler tooling.

**Tech Stack:** TypeScript workspaces, Node built-in test runner, static HTML/CSS/TS web output.

---

### Task 1: Repository baseline

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Steps:** initialize npm workspaces, exclude generated and local supervisor files, and keep the existing proposal as product source-of-truth.

### Task 2: Tested core calculations

**Files:**
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/__tests__/dealScore.test.ts`
- Create: `packages/core/src/__tests__/basket.test.ts`
- Create: `packages/core/src/__tests__/indices.test.ts`

**Steps:** write failing tests for Deal Score v1, basket comparison without travel-time penalty, and fixed-basket index methodology; implement only enough domain logic to satisfy the tests.

### Task 3: Web MVP dashboard

**Files:**
- Create: `apps/web/src/main.ts`
- Create: `apps/web/public/index.html`
- Create: `apps/web/public/styles.css`
- Create: `apps/web/scripts/copy-assets.mjs`

**Steps:** render Stockholm market overview, product ticker table, chart-style index cards, and favorite-store basket strategy using the shared core package.

### Task 4: Verification and PR

**Commands:**
- `npm test`
- `npm run build`
- `npm run typecheck`
- `git status -sb`
- Create PR and merge to `main`.
