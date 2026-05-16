# Backend API Handoff

## WORKER-A — API scaffold

Date: 2026-05-17 01:22 Europe/Stockholm
Branch: `backend-api/api-scaffold`

### Task completed
Implemented the backend API scaffold from `codex-tasks/backend-api-tasks.md`:

- Added NestJS app under `apps/api` with package name `api`.
- Added required NestJS/config/Swagger/validation packages.
- Added Zod environment validation in `apps/api/src/config/env.schema.ts`.
- Enabled global validation pipe, CORS from `CORS_ORIGINS` with `http://localhost:3000` default, and Swagger UI at `/docs`.
- Added `GET /health` returning `{ "status": "ok", "service": "api" }`.
- Added demo/seed placeholder controllers and modules for products, stores, prices, watchlists, baskets, and alerts.
- Added `packages/api-contracts` with Zod schemas for product/store/price/deal/watchlist/basket/alert contracts.
- Added `apps/api/.env.example` with NODE_ENV, PORT, DATABASE_URL, REDIS_URL, and CORS_ORIGINS.
- Updated root `pnpm-lock.yaml` so the workspace install includes the new API and contracts packages.

### Commands run

```bash
git status --short --branch
git checkout -b backend-api/api-scaffold origin/main
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH node --version
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH pnpm --version
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true pnpm install
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH pnpm --filter api build
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH pnpm --filter @groceryview/api-contracts build
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH pnpm --filter api test:e2e
HOME=/tmp/scyiu-home XDG_CACHE_HOME=/tmp/scyiu-cache PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH PORT=3001 CORS_ORIGINS=http://localhost:3000 pnpm --filter api start:prod
curl -fsS http://127.0.0.1:3001/health
```

### Verification output

- Node: `v24.15.0`
- pnpm: `10.11.0`
- `pnpm install`: succeeded for all workspace projects. Warning: pnpm reported ignored build scripts for `@nestjs/core`, `@scarf/scarf`, `sharp`, and `unrs-resolver`; install exited 0.
- `pnpm --filter api build`: succeeded.
- `pnpm --filter @groceryview/api-contracts build`: succeeded.
- `pnpm --filter api test:e2e`: 1 suite passed, 3 tests passed.
- Smoke test: `curl http://127.0.0.1:3001/health` returned:

```json
{"status":"ok","service":"api"}
```

### Next task

After this PR lands, continue with database-backed repositories/services or the next unchecked backend task in `codex-tasks/backend-api-tasks.md`.

### Blockers

None for this scaffold. Local shell defaulted to Node 20, so verification explicitly used the installed Node 24 path.

---

## WORKER-B — Branch-task record from main

Updated: 2026-05-17 01:22 Europe/Stockholm
Pane: PANE 3 / WORKER-B
Branch: `backend-api/worker-b-second-task`
Base: `origin/main` at `f7694bc` (`Merge pull request #23 from SzeChunYiu/frontend-web/ui-data-packages-worker-c`)

### Task taken

- Read the required lane docs from the shared workspace:
  - `docs/parallel-sessions/shared.md`
  - `docs/parallel-sessions/backend-api.md`
- Checked `origin/main:codex-tasks/backend-api-tasks.md`.
- Took the **second literal unchecked checklist task**, item 2: create a lane branch.
- Used branch `backend-api/worker-b-second-task` instead of the historical `backend-api/api-scaffold` name because backend scaffold branches/PRs already exist and this worker must not collide with or repeat WORKER-A work.

### What changed

- Added this backend handoff file on the worker branch to record completion of checklist item 2 and the evidence below.
- No `apps/api/**` or `packages/api-contracts/**` product-code files were changed by this branch-task PR.

### Commands run

```bash
cd /projects/hep/fs10/shared/nnbar/billy/GroceryView
git status --short --branch
git fetch origin --prune
git show origin/main:codex-tasks/backend-api-tasks.md
# Isolated clone used because the shared checkout had many unrelated lane files/worktrees.
git clone --branch main <origin-url> /tmp/groceryview-backend-worker-b-second-clone
cd /tmp/groceryview-backend-worker-b-second-clone
git checkout -b backend-api/worker-b-second-task
git status --short --branch
```

### Verification

- Current branch in the isolated clone: `backend-api/worker-b-second-task`.
- `git status --short --branch` before this handoff edit showed a clean branch at `f7694bc`.
- The selected checklist item is branch creation only, so no API build or health endpoint smoke test applies to this branch-task PR.

### Next task

- The next unchecked backend checklist item after this literal branch task is item 3, scaffold the NestJS API, unless an existing open backend API PR is accepted first.

### Blockers / notes

- Several older backend API PRs already exist for scaffold/config/contracts work. This branch intentionally does not duplicate those product-code changes.
- `origin/main` does not currently contain `docs/parallel-sessions/shared.md` or `docs/parallel-sessions/backend-api.md`; those lane docs were read from the shared workspace checkout as requested by the objective.

---

## WORKER-C — Domain controller demo-response hardening

Updated: 2026-05-17 01:42 Europe/Stockholm
Pane: PANE 4 / WORKER-C
Branch: `backend-api/domain-controllers-worker-c-current`
Base: started from `github/backend-api/api-scaffold` (`69167de`); PR #27 has since merged to `main` as `c109af5`, so PR #29 now diffs only the WORKER-C files below.

### Task taken

- Read required lane docs:
  - `docs/parallel-sessions/shared.md`
  - `docs/parallel-sessions/backend-api.md`
- Took the third non-procedural backend checklist task assigned to WORKER-C: domain modules/controllers with typed seed/demo placeholder responses.
- Avoided duplicating the existing scaffold PR by branching from `backend-api/api-scaffold` and only tightening the domain placeholder response contract.

### What changed

- Updated `apps/api/src/baskets/baskets.controller.ts` so every weekly-basket item placeholder response, including `POST /me/weekly-basket/items`, carries `demo: true` like the other seed/demo domain responses.
- Updated `apps/api/test/app.e2e-spec.ts` to assert the basket-item POST route returns the explicit demo marker.

### Commands run

```bash
cd /projects/hep/fs10/shared/nnbar/billy/GroceryView
git status --short --branch
git fetch --all --prune
# Isolated clone used because the shared checkout had unrelated lane files and worktree metadata was pruned by other concurrent panes.
git clone /projects/hep/fs10/shared/nnbar/billy/GroceryView /tmp/groceryview-worker-c-clone
cd /tmp/groceryview-worker-c-clone
git fetch https://github.com/SzeChunYiu/GroceryView.git '+refs/heads/*:refs/remotes/github/*' --prune
git checkout -b backend-api/domain-controllers-worker-c-current github/backend-api/api-scaffold
PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH node --version
PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm@10.21.0 --version
PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true corepack pnpm@10.21.0 install --frozen-lockfile
PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm@10.21.0 --filter api build
PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm@10.21.0 --filter @groceryview/api-contracts build
PATH=/projects/hep/fs10/shared/codex-tooling/nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm@10.21.0 --filter api test:e2e
```

### Verification

- Node: `v24.15.0`
- pnpm: `10.21.0`
- `corepack pnpm@10.21.0 install --frozen-lockfile`: passed. Warning: pnpm reported ignored build scripts for `@nestjs/core`, `@scarf/scarf`, `sharp`, and `unrs-resolver`; install exited 0.
- `corepack pnpm@10.21.0 --filter api build`: passed.
- `corepack pnpm@10.21.0 --filter @groceryview/api-contracts build`: passed.
- `corepack pnpm@10.21.0 --filter api test:e2e`: passed (`1 suite`, `3 tests`).

### Next task / blockers

- No current blocker for this PR: PR #27 has merged and GitHub reports PR #29 as clean with only `apps/api/src/baskets/baskets.controller.ts`, `apps/api/test/app.e2e-spec.ts`, and this handoff in the file list.
- Next backend lane task should continue from the remaining unchecked checklist items after this domain placeholder hardening is reviewed.
