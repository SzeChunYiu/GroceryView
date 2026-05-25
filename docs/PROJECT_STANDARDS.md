# Project standards

## No fabricated market data

GroceryView must never invent prices, index levels, historical series, deltas, confidence scores, stock status, source freshness, or country coverage. Every numeric value shown to users must be traceable to a repository fixture, ingested source record, database query, or explicitly documented official data source.

When a source is documented but ingestion is not implemented, UI copy must say so plainly. Acceptable labels include `registry only`, `ingestion planned`, `source documented, ingestion not yet implemented`, and `pending verified observations`.

## Layer separation

Official consumer indices, regulated medicine references, upstream agricultural prices, energy context, and GroceryView retail observations are different data layers. They may be shown side by side only when labels make the layer explicit; they must not be merged into a single retail-price claim.
