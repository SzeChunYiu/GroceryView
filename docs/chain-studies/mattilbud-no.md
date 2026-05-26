# Mattilbud / Tjek offer access (NO)

Primary source scope: mattilbud.no public homepage, Tjek API/product pages, and Tilbudsdata public copy reviewed on 2026-05-25.

## Verified public coverage

Mattilbud presents Norwegian grocery offers and flyers through a Tjek-hosted application. The public homepage includes app-data for Norwegian business coverage, including named chains such as MENY, Joker, REMA 1000, Bunnpris, Matkroken, Kiwi, Spar, Coop Prix, Coop Mega, Coop Marked, Obs, Extra, and Europris. The same response links to Tjek terms of service.

Connector impact: `mattilbud-no` parses this public app-data as `MattilbudNoChainCoverageRow` so we can track source coverage without inventing offer rows.

## Offer payload access

The reviewed public homepage did not embed offer, product, or publication rows. Tjek publicly advertises API and SDK products for publication feeds and retailer integrations, but those pages present API access as an integration/customer channel rather than an unauthenticated public endpoint. Tilbudsdata similarly presents flyer statistics, extraction, and archive access behind a customer login.

Connector impact: `fetchMattilbudNoAccessReport` reports `offerAccess: 'not_embedded_public_homepage'` when no offer payload is present. This keeps ingestion fail-closed until GroceryView has authorized Tjek/Mattilbud feed access or a public offer payload to parse.

## Supported mapping when authorized payloads are supplied

`parseMattilbudNoOffers` accepts Mattilbud/Tjek-style JSON payloads and normalizes weekly offer rows with:

- source URL and retrieval timestamp
- chain/business scope
- validity start and end dates
- flyer publication id, publication URL, and page number
- product URL, image URL, category, price text, unit/compare price text
- canonical product key from barcode when present, otherwise source id or name slug

Rows are emitted only from actual payload fields. The connector does not synthesize Norwegian weekly offers from chain coverage alone.
