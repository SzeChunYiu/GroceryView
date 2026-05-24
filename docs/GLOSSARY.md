# GroceryView Glossary

This glossary defines shared GroceryView product, price, ingestion, and shopper-facing terms so docs, code reviews, and support notes use the same language.

| Term | Definition | Example |
| --- | --- | --- |
| Canonical product | A canonical product is the normalized product record GroceryView uses to group equivalent retailer listings under one stable product identity. | `Arla milk 1L 3%` can be the canonical product for matching ICA, Coop, and Hemköp milk listings that differ only in retailer wording. |
| Listing | A listing is a retailer- or source-specific offer row for a product at a chain, store, channel, or page at a specific point in the catalog. | A Willys web row for `Bananer 1 kg` with its displayed price and product URL is a listing. |
| Observation | An observation is an append-only piece of evidence captured from a source that records a product, price, promotion, stock, origin, or certification fact at an observed time. | A scrape that saw eggs priced at 32.90 SEK on May 24 creates a price observation for that listing. |
| Promotion | A promotion is a temporary price or deal condition that changes the shopper-facing value of a listing for a limited period or audience. | `2 for 45 SEK` on pasta through Sunday is stored as promotion evidence rather than as the normal shelf price alone. |
| Ranker | A ranker is the deterministic scoring logic that orders products, stores, or recommendations for a shopper objective. | The nearby ranker can place a slightly more expensive item first when it is available at the shopper's preferred local store. |
| Confidence | Confidence is GroceryView's quality signal for how trustworthy a match, price, source, or derived recommendation is based on evidence and guardrails. | A direct retailer API price with a fresh timestamp can be high confidence, while an OCR receipt row with uncertain text can be low confidence. |
| Chain | A chain is a retail brand or operator that owns one or more stores or digital storefronts in the GroceryView catalog. | ICA, Coop, Willys, and Hemköp are chains. |
| Store | A store is a physical branch or digital fulfillment location where a chain sells products and where prices or availability may differ. | `Willys Stockholm City` is a store under the Willys chain. |
| Country | A country is the national market or source geography used to partition chains, stores, products, prices, currency assumptions, and compliance rules. | Sweden (`SE`) and Iceland (`IS`) are countries when comparing Nordic grocery evidence. |
| Source-run | A source-run is one execution of an ingestion connector or data import job, including its start time, finish time, status, counts, and diagnostics. | A nightly ICA scrape that accepted 12,000 product rows is one source-run. |
| Effective unit price | Effective unit price is the normalized price per comparable unit after package size, promotion, member rules, or multi-buy math has been applied. | A 500 g cheese block priced at 59 SEK has an effective unit price of 118 SEK/kg. |
| Member price | A member price is a discounted price available only to shoppers who meet a retailer membership, loyalty, or account condition. | `29.90 SEK with ICA Stammis` is a member price. |
| Surplus | Surplus is the modeled extra value, quantity, or savings left after comparing a listing or recommendation against the relevant baseline. | A 10 SEK cheaper basket versus the usual store has 10 SEK of savings surplus. |
| Channel | A channel is the sales or evidence path through which GroceryView sees or presents an offer, such as in-store, online delivery, pickup, receipt, or flyer. | The same product can have different online delivery and in-store channels. |
| Format | A format is the store or offer type that affects assortment, pricing, service model, or shopper expectations. | A hypermarket, discount store, pharmacy counter, and online-only storefront are different formats. |
| Region tier | A region tier is GroceryView's coarse geographic grouping used to compare coverage, availability, and price behavior without exposing every store as its own market. | Stockholm can be a metropolitan region tier while rural Norrland can be grouped into a lower-density tier. |
