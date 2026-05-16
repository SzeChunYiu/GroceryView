# Data Worker Tasks — Dagster lane

Owner lane: `data-worker`  
Writable paths: `workers/data-pipeline/`, worker handoff file, and shared contracts only by coordination.

## Numbered implementation checklist

1. [ ] Check repo state before editing.
   - Run: `cd /projects/hep/fs10/shared/nnbar/billy/GroceryView && git status --short --branch`
2. [ ] Create a lane branch.
   - Run: `git checkout -b data-worker/dagster-scaffold`
3. [ ] Create the worker project directory.
   - Run: `mkdir -p workers/data-pipeline/src/groceryview_data_pipeline/{assets,resources,checks,schemas} workers/data-pipeline/tests`
4. [ ] Create Python project metadata.
   - Path: `workers/data-pipeline/pyproject.toml`
   - Project name: `groceryview-data-pipeline`
   - Python requirement: `>=3.13`
   - Dependencies: `dagster`, `dagster-webserver`, `dagster-postgres`, `pydantic`, `pydantic-settings`, `psycopg[binary]`, `sqlalchemy`, `pandas`, `httpx`, `beautifulsoup4`, `python-dotenv`, `tenacity`.
   - Dev dependencies: `pytest`, `ruff`, `mypy`.
5. [ ] Add Dagster definitions.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/definitions.py`
   - Export `Definitions` with assets, resources, and asset checks.
6. [ ] Add settings resource.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/resources/settings.py`
   - Use `pydantic-settings` for `DATABASE_URL`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `USER_AGENT`, and `RUN_MODE`.
7. [ ] Add database resource.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/resources/database.py`
   - Use SQLAlchemy or psycopg to connect to PostgreSQL from `DATABASE_URL`.
8. [ ] Add source-run asset.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/source_runs.py`
   - Asset creates or logs a `source_runs` record with `source_name`, `started_at`, `parser_version`, `status`.
9. [ ] Add seed assets.
   - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/seed_catalog.py`
   - Assets: `stockholm_chain_seed`, `hero_product_seed`.
   - Match the same chains and hero products listed in `ROADMAP.md` and `PROPOSAL.md`.
10. [ ] Add retailer fetch stubs with compliance guardrails.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/retailer_fetch.py`
    - Assets/stubs: `fetch_willys_category_snapshot`, `fetch_hemkop_category_snapshot`, `fetch_ica_store_seed`, `fetch_coop_offer_seed`, `fetch_lidl_offer_seed`.
    - Include comments/enforced settings for custom User-Agent, crawl-delay, visit-time windows where applicable, and no checkout/account/cart/search scraping.
11. [ ] Add normalization schemas.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/schemas/observations.py`
    - Pydantic models: `RawSourceRecord`, `NormalizedProduct`, `PriceObservation`, `PromotionObservation`.
    - Required fields: `source_type`, `source_url`, `observed_at`, `price_type`, `confidence_score`, `raw_snapshot_hash`, `parser_version`.
12. [ ] Add transform assets.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/normalize_prices.py`
    - Assets: `normalized_products`, `price_observations`, `promotion_observations`.
    - Output demo rows only until legal/data approval is complete.
13. [ ] Add rollup assets.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/assets/rollups.py`
    - Assets: `latest_store_prices_rollup`, `price_series_daily_rollup`, `stockholm_grocery_index_seed`.
14. [ ] Add data quality checks.
    - Path: `workers/data-pipeline/src/groceryview_data_pipeline/checks/quality_checks.py`
    - Checks: price is positive, currency is SEK, unit price is present when unit size is present, confidence is between 0 and 1, member price is distinct from regular price type.
15. [ ] Add local env example.
    - Path: `workers/data-pipeline/.env.example`
    - Include `DATABASE_URL=postgresql://groceryview:groceryview@localhost:5432/groceryview`, `OBJECT_STORAGE_ENDPOINT=http://localhost:9000`, `OBJECT_STORAGE_BUCKET=groceryview-raw`, `USER_AGENT=GroceryViewBot/0.1 contact@example.com`, `RUN_MODE=local`.
16. [ ] Add smoke tests.
    - Path: `workers/data-pipeline/tests/test_definitions.py`
    - Test that `Definitions` loads and assets/checks are registered.
17. [ ] Verify the worker.
    - Run: `cd workers/data-pipeline && python -m venv .venv && . .venv/bin/activate && pip install -e '.[dev]'`
    - Run: `ruff check src tests`
    - Run: `pytest`
    - Run smoke server if practical: `dagster dev -f src/groceryview_data_pipeline/definitions.py`
18. [ ] Write handoff.
    - Path: `docs/parallel-sessions/handoff-data-worker.md`
    - Include commands run, assets created, compliance caveats, next source to implement, and blockers.
19. [ ] Commit and open PR.
    - Run: `git add workers/data-pipeline docs/parallel-sessions/handoff-data-worker.md`
    - Run: `git commit -m "feat(worker): scaffold Dagster data pipeline"`
    - Run: `git push -u origin data-worker/dagster-scaffold`
    - Run: `GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh /projects/hep/fs10/shared/nnbar/billy/bin/gh pr create --title "feat(worker): scaffold Dagster data pipeline" --body "Scaffolds Python/Dagster data pipeline with source stubs, schemas, rollups, and quality checks." --base main`
