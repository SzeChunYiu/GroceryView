# Backend API Tasks — NestJS lane

Owner lane: `backend-api`  
Writable paths: `apps/api/`, `packages/api-contracts/`, backend handoff file.

## Numbered implementation checklist

1. [ ] Check repo state before editing.
   - Run: `cd /projects/hep/fs10/shared/nnbar/billy/GroceryView && git status --short --branch`
2. [ ] Create a lane branch.
   - Run: `git checkout -b backend-api/api-scaffold`
3. [ ] Scaffold the NestJS API.
   - Run: `pnpm dlx @nestjs/cli@latest new apps/api --package-manager pnpm --language ts --skip-git --strict`
   - Package name in `apps/api/package.json`: `api`.
4. [ ] Add required API packages.
   - Run: `pnpm --filter api add @nestjs/config @nestjs/swagger swagger-ui-express zod class-validator class-transformer @nestjs/mapped-types @nestjs/terminus`
   - Run: `pnpm --filter api add @nestjs/platform-express reflect-metadata rxjs`
   - Run: `pnpm --filter api add -D @types/swagger-ui-express`
5. [ ] Configure environment validation.
   - Create `apps/api/src/config/env.schema.ts` with Zod schema for `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`.
   - Update `apps/api/src/app.module.ts` to import `ConfigModule.forRoot({ isGlobal: true })`.
6. [ ] Enable global validation and OpenAPI.
   - Update `apps/api/src/main.ts` to use `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`.
   - Add Swagger document at `/docs` with title `GroceryView API` and version `0.1.0`.
7. [ ] Add health endpoint.
   - Create `apps/api/src/health/health.module.ts` and `apps/api/src/health/health.controller.ts`.
   - `GET /health` must return `{ "status": "ok", "service": "api" }`.
8. [ ] Add domain modules and controllers with typed placeholder responses.
   - Products: `apps/api/src/products/products.module.ts`, `products.controller.ts`, routes `GET /products`, `GET /products/:slug`.
   - Stores: `apps/api/src/stores/stores.module.ts`, `stores.controller.ts`, routes `GET /stores`, `GET /stores/:slug`.
   - Prices: `apps/api/src/prices/prices.module.ts`, `prices.controller.ts`, routes `GET /products/:slug/prices`, `GET /products/:slug/series`.
   - Watchlists: `apps/api/src/watchlists/watchlists.module.ts`, `watchlists.controller.ts`, routes `GET /me/watchlist`, `POST /me/watchlist`.
   - Baskets: `apps/api/src/baskets/baskets.module.ts`, `baskets.controller.ts`, routes `GET /me/weekly-basket`, `POST /me/weekly-basket/items`.
   - Alerts: `apps/api/src/alerts/alerts.module.ts`, `alerts.controller.ts`, route `GET /me/alerts`.
9. [ ] Create shared API contracts package.
   - Path: `packages/api-contracts/package.json`, package name `@groceryview/api-contracts`.
   - Path: `packages/api-contracts/src/index.ts`.
   - Export Zod schemas: `ProductSummarySchema`, `StoreSummarySchema`, `PriceObservationSchema`, `DealScoreSchema`, `WatchlistItemSchema`, `WeeklyBasketSchema`, `AlertSchema`.
10. [ ] Wire contracts into API without database dependency yet.
    - API controllers may import contract TypeScript types or mirror DTOs; keep placeholder data explicit and marked as seed/demo.
11. [ ] Add CORS configuration.
    - Read `CORS_ORIGINS` from env and allow local web `http://localhost:3000` by default.
12. [ ] Add `.env.example` for the API.
    - Path: `apps/api/.env.example`
    - Include: `NODE_ENV=development`, `PORT=3001`, `DATABASE_URL=postgresql://groceryview:groceryview@localhost:5432/groceryview`, `REDIS_URL=redis://localhost:6379`, `CORS_ORIGINS=http://localhost:3000`.
13. [ ] Verify the API build.
    - Run from repo root: `pnpm install`
    - Run: `pnpm --filter api build`
    - Run smoke test if practical: `pnpm --filter api start:dev` then `curl http://localhost:3001/health`.
14. [ ] Write handoff.
    - Path: `docs/parallel-sessions/handoff-backend-api.md`
    - Include commands run, modules created, verification output, next task, and blockers.
15. [ ] Commit and open PR.
    - Run: `git add apps/api packages/api-contracts docs/parallel-sessions/handoff-backend-api.md`
    - Run: `git commit -m "feat(api): scaffold NestJS API"`
    - Run: `git push -u origin backend-api/api-scaffold`
    - Run: `GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh /projects/hep/fs10/shared/nnbar/billy/bin/gh pr create --title "feat(api): scaffold GroceryView API" --body "Scaffolds NestJS API with health, Swagger, config, and placeholder product/store/price modules." --base main`
