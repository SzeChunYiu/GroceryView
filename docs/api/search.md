# Product Search API

`GET /api/search?q=<query>` returns public product-search results from the GroceryView product catalogue.

## Barcode Contract

Barcode scanner handoffs use the same `q` parameter as typed search. Clients should pass the raw EAN/GTIN digits as `q`; the server normalizes search through the weighted product search pipeline and the database search query gives exact `products.barcode = query.term` matches the strongest rank.

The contract is exact-match only for barcodes:

- A full barcode can return the matching product row when the catalogue has that barcode.
- A product-name match must not be treated as a barcode match unless the barcode field matches the submitted digits.
- Missing, short, or partial barcode inputs return normal empty search results instead of guessed products.
- The endpoint does not infer price, stock, retailer availability, or package equivalence from a barcode scan.

## Response Shape

Successful responses return JSON with:

- `query`: the submitted query string.
- `expandedQueries`: weighted search expansions used by text search.
- `matchedAliases`, `matchedFuzzyAliases`, `matchedSynonyms`, and `queryWeights`: explanation metadata for text search.
- `results`: up to eight catalogue product rows.
- `rankingMode`: `weighted_alias_fuzzy_token_expansion`.
- `source`: `postgres.products_tsvector_alias_synonym_expansion_weighted_fuzzy`.
- `cacheStatus`: `hit`, `miss`, or `stored` when cache state is available.

When `q` is shorter than two characters, the API returns `200` with an empty `results` array. If `DATABASE_URL` is not configured, the endpoint returns `503` with `error: "product_search_database_unconfigured"`. Query failures return `500` with `error: "product_search_query_failed"`.

## Scanner Usage

Scanner UI code should treat exact barcode search as a lookup convenience, not evidence of price or availability. If `/api/search?q=<ean>` has no exact result, the scanner should keep the manual missing-product flow available and collect product name, store hint, and package evidence for review.
