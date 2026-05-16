# GroceryView data pipeline

Python/Dagster scaffold for source runs, raw snapshots, normalized products, price observations, promotion observations, rollups, and quality checks.

Local PostgreSQL, Redis, and object storage are expected to be supplied by `../../infra/docker-compose.yml` after the db-schema lane creates it. Copy `.env.example` to `.env` for local runs.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
ruff check src tests
mypy src
pytest
dagster dev -f src/groceryview_data_pipeline/definitions.py
```
