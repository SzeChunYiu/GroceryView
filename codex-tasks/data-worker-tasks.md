# Data Worker Tasks — Dagster lane

Owner lane: `data-worker`  
Writable paths: `workers/data-pipeline/`, `docs/api-reverse-engineering/`, `docs/parallel-sessions/handoff-data-worker.md`, and shared contracts only by coordination.

## Numbered implementation checklist

1. [ ] Check repo state and read the current plan.
   - Run: `cd /projects/hep/fs10/shared/nnbar/billy/GroceryView && git status --short --branch`
   - Read: `ROADMAP.md`, `docs/data-sources.md`, `docs/parallel-sessions/shared.md`, and this file.
   - If another lane has changed `workers/data-pipeline/` or `infra/docker-compose.yml`, stop and read that lane's handoff before editing.
2. [ ] Create a lane branch.
   - Run: `git checkout -b data-worker/dagster-scaffold`
3. [ ] Create the Python/Dagster project directory.
   - Run: `mkdir -p workers/data-pipeline/src/groceryview_data_pipeline/{assets,resources,checks,schemas,scrapers} workers/data-pipeline/tests`
4. [ ] Create Python project metadata.
   - Path: `workers/data-pipeline/pyproject.toml`
   - Project name: `groceryview-data-pipeline`
   - Python requirement: `>=3.13`
   - Dependencies: `dagster`, `dagster-webserver`, `dagster-postgres`, `pydantic`, `pydantic-settings`, `psycopg[binary]`, `sqlalchemy`, `pandas`, `httpx`, `beautifulsoup4`, `python-dotenv`, `tenacity`, `orjson`, `minio`.
   - Dev dependencies: `pytest`, `ruff`, `mypy`, `types-beautifulsoup4`.
5. [ ] Add local environment examples that reference the shared docker compose stack.
   - Path: `workers/data-pipeline/.env.example`
   - Include: `DATABASE_URL=postgresql://groceryview:groceryview@localhost:5432/groceryview`, `REDIS_URL=redis://localhost:6379`, `OBJECT_STORAGE_ENDPOINT=http://localhost:9000`, `OBJECT_STORAGE_BUCKET=groceryview-raw`, `USER_AGENT=GroceryViewBot/0.1 contact@example.com`, `RUN_MODE=local`.
   - Note: local DB/Redis should come from `infra/docker-compose.yml` after the db-schema lane creates it.
6. [ ] Add Dagster definitions.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/definitions.py`
   - Export `Definitions` with assets, resources, schedules, jobs, and asset checks.
7. [ ] Add settings and storage resources.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/resources/settings.py`
   - Use `pydantic-settings` for `DATABASE_URL`, `REDIS_URL`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `USER_AGENT`, `RUN_MODE`, `SCRAPE_START_UTC`, and `SCRAPE_END_UTC`.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/resources/database.py`
   - Use SQLAlchemy or `psycopg[binary]` to connect to PostgreSQL from `DATABASE_URL`.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/resources/object_storage.py`
   - Use package `minio` to write immutable raw JSON/HTML snapshots before parsing.
8. [ ] Add normalized observation schemas.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/schemas/observations.py`
   - Pydantic models: `RawSourceRecord`, `NormalizedProduct`, `PriceObservation`, `PromotionObservation`, `RetailerFetchResult`.
   - Required fields: `source_type`, `source_url`, `observed_at`, `price_type`, `currency`, `confidence_score`, `raw_snapshot_hash`, `parser_version`, and optional `store_id`/retailer store id.
9. [ ] Add source-run and seed assets.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/source_runs.py`
   - Asset creates/logs a `source_runs` record with `source_name`, `started_at`, `parser_version`, `status`.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/seed_catalog.py`
   - Assets: `stockholm_chain_seed`, `stockholm_store_seed`, `hero_product_seed`.
   - Match chains and hero products from `ROADMAP.md`, `PROPOSAL.md`, and `infra/db/seeds/001_stockholm_seed.sql` after that seed exists.
10. [ ] Add retailer fetch interfaces and compliance guardrails.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/base.py`
    - Implement a shared `RetailerScraper` protocol, `httpx.AsyncClient` factory with the configured `USER_AGENT`, snapshot hashing, retry policy using `tenacity`, and per-source rate-limit hooks.
    - Enforce guardrails from `docs/data-sources.md`: respect `robots.txt`, no account/checkout/cart/search bypassing, no frontend API key reuse as permission, cache aggressively, keep source URL/timestamp.
11. [ ] Add Willys structured JSON scraper stub.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/willys.py`
    - Endpoint template: `https://www.willys.se/c/{category}?size=50&page={page}`
    - Parse fields: `code`, `name`, `manufacturer`, `price`, `priceValue`, `comparePrice`, `comparePriceUnit`, `priceUnit`, `labels`, `potentialPromotions`, image URLs.
    - Crawl window: 04:00-08:45 UTC, minimum 10 seconds between requests.
    - Output `PriceObservation` rows with `source_type=willys_online_json`, `price_type=online`, `confidence_score=0.80` until partner approval.
    - Future implementation branch: `data-worker/willys-scraper`.
12. [ ] Add Hemköp structured JSON scraper stub.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/hemkop.py`
    - Endpoint template: `https://www.hemkop.se/c/{category}?size=50&page={page}`
    - Use the same Axfood-shaped parser as Willys, including `potentialPromotions` and `lowestHistoricalPrice` when present.
    - Crawl window: 04:00-08:45 UTC, minimum 10 seconds between requests.
    - Output `source_type=hemkop_online_json`, `price_type=online`, `confidence_score=0.80` until partner approval.
    - Future implementation branch: `data-worker/hemkop-scraper`.
13. [ ] Add ICA store seed and per-store scraper stub.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/ica.py`
    - Store endpoint: `https://handla.ica.se/api/store/v1?zipCode={zip_code}&customerType=private`
    - Filter Stockholm-area stores approximately latitude `59.1..59.5`, longitude `17.8..18.2`.
    - Product endpoint placeholder: `https://handla.ica.se/api/retailItems/v1?storeId={store_id}&categoryId={category_id}`; keep disabled until legal/technical approval confirms permitted store context handling.
    - Output planned `source_type=ica_per_store_json`, `price_type=online_or_store_context`, with explicit `store_id` and confidence labels.
    - Future implementation branch: `data-worker/ica-scraper`.
14. [ ] Add Lidl weekly offers scraper stub.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/lidl.py`
    - Source: `https://www.lidl.se/` weekly/current offer data and leaflets only; do not assume a full Swedish SKU catalog exists.
    - Parse fields when available: product name, offer price, compare price, valid_from, valid_to, campaign text, member/Lidl Plus flag.
    - Output `source_type=lidl_weekly_offer`, `price_type=flyer_or_promo`, `confidence_score=0.75` unless source confidence is improved.
    - Future implementation branch: `data-worker/lidl-scraper`.
15. [ ] Add Coop API-discovery placeholder, not an unauthorized scraper.
    - Path: `docs/api-reverse-engineering/coop.md`
    - Document approved discovery steps only: apply through `https://portal.api.coop.se/`, capture endpoint patterns in an owned test device if permitted, and record required auth/store context.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/coop.py`
    - Stub should raise `NotImplementedError` with a message that Coop current-price ingestion requires partner/API approval; weekly offers or user receipts can be ingested separately.
    - Future implementation branch after approval: `data-worker/coop-scraper`.
16. [ ] Add City Gross and Open Food Facts/Open Prices stubs.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/city_gross.py`
    - Start as a documented discovery stub for Stockholm product/price endpoints.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/scrapers/open_food_facts.py`
    - Use Open Food Facts product API for Swedish product metadata and Open Prices API `https://prices.openfoodfacts.org/api/v1/` for supplemental observations.
    - Output `source_type=open_food_facts_catalog` for metadata and `source_type=open_prices_community`, `confidence_score=0.50` for community prices pending verification.
17. [ ] Add transform assets.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/retailer_fetch.py`
    - Assets/stubs: `fetch_willys_category_snapshot`, `fetch_hemkop_category_snapshot`, `fetch_ica_store_seed`, `fetch_lidl_offer_seed`, `fetch_open_food_facts_catalog`.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/normalize_prices.py`
    - Assets: `normalized_products`, `price_observations`, `promotion_observations`.
    - Output demo rows only until legal/data approval is complete.
18. [ ] Add rollup assets.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/rollups.py`
    - Assets: `latest_store_prices_rollup`, `price_series_daily_rollup`, `stockholm_grocery_index_seed`, `deal_score_input_seed`.
19. [ ] Add data quality checks.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/checks/quality_checks.py`
    - Checks: price is positive, currency is `SEK`, unit price is present when unit size is present, confidence is between 0 and 1, member/promo price types are distinct from regular price, every parsed row has `source_url`, `observed_at`, `parser_version`, and raw snapshot hash.
20. [ ] Add Dagster jobs and schedules.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/jobs.py`
    - Jobs: `seed_catalog_job`, `retailer_fetch_job`, `normalize_prices_job`, `rollup_prices_job`.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/schedules.py`
    - Schedule website scrapers daily at `04:30 UTC`; use 3 retries with exponential backoff and alert hooks for consecutive failures.
21. [ ] Add smoke tests.
    - Path: `workers/data-pipeline/tests/test_definitions.py`
    - Test that `Definitions` loads and assets/checks/jobs/schedules are registered.
    - Path: `workers/data-pipeline/tests/test_observation_schemas.py`
    - Test required provenance fields and confidence-score validation.
22. [ ] Verify the worker scaffold.
    - Run: `cd workers/data-pipeline && python -m venv .venv && . .venv/bin/activate && pip install -e '.[dev]'`
    - Run: `ruff check src tests`
    - Run: `mypy src`
    - Run: `pytest`
    - Smoke server if practical: `dagster dev -f src/groceryview_data_pipeline/definitions.py`
23. [ ] Write handoff.
    - Path: `docs/parallel-sessions/handoff-data-worker.md`
    - Include commands run, assets/scraper stubs created, compliance caveats, local `infra/docker-compose.yml` dependency, next source to implement, and blockers.
24. [ ] Commit and open PR.
    - Run: `git add workers/data-pipeline docs/api-reverse-engineering docs/parallel-sessions/handoff-data-worker.md`
    - Run: `git commit -m "feat(worker): scaffold Dagster data pipeline"`
    - Run: `git push -u origin data-worker/dagster-scaffold`
    - Run: `GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh /projects/hep/fs10/shared/nnbar/billy/bin/gh pr create --title "feat(worker): scaffold GroceryView data pipeline" --body "Scaffolds Python/Dagster data pipeline with source stubs, schemas, rollups, and quality checks." --base main`

## Evaluation criteria after source implementations

1. [ ] Coverage: report how many products/stores per chain were collected.
2. [ ] Freshness: report how often prices change versus scrape cadence.
3. [ ] Reliability: report percent of scrape runs that succeed by source.
4. [ ] Uniqueness: report store-level or source-specific value, especially ICA per-store observations.
5. [ ] Legal/operational risk: document robots/terms/approval status and whether production use requires a partner agreement.
