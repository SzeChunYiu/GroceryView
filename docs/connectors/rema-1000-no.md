# REMA 1000 Norway connector

Last reviewed: **2026-05-25**.

The REMA 1000 Norway connector is limited to public, read-only web evidence from `https://www.rema.no`. It must not use authenticated REMA app traffic, personalized offers, private campaign state, or reverse-engineered mobile APIs.

## Source research

| Surface | Finding | Connector stance |
| --- | --- | --- |
| Homepage navigation | `rema.no` exposes public navigation for `Tilbud og kampanjer`, `Butikker`, `Ukens kundeavis`, and a site search entry point. | Public pages can be studied for source discovery and fixture capture. |
| Weekly campaign page | `https://www.rema.no/kampanjevarer/` responds as public HTML and advertises REMA campaign/offer content. | `rema-1000-flyer-no.ts` can parse recorded public campaign fixtures when product blocks are present. |
| Product/search page | `https://www.rema.no/search?search={query}` redirects to a public WordPress search page. | `rema-1000-no.ts` keeps a query-bounded search fixture parser for public product rows embedded in HTML or JSON state. |
| Store query page | `robots.txt` disallows `/butikker/?q=`. | Store-scoped scraping is blocked until a separately allowed source is documented. |
| Legacy search and recipe search | `robots.txt` disallows `/search.php?search=` and `/oppskrifter/?search=`. | The connector does not target those paths. |

## Access policy

`REMA_1000_NO_ACCESS_POLICY` in `packages/ingestion/src/connectors/rema-1000-no.ts` is the executable source contract:

- use only public read-only REMA 1000 pages;
- keep runs query-bounded;
- attach `sourceUrl`, `retrievedAt`, parser version, and source kind to every row;
- treat rows as national/catalog evidence because this connector has no allowed branch-specific price source yet; and
- fail closed on HTTP errors, blocked/login pages, malformed rows, or rows without product id, name, and price evidence.

## Normalized product fixture contract

`parseRema1000NoProducts()` accepts recorded public HTML/JSON fixtures and emits `Rema1000NoProduct` rows with:

- market identifiers: `country: "NO"`, `currency: "NOK"`, `chain: "rema-1000-no"`;
- store identifiers: `storeId: null`, `storeName: null`, because no allowed branch-specific source is documented;
- product identifiers: `code`, `name`, `brand`, `category`, `packageText`, `productUrl`, `imageUrl`;
- price fields: `price`, `priceText`, `unitPriceText`, `unitPriceUnit`;
- freshness: `sourceUrl`, `retrievedAt`, and `sourceFreshness.parserVersion`; and
- provenance: `source: "rema_no_search"` and `accessPolicy: "public_read_only_search"`.

Rows are de-duplicated by `code`. Missing or malformed product rows are dropped instead of guessed.

## Known limitations

- The public search page is WordPress-backed and may not expose stable product JSON on every query.
- Store-level prices, personalized REMA app discounts, and branch availability are not normalized by this connector.
- A future store-scoped REMA connector must first document an allowed public source and update the access policy.
