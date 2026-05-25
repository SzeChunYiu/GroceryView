# Benchmark no-fabrication rule

This rule extends [docs/PROJECT_STANDARDS.md](../PROJECT_STANDARDS.md) for official benchmark work.

Fabrication includes:

- inventing a CPI, HICP, medicine reference, energy, or agriculture value;
- interpolating between months and presenting the result as official;
- displaying year-over-year or month-over-month changes without source data;
- claiming a source is live when the registry status is `registry_only`, `ingestion_planned`, or `ingestion_ready`;
- merging upstream agriculture, regulated medicine references, or consumer-index values into GroceryView retail prices;
- assigning confidence scores without a verifier or source-quality model.

Safe alternatives:

- show the source as `registry only` with a homepage/API link;
- say "Official benchmark exists for this category — ingestion planned";
- keep GroceryView retail observations and official benchmarks in separate labelled blocks;
- wait for a connector ticket to prove ingestion before rendering values.
