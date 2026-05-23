# Overpass ingestion evidence

- Source: overpass-api.de for OpenStreetMap
- Source URL: https://overpass-api.de/api/interpreter
- Retrieved: 2026-05-22T15:38:35.034Z
- Query: Swedish county fallback extract for shop=supermarket|convenience|grocery; 16 counties returned combined regex JSON and 5 counties were fetched with exact per-shop fallback queries after combined-query timeout/rate-limit responses
- Real rows fetched: 5113
- Raw OSM elements inspected: 5284
- Connector: packages/ingestion/src/connectors/overpass.ts
- Web wire: apps/web/src/lib/ingested/overpass.ts
- License: ODbL, (C) OpenStreetMap contributors

Every emitted row includes OSM element type/id, coordinates, shop tag, source URL, and retrievedAt. Deduplication key is sourceUrl + osmType + osmId.

## Fetch Summary

- SE-AC: 167 elements, 162 emitted rows
- SE-BD: 180 elements, 167 emitted rows
- SE-C: 168 elements, 161 emitted rows
- SE-D: 128 elements, 121 emitted rows
- SE-F: 150 elements, 145 emitted rows
- SE-G: 125 elements, 122 emitted rows
- SE-I: 38 elements, 35 emitted rows
- SE-K: 106 elements, 104 emitted rows
- SE-M: 710 elements, 688 emitted rows
- SE-N: 140 elements, 130 emitted rows
- SE-O: 856 elements, 828 emitted rows
- SE-S: 200 elements, 184 emitted rows
- SE-U: 114 elements, 110 emitted rows
- SE-W: 178 elements, 172 emitted rows
- SE-X: 157 elements, 156 emitted rows
- SE-Z: 112 elements, 106 emitted rows
- SE-AB supermarket: 598 elements, 596 emitted rows
- SE-AB convenience: 458 elements, 443 emitted rows
- SE-AB grocery: 4 elements, 4 emitted rows
- SE-E supermarket: 132 elements, 132 emitted rows
- SE-E convenience: 100 elements, 94 emitted rows
- SE-E grocery: 1 elements, 1 emitted rows
- SE-H supermarket: 118 elements, 117 emitted rows
- SE-H convenience: 52 elements, 49 emitted rows
- SE-H grocery: 0 elements, 0 emitted rows
- SE-T supermarket: 92 elements, 91 emitted rows
- SE-T convenience: 46 elements, 44 emitted rows
- SE-T grocery: 0 elements, 0 emitted rows
- SE-Y supermarket: 94 elements, 93 emitted rows
- SE-Y convenience: 60 elements, 58 emitted rows
- SE-Y grocery: 0 elements, 0 emitted rows

## Sample Retrieved Rows

1. node/29898149 | ICA nära Karlaplan | ICA Nära | supermarket | 59.337217,18.0911217
2. node/29898162 | Coop Erik Dahlbergsgatan | Coop | supermarket | 59.3423537,18.0911049
3. node/30452954 | ICA Kvantum Landvetter | ICA Kvantum | supermarket | 57.6863361,12.211245
4. node/35134990 | Handlar'n i Fyrudden | Handlar'n i Fyrudden | convenience | 58.1922602,16.852335
5. node/35514774 | ICA Nära Vårsta | ICA Nära | supermarket | 59.1646601,17.7961694
6. node/38453442 | ICA nära Norrviken | ICA Nära | supermarket | 59.4586,17.9231
7. node/49888802 | Hemköp Sollentuna Rotehallen | Hemköp | supermarket | 59.4768,17.9118
8. node/49924832 | ICA Supermarket Format | ICA Supermarket | supermarket | 59.4984186,17.9258961
9. node/51229934 | PLOQ Spånga Spångav. | PLOQ Spånga Spångav. | convenience | 59.3781037,17.9053569
10. node/54043636 | ICA Supermarket Atterdags | ICA Supermarket | supermarket | 57.6335058,18.2896271
11. node/54808864 | Stora Coop Kalix | Coop | supermarket | 65.8548753,23.145001
12. node/60750116 | Maxi ICA Stormarknad Häggvik | Maxi ICA Stormarknad | supermarket | 59.4377882,17.9319525
13. node/78473316 | ICA Supermarket Skrapan | ICA Supermarket | supermarket | 59.6109313,16.5495677
14. node/90159005 | Hemköp Stockholm Älvsjö | Hemköp | supermarket | 59.2787519,18.00228
15. node/90345238 | Ica Nära Sjöberga Lanthandel | ICA Nära | convenience | 58.1961077,16.3705472
