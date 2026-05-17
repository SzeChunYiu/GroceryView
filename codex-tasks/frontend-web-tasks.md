# Frontend Web Tasks — Next.js lane

Owner lane: `frontend-web`  
Writable paths: `apps/web/`, root monorepo config, `packages/ui-tokens/`, `packages/api-contracts/` only when contracts are coordinated with backend.

## Numbered implementation checklist

1. [x] Check repo state before editing.
   - Run: `cd /projects/hep/fs10/shared/nnbar/billy/GroceryView && git status --short --branch`
   - If another lane has changed files in your writable paths, stop and read its handoff before editing.
2. [x] Create a lane branch.
   - Run: `git checkout -b frontend-web/monorepo-scaffold`
3. [x] Create the pnpm workspace file at `pnpm-workspace.yaml`.
   - Contents must include: `apps/*`, `packages/*`, `workers/*`.
4. [x] Create root `package.json`.
   - Package name: `groceryview`
   - Set `private: true`
   - Set `packageManager: pnpm@10.11.0`
   - Set engines: `{ "node": ">=24.0.0", "pnpm": ">=10.0.0" }`
   - Add scripts: `build: turbo build`, `lint: turbo lint`, `typecheck: turbo typecheck`, `dev: turbo dev`.
   - Add dev dependency: `turbo`.
5. [x] Create `turbo.json`.
   - Define tasks: `build`, `lint`, `typecheck`, `dev`.
   - `build` must depend on `^build` and output `.next/**`, `dist/**`, `build/**`.
6. [x] Create root `tsconfig.json` with strict TypeScript defaults.
   - Set `strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: bundler`, `skipLibCheck: true`.
7. [x] Create root `.gitignore`.
   - Include: `node_modules/`, `.next/`, `.turbo/`, `dist/`, `build/`, `.env`, `.env.*`, `!.env.example`, `coverage/`, `.DS_Store`.
8. [x] Scaffold the web app.
   - Run: `pnpm dlx create-next-app@latest apps/web --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --use-pnpm`
   - If prompted, choose App Router and no experimental React Compiler unless it is the default stable option.
9. [x] Pin web package versions in `apps/web/package.json`.
   - Ensure package names include: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `eslint`, `eslint-config-next`.
   - Target versions from research: `next@16.2.x`, React 19.2-compatible dependencies.
10. [x] Add web UI/data packages.
    - Run from repo root: `pnpm --filter web add @tanstack/react-query lightweight-charts maplibre-gl lucide-react zod`
    - Run from repo root: `pnpm --filter web add -D @types/maplibre-gl`
11. [x] Initialize shadcn/ui for `apps/web`.
    - Run: `cd apps/web && pnpm dlx shadcn@latest init`
    - Choose Tailwind, CSS variables, neutral base color, and components path `src/components/ui`.
    - Add starter components: `pnpm dlx shadcn@latest add button card badge input table tabs`
12. [x] Configure `apps/web/next.config.ts`.
    - Set `output: "standalone"`.
    - Keep config minimal and TypeScript-valid.
13. [x] Create placeholder route structure.
    - `apps/web/src/app/page.tsx`: Today/market overview shell.
    - `apps/web/src/app/products/[slug]/page.tsx`: Product Price Terminal placeholder.
    - `apps/web/src/app/stores/[slug]/page.tsx`: Store page placeholder.
    - `apps/web/src/app/categories/[slug]/page.tsx`: Category page placeholder.
    - `apps/web/src/app/weekly-basket/page.tsx`: Weekly Basket placeholder.
    - `apps/web/src/app/budget/page.tsx`: Budget Tracker placeholder.
14. [x] Create shared web layout components.
    - `apps/web/src/components/site-header.tsx`
    - `apps/web/src/components/site-footer.tsx`
    - `apps/web/src/components/confidence-badge.tsx`
    - `apps/web/src/components/deal-score-card.tsx`
15. [x] Add chart placeholder component.
    - Path: `apps/web/src/components/price-chart-placeholder.tsx`
    - It must show 7D/30D/90D/1Y controls and state that TradingView Lightweight Charts integration is next.
16. [x] Verify the web build.
    - Run from repo root: `pnpm install`
    - Run: `pnpm --filter web lint`
    - Run: `pnpm --filter web build`
17. [x] Write handoff.
    - Path: `docs/parallel-sessions/handoff-frontend-web.md`
    - Include branch, commands run, files changed, next unfinished checklist item, and any blockers.
18. [x] Commit and open PR.
    - Run: `git add pnpm-workspace.yaml turbo.json package.json tsconfig.json .gitignore apps/web docs/parallel-sessions/handoff-frontend-web.md`
    - Run: `git commit -m "feat(web): scaffold monorepo and Next.js app"`
    - Run: `git push -u origin frontend-web/monorepo-scaffold`
    - Run: `GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh /projects/hep/fs10/shared/nnbar/billy/bin/gh pr create --title "feat(web): scaffold GroceryView web app" --body "Scaffolds pnpm/Turborepo and Next.js web shell." --base main`

## Manager closeout status — 2026-05-17 06:03 CEST

All checklist items 1-18 are marked complete after manager audit of current `origin/main` and accepted/merged frontend PRs. Evidence summary: item 11 landed via PR #67, item 16 integrated verification landed via PR #68, stale blocker PR #69 was closed, and no open `frontend-web/*` PRs remain.
