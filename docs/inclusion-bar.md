# Retailer inclusion bar

GroceryView tracks retailers only when their prices are stable enough to improve a country, chain, or category index. A retailer qualifies as a **major tracked retailer** when it clears at least one of these gates:

1. **Physical footprint:** the retailer operates **3 or more physical stores** in the country or market being modeled.
2. **Revenue signal:** the retailer has **at least 1,000,000 kr annual revenue** in the market, verified from a primary filing, official annual report, or other cited business registry source.
3. **National online presence:** the retailer has a public online catalog, delivery, pickup, or ordering flow that is available nationally or across multiple regions in the market.

Retailer-type tickets must cite the exact clause they clear, for example `inclusion-bar: physical-footprint`, `inclusion-bar: revenue-signal`, or `inclusion-bar: national-online-presence`.

## Explicit exclusions

Do **not** track single-shop online dropships, micro-volatile pop-ups, temporary campaign-only sellers, or hobby-scale stores that do not clear one of the gates above. Small-scale online businesses with volatile prices are excluded because their price signal can pollute market indexes, exaggerate promotions, and create false savings comparisons for users.

## Evidence requirements

- Prefer official store locators, official company pages, annual reports, business registry records, or the retailer's own public ordering/catalog pages.
- Do not infer revenue or national reach from advertising copy alone.
- If the evidence is incomplete, mark the retailer as `candidate_skip` until a gate is verified.
- Connector and study PRs should include the clause in their docs, tests, fixture metadata, or source policy notes so reviewers can see why the retailer belongs in coverage.

## Examples

| Retailer pattern | Decision | Clause |
| --- | --- | --- |
| Grocery chain with 20 stores | Track | `physical-footprint` |
| Online pharmacy shipping nationwide | Track | `national-online-presence` |
| Regional specialty store with verified 1.5M kr annual revenue | Track | `revenue-signal` |
| One Instagram-only imported snack shop | Skip | Does not clear a gate; volatile micro-retailer |
| Seasonal pop-up candy site with no registry evidence | Skip | Temporary/volatile price signal |
