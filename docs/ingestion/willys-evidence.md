# Willys ingestion evidence

- Source: handla.willys.se / willys.se public search JSON
- Source URL pattern: https://www.willys.se/search?q={query}
- Retrieved: 2026-05-20T23:54:12.788Z
- Search queries: makaroner, mjolk, kaffe, ris, pasta, yoghurt, brod, ost, agg, smor, potatis, banan, kyckling, ketchup, havregryn
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/willys.ts
- Web wire: apps/web/src/lib/ingested/willys.ts

Every emitted row includes a Willys product code, name, SEK price fields, source search URL, and retrieval timestamp.

## Weekly Discount Rows

- Source: willys.se public Axfood offline campaign JSON
- Source URL: https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
- Retrieved: 2026-05-22T08:28:04.861Z
- Store id: 2110
- Validity window in retrieved rows: 18/05-2026 through 24/05-2026, with weekend rows starting 20/05-2026
- Real weekly discount rows fetched and wired: 43

Every weekly discount row includes an Axfood promotion code, product code, product name, campaign type, promotion price text, compare price text when present, regular price text when present, save-price text when present, validity dates, source URL, and retrieval timestamp.

### Sample Weekly Discount Rows

1. 2500306014 | 100771309_ST | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
2. 2500306996 | 101844500_ST | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
3. 2500303258 | 100271983_ST | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
4. 2500298388 | 101842099_ST | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
5. 2500301201 | 101291227_ST | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50

## Sample Retrieved Rows

1. 101205621_ST | Idealmakaroner Gammaldags | Kungsörnen | 12,20 kr | https://www.willys.se/search?q=makaroner
2. 101205570_ST | Idealmakaroner Gammaldags | Kungsörnen | 22,24 kr | https://www.willys.se/search?q=makaroner
3. 101205623_ST | Snabbmakaroner | Kungsörnen | 15,04 kr | https://www.willys.se/search?q=makaroner
4. 101301620_ST | Makaroner Klassiska | Garant | 18,83 kr | https://www.willys.se/search?q=makaroner
5. 101216818_ST | Idealmakaroner | Kungsörnen | 27,35 kr | https://www.willys.se/search?q=makaroner
6. 101302991_ST | Makaroner Pasta | Garant Eko | 12,20 kr | https://www.willys.se/search?q=makaroner
7. 101240220_ST | Snabbmakaroner | Monte Castello | 14,10 kr | https://www.willys.se/search?q=makaroner
8. 101152565_ST | Eko Makaroner | Kungsörnen | 26,40 kr | https://www.willys.se/search?q=makaroner
9. 101301621_ST | Snabbmakaroner Pasta | Garant | 16,94 kr | https://www.willys.se/search?q=makaroner
10. 101300044_ST | Maccaronetti Pasta | Zeta | 15,99 kr | https://www.willys.se/search?q=makaroner
11. 101233931_ST | Mjölk Längre Hållbarhet 3% | Garant | 16,70 kr | https://www.willys.se/search?q=mjolk
12. 101205891_ST | Mjölk 3% | Garant | 11,90 kr | https://www.willys.se/search?q=mjolk
13. 101233933_ST | Mellanmjölk Längre Hållbarhet 1,5% | Garant | 16,70 kr | https://www.willys.se/search?q=mjolk
14. 101276728_ST | Mjölk Längre Hållbarhet 3% | Garant | 12,20 kr | https://www.willys.se/search?q=mjolk
15. 100010649_ST | Mjölk Färsk 3% | Falköpings | 18,90 kr | https://www.willys.se/search?q=mjolk

## Willys weekly discounts 2026-05-22

- Source: Willys public Axfood campaign JSON
- Source URL: https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
- Retrieved: 2026-05-22T08:28:04.861Z
- Store ID: 2110
- Real discount rows fetched: 43
- Web wire: apps/web/src/lib/ingested/willys.ts

Sample rows:
1. 2500306014 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
2. 2500306996 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
3. 2500303258 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
4. 2500298388 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
5. 2500301201 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
6. 2500297764 | Crunchy fries | 2 för 35,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
7. 2500308130 | Kycklingbröstfilé | 39,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
8. 2500298073 | Smör | 39,90/st | 18/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
9. 2500298184 | Klassikerlåda 18-pack | 79,90/st | 18/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50
10. 2500297334 | Kaptenens favoriter | 49,90/st | 18/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50

## Willys weekly discounts expansion 2026-05-22

- Source: willys.se public Axfood campaign JSON
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T10:55:55.346Z
- Store IDs: 2110, 2187, 2102, 2149, 2355, 2268, 2121, 2212, 2193, 2207, 2219, 2260
- Real weekly discount rows fetched and wired: 2428
- Web wire: apps/web/src/lib/ingested/willys.ts

Sample rows:
1. 2500306014 | 2110 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2110 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2110 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts 24-store expansion 2026-05-22

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store?online=true
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T11:57:50.378Z
- Store IDs: 2110, 2187, 2102, 2149, 2355, 2268, 2121, 2212, 2193, 2207, 2219, 2260, 2259, 2232, 2206, 2353, 2103, 2329, 2348, 2328, 2249, 2225, 2152, 2224
- Real weekly discount rows fetched and wired: 4852
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Sample rows:
1. 2500306014 | 2110 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2110 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2110 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
4. 2500306014 | 2259 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2259&type=PERSONAL_GENERAL&page=0&size=100
5. 2500306996 | 2259 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2259&type=PERSONAL_GENERAL&page=0&size=100
## Willys weekly discounts 36-store expansion 2026-05-22

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store?online=true
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T12:26:44.878Z
- Store IDs: 2110, 2187, 2102, 2149, 2355, 2268, 2121, 2212, 2193, 2207, 2219, 2260, 2259, 2232, 2206, 2353, 2103, 2329, 2348, 2328, 2249, 2225, 2152, 2224, 2118, 2282, 2240, 2325, 2267, 2322, 2230, 2248, 2292, 2241, 2132, 2223
- Real weekly discount rows fetched and wired: 7276
- Source URLs fetched: 108
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Per-store row counts:
- 2110: 202 rows
- 2187: 202 rows
- 2102: 202 rows
- 2149: 202 rows
- 2355: 206 rows
- 2268: 202 rows
- 2121: 202 rows
- 2212: 202 rows
- 2193: 202 rows
- 2207: 202 rows
- 2219: 202 rows
- 2260: 202 rows
- 2259: 202 rows
- 2232: 202 rows
- 2206: 202 rows
- 2353: 202 rows
- 2103: 202 rows
- 2329: 202 rows
- 2348: 202 rows
- 2328: 202 rows
- 2249: 202 rows
- 2225: 202 rows
- 2152: 202 rows
- 2224: 202 rows
- 2118: 202 rows
- 2282: 202 rows
- 2240: 202 rows
- 2325: 202 rows
- 2267: 202 rows
- 2322: 202 rows
- 2230: 202 rows
- 2248: 202 rows
- 2292: 202 rows
- 2241: 202 rows
- 2132: 202 rows
- 2223: 202 rows

Sample rows:
1. 2500306014 | 2110 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2110 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2110 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298388 | 2110 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
5. 2500301201 | 2110 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
