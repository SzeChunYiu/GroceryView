# GOAL — GroceryView

Updated: 2026-05-19 09:30 by billy (operator)

> **2026-05-19 ROOT-CAUSE CORRECTION.** The prior GOAL.md said *"Current
> phase: Research & architecture — workers should research … and produce
> initial architecture + feature specification documents."* That sentence
> sanctioned doc-only work, and the result was 80+ merged PRs of
> `docs(db): audit …` / `feat(api): wire shared response contracts` with
> **`apps/`, `packages/`, `workers/`, `infra/` all still empty** — an
> audit loop, zero shippable product. The research/architecture docs already
> exist (`docs/`, `PROPOSAL.md`, `ROADMAP.md`). This file now demands
> shippable code in the monorepo and treats doc-only iterations as reverted.

## Sprint target (≤7 days)

Stand up the GroceryView monorepo as a **running, buildable product skeleton**,
then land Phase-1 + the first Phase-2 P0 items from `ROADMAP.md`: a Next.js web
app, a NestJS API, the PostgreSQL/PostGIS schema + local docker infra, the
`packages/api-contracts` Zod DTOs, and the Python/Dagster data-pipeline
skeleton — all wired so `pnpm install && pnpm build && pnpm lint && pnpm
typecheck` succeed from a clean clone. Product = code under `apps/`,
`packages/`, `workers/`, `infra/`. Docs/audit/handoff iterations are reverted.

`ROADMAP.md` is the authoritative work breakdown (Phase 1 → 2 → 3, each item
has a "Definition of done"). Build to those DoDs in priority order.

## Acceptance test (executable)

```bash
# 1. clean install + full turbo build/lint/typecheck succeed from the repo root
pnpm install --frozen-lockfile=false
pnpm build
pnpm lint
pnpm typecheck

# 2. Phase-1 P0 scaffolds exist and build individually
test -f apps/web/package.json   && pnpm --filter web build
test -f apps/api/package.json   && pnpm --filter api build
test -f packages/api-contracts/package.json
test -d infra/db/migrations && test -f infra/db/SCHEMA.md
test -f infra/docker-compose.yml \
  && grep -qE 'postgis/postgis:18|postgres:18' infra/docker-compose.yml \
  && grep -q 'redis:7' infra/docker-compose.yml
test -d workers/data-pipeline

# 3. API exposes a health route and Swagger; web exposes the core routes
grep -rqiE "GET .*/health|@Get\('health'\)|health" apps/api/src
grep -rqE "products/\[slug\]|stores/\[slug\]|categories/\[slug\]" apps/web

# 4. data provenance is enforced in the contracts/schema (no fake official prices)
grep -rqiE "priceType|price_type|confidence|sourceType|observedAt|provenance" \
  packages/api-contracts infra/db

# 5. no secrets committed; env documented
test -f .env.example && grep -qE "DATABASE_URL|REDIS_URL" .env.example \
  && ! git grep -nE "(SUPABASE_SERVICE|AKIA[0-9A-Z]{16}|-----BEGIN .*PRIVATE KEY-----)" -- ':!*.example'
```

Steps 1–5 are factory-verifiable and MUST pass. They will legitimately FAIL
until the Phase-1 scaffolds land — that is the gate doing its job, not a bug.
The binding merge gate is the required GitHub check **`Validate
release-safe candidate`** (`.github/workflows/release-validation.yml`) plus
branch protection on `main`, mirrored by the operator PR guard.

## Product source paths (commits must touch ≥1 of these)

- `apps/`
- `packages/`
- `workers/`
- `infra/`

## Non-product paths (commits touching ONLY these are REVERTED)

- `docs/`
- `codex-tasks/`
- `change_log/`
- `reports/`
- `PROPOSAL.md`, `ROADMAP.md`, `CLAUDE.md`, `*.md` at repo root
- root tooling (`turbo.json`, `tsconfig.json`, `package.json`, `pnpm-*`) is
  product ONLY when the change makes a real `apps/`/`packages/`/`workers/`
  build pass (monorepo wiring); a lone root-config edit with no app code is meta

## Banned iteration types

queue-refresh, planner-audit-without-source-diff, validator-policy-refresh,
manager-review-without-rejection-or-accept, docs-only-handoff,
status-summary-as-deliverable, "intake" / "sync evidence" / "audit posture" /
"refresh master" / "wire shared response contracts" iterations that touch no
`apps/packages/workers/infra` code. Zero tolerance — these were the dominant
audit-loop generators on this repo.

## PR rule (merge-gate — enforced by operator guard, not just hooks)

Opening or merging any PR whose diff touches **zero** product path is a banned
iteration; the operator PR guard auto-closes it and auto-reverts any that
merged. A pane's iteration is complete only when a product-path diff is merged
behind a green `Validate release-safe candidate`. Handoffs go in the pane
journal, never a PR.

## Domain rules (binding — from ROADMAP cross-lane rules + PROPOSAL)

1. Preserve source provenance on every price: source URL/type, observed
   timestamp, price type, parser version, confidence, raw snapshot reference.
2. Treat online / flyer / member / in-store / receipt / shelf-photo / manual /
   estimated prices as distinct price types — never present an unverified
   price as the official shelf price.
3. Distance / travel time is NEVER part of default Deal Score — distance is
   metadata or an explicit user filter only.
4. Do not present scraped or open data as a partnership unless a signed
   agreement exists. Never fabricate retailer/data-source claims.

## Productivity targets

- ≥10 source-touching commits/day across all GroceryView workers combined.
- ≤20% of commits may be `[allow-meta]`-tagged non-product work.
- The `Validate release-safe candidate` check red on `main` is the ENTIRE
  fleet's #1 priority (GATE-FIRST) — no other task until it is green.

## Out of scope (do NOT spend time on)

- Real retailer scraping at scale / signed data partnerships (fetch *stubs*
  with provenance only, per ROADMAP "Ingestion v0").
- Production cloud infra, real auth providers, payments — local docker infra
  and stubbed adapters only for this sprint.

## Updated by operator only

Workers must not edit this file. Request a new goal via `[->OPERATOR
NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
