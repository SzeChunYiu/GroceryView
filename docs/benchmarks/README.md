# Nordic benchmark registry

GroceryView separates official benchmark metadata from GroceryView retail observations. The registry has four official/context layers:

- **consumer index** — CPI/HICP category movement from official statistics agencies.
- **regulated reference** — medicine price/reimbursement references from regulators; not normal retail shelf prices.
- **upstream agriculture** — farm/wholesale/agricultural market context; not supermarket shelf prices.
- **energy context** — energy or fuel context series; not station-level pump observations.

GroceryView retail observations are a different layer: scraped or ingested product prices stored as observations. Per `docs/PROJECT_STANDARDS.md`, the benchmark registry must never invent a CPI value, interpolate missing months, claim live ingestion when only metadata exists, or present regulated/upstream data as retail price evidence.
