# Official benchmark registry

The benchmark registry documents official Nordic daily-essentials reference sources without pretending those sources are GroceryView retail observations. It follows [docs/PROJECT_STANDARDS.md](../PROJECT_STANDARDS.md): no fabricated values, deltas, time series, confidence scores, or live-data claims.

## Layers

- **Consumer index** — CPI/HICP-style official inflation indices by consumption group. These measure index movement for a representative basket, not the price of a specific product at a specific store.
- **Regulated reference** — medicine reimbursement, maximum-price, or similar regulated price references. These are legal/administrative reference prices, not normal retail observations.
- **Upstream agriculture** — farm-gate, wholesale, or agricultural market context. These can explain food supply pressure but are not supermarket shelf prices.
- **Energy context** — official energy or fuel-market statistics that contextualize fuel prices. These are separate from operator station prices.
- **Retail observation** — GroceryView's own scraped, imported, or database-backed product/store observations with provenance.

## Why retail observations are different

GroceryView retail observations answer: "What did this source report for this product/store/grade at this time?" Official benchmark sources usually answer a broader statistical or regulatory question. The app may link these layers side by side only when each layer is labelled and ingestion status is honest.

Current registry sources are `registry_only`. UI must render "Source documented, ingestion not yet implemented" until source-specific ingestion work moves a source to `ingestion_ready` or `live`.
