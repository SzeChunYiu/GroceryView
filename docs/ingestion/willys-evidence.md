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

## Willys weekly discounts 48-store expansion 2026-05-22

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store?online=true
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T13:34:18.349Z
- Store IDs: 2110, 2187, 2102, 2149, 2355, 2268, 2121, 2212, 2193, 2207, 2219, 2260, 2259, 2232, 2206, 2353, 2103, 2329, 2348, 2328, 2249, 2225, 2152, 2224, 2118, 2282, 2240, 2325, 2267, 2322, 2230, 2248, 2292, 2241, 2132, 2223, 2288, 2111, 2247, 2226, 2321, 2137, 2236, 2335, 2271, 2196, 2324, 2173
- Real weekly discount rows fetched and wired: 9700
- Source URLs fetched: 144
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Per-store row counts:
- 2102: 202 rows
- 2103: 202 rows
- 2110: 202 rows
- 2111: 202 rows
- 2118: 202 rows
- 2121: 202 rows
- 2132: 202 rows
- 2137: 202 rows
- 2149: 202 rows
- 2152: 202 rows
- 2173: 202 rows
- 2187: 202 rows
- 2193: 202 rows
- 2196: 202 rows
- 2206: 202 rows
- 2207: 202 rows
- 2212: 202 rows
- 2219: 202 rows
- 2223: 202 rows
- 2224: 202 rows
- 2225: 202 rows
- 2226: 202 rows
- 2230: 202 rows
- 2232: 202 rows
- 2236: 202 rows
- 2240: 202 rows
- 2241: 202 rows
- 2247: 202 rows
- 2248: 202 rows
- 2249: 202 rows
- 2259: 202 rows
- 2260: 202 rows
- 2267: 202 rows
- 2268: 202 rows
- 2271: 202 rows
- 2282: 202 rows
- 2288: 202 rows
- 2292: 202 rows
- 2321: 202 rows
- 2322: 202 rows
- 2324: 202 rows
- 2325: 202 rows
- 2328: 202 rows
- 2329: 202 rows
- 2335: 202 rows
- 2348: 202 rows
- 2353: 202 rows
- 2355: 206 rows

## Willys weekly discounts 254-store expansion 2026-05-23

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-23T19:16:15.751Z
- Store count: 254
- Source URLs fetched: 644
- Real weekly discount rows fetched and wired: 44241
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Sample rows:
1. 2500306014 | 2149 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2149 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2149 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298388 | 2149 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
5. 2500301201 | 2149 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts refresh 2026-05-24

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-24T12:27:35.330Z
- Store count: 254
- Source URLs fetched: 644
- Real weekly discount rows fetched and wired: 44241
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Sample rows:
1. 2500306014 | 2149 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2149 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2149 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298388 | 2149 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
5. 2500301201 | 2149 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts refresh 2026-05-25

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-24T22:11:12.471Z
- Store count: 254
- Source URLs fetched: 644
- Real weekly discount rows fetched and wired: 46365
- Current flyer rows for 25/05-2026-31/05-2026: 15843 rows across 242 stores
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Sample current-week rows:
1. 2500299274 | 2149 | Bregott | 37,80/st | 25/05-2026-31/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
2. 2500299322 | 2149 | Sportbröd | 19,90/st | 25/05-2026-31/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
3. 2500299444 | 2149 | Nötfärs | 89,90/st | 25/05-2026-31/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
4. 2500299156 | 2149 | Lightdryck | Välj & blanda! 3 för 49,00 +pant | 25/05-2026-31/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100
5. 2500308119 | 2149 | Svensk gurka | 9,90/st | 25/05-2026-31/05-2026 | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts 60-store expansion 2026-05-22

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store?online=true
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T13:58:41.521Z
- Added store IDs in this iteration: 2338, 2250, 2296, 2349, 2234, 2135, 2285, 2238, 2145, 2153, 2117, 2290
- Real weekly discount rows fetched and wired: 12124
- Source URLs fetched: 180
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

New-store row counts:
- 2117: 202 rows
- 2135: 202 rows
- 2145: 202 rows
- 2153: 202 rows
- 2234: 202 rows
- 2238: 202 rows
- 2250: 202 rows
- 2285: 202 rows
- 2290: 202 rows
- 2296: 202 rows
- 2338: 202 rows
- 2349: 202 rows

Sample rows:
1. 2500306014 | 2110 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2110 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2110 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298388 | 2110 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
5. 2500301201 | 2110 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts 72-store expansion 2026-05-22

- Source: www.willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store?online=true
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T14:46:16.311Z
- Store IDs: 2110, 2187, 2102, 2149, 2355, 2268, 2121, 2212, 2193, 2207, 2219, 2260, 2259, 2232, 2206, 2353, 2103, 2329, 2348, 2328, 2249, 2225, 2152, 2224, 2118, 2282, 2240, 2325, 2267, 2322, 2230, 2248, 2292, 2241, 2132, 2223, 2288, 2111, 2247, 2226, 2321, 2137, 2236, 2335, 2271, 2196, 2324, 2173, 2338, 2250, 2296, 2349, 2234, 2135, 2285, 2238, 2145, 2153, 2117, 2290, 2358, 2210, 2334, 2266, 2108, 2337, 2275, 2104, 2201, 2198, 2269, 2105
- Real weekly discount rows fetched and wired: 14548
- Source URLs fetched: 216
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Per-store row counts:
- 2102: 202 rows
- 2103: 202 rows
- 2104: 202 rows
- 2105: 202 rows
- 2108: 202 rows
- 2110: 202 rows
- 2111: 202 rows
- 2117: 202 rows
- 2118: 202 rows
- 2121: 202 rows
- 2132: 202 rows
- 2135: 202 rows
- 2137: 202 rows
- 2145: 202 rows
- 2149: 202 rows
- 2152: 202 rows
- 2153: 202 rows
- 2173: 202 rows
- 2187: 202 rows
- 2193: 202 rows
- 2196: 202 rows
- 2198: 202 rows
- 2201: 202 rows
- 2206: 202 rows
- 2207: 202 rows
- 2210: 202 rows
- 2212: 202 rows
- 2219: 202 rows
- 2223: 202 rows
- 2224: 202 rows
- 2225: 202 rows
- 2226: 202 rows
- 2230: 202 rows
- 2232: 202 rows
- 2234: 202 rows
- 2236: 202 rows
- 2238: 202 rows
- 2240: 202 rows
- 2241: 202 rows
- 2247: 202 rows
- 2248: 202 rows
- 2249: 202 rows
- 2250: 202 rows
- 2259: 202 rows
- 2260: 202 rows
- 2266: 202 rows
- 2267: 202 rows
- 2268: 202 rows
- 2269: 202 rows
- 2271: 202 rows
- 2275: 202 rows
- 2282: 202 rows
- 2285: 202 rows
- 2288: 202 rows
- 2290: 202 rows
- 2292: 202 rows
- 2296: 202 rows
- 2321: 202 rows
- 2322: 202 rows
- 2324: 202 rows
- 2325: 202 rows
- 2328: 202 rows
- 2329: 202 rows
- 2334: 202 rows
- 2335: 202 rows
- 2337: 202 rows
- 2338: 202 rows
- 2348: 202 rows
- 2349: 202 rows
- 2353: 202 rows
- 2355: 206 rows
- 2358: 202 rows

Sample rows:
1. 2500306014 | 2110 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2110 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2110 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298388 | 2110 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
5. 2500301201 | 2110 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts 181-store expansion 2026-05-22

- Source: willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store?online=true
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T16:39:50.737Z
- Store IDs: 2110, 2187, 2102, 2149, 2355, 2268, 2121, 2212, 2193, 2207, 2219, 2260, 2259, 2232, 2206, 2353, 2103, 2329, 2348, 2328, 2249, 2225, 2152, 2224, 2118, 2282, 2240, 2325, 2267, 2322, 2230, 2248, 2292, 2241, 2132, 2223, 2288, 2111, 2247, 2226, 2321, 2137, 2236, 2335, 2271, 2196, 2324, 2173, 2338, 2250, 2296, 2349, 2234, 2135, 2285, 2238, 2145, 2153, 2117, 2290, 2358, 2210, 2334, 2266, 2108, 2337, 2275, 2104, 2201, 2198, 2269, 2105, 2160, 2298, 2256, 2347, 2127, 2179, 2176, 2354, 2360, 2125, 2244, 2114, 2144, 2253, 2150, 2279, 2189, 2202, 2141, 2215, 2170, 2192, 2159, 2336, 2246, 2281, 2278, 2188, 2227, 2323, 2257, 2211, 2291, 2327, 2208, 2199, 2299, 2277, 2270, 2294, 2228, 2220, 2200, 2351, 2205, 2252, 2350, 2295, 2129, 2345, 2163, 2134, 2660, 2242, 2214, 2167, 2344, 2340, 2239, 2138, 2284, 2229, 2330, 2361, 2274, 2143, 2151, 2213, 2106, 2262, 2184, 2203, 2333, 2276, 2194, 2218, 2272, 2341, 2235, 2161, 2182, 2342, 2346, 2162, 2320, 2263, 2204, 2297, 2171, 2339, 2261, 2343, 2265, 2131, 2231, 2286, 2280, 2662, 2174, 2254, 2326, 2233, 2222, 2289, 2123, 2139, 2197, 2120, 2357
- Added store IDs in this iteration: 2189, 2202, 2141, 2215, 2170, 2192, 2159, 2336, 2246, 2281, 2278, 2188, 2227, 2323, 2257, 2211, 2291, 2327, 2208, 2199, 2299, 2277, 2270, 2294, 2228, 2220, 2200, 2351, 2205, 2252, 2350, 2295, 2129, 2345, 2163, 2134, 2660, 2242, 2214, 2167, 2344, 2340, 2239, 2138, 2284, 2229, 2330, 2361, 2274, 2143, 2151, 2213, 2106, 2262, 2184, 2203, 2333, 2276, 2194, 2218, 2272, 2341, 2235, 2161, 2182, 2342, 2346, 2162, 2320, 2263, 2204, 2297, 2171, 2339, 2261, 2343, 2265, 2131, 2231, 2286, 2280, 2662, 2174, 2254, 2326, 2233, 2222, 2289, 2123, 2139, 2197, 2120, 2357
- Retained existing public store IDs not currently returned as online: 2355
- Real weekly discount rows fetched and wired: 36570
- Source URLs fetched: 543
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Added-store row counts:
- 2189: 202 rows
- 2202: 202 rows
- 2141: 202 rows
- 2215: 202 rows
- 2170: 202 rows
- 2192: 202 rows
- 2159: 202 rows
- 2336: 202 rows
- 2246: 202 rows
- 2281: 202 rows
- 2278: 202 rows
- 2188: 202 rows
- 2227: 202 rows
- 2323: 202 rows
- 2257: 202 rows
- 2211: 202 rows
- 2291: 202 rows
- 2327: 202 rows
- 2208: 202 rows
- 2199: 202 rows
- 2299: 202 rows
- 2277: 202 rows
- 2270: 202 rows
- 2294: 202 rows
- 2228: 202 rows
- 2220: 202 rows
- 2200: 202 rows
- 2351: 202 rows
- 2205: 202 rows
- 2252: 202 rows
- 2350: 202 rows
- 2295: 202 rows
- 2129: 202 rows
- 2345: 202 rows
- 2163: 202 rows
- 2134: 202 rows
- 2660: 202 rows
- 2242: 202 rows
- 2214: 202 rows
- 2167: 202 rows
- 2344: 202 rows
- 2340: 202 rows
- 2239: 202 rows
- 2138: 202 rows
- 2284: 202 rows
- 2229: 202 rows
- 2330: 202 rows
- 2361: 206 rows
- 2274: 202 rows
- 2143: 202 rows
- 2151: 202 rows
- 2213: 202 rows
- 2106: 202 rows
- 2262: 202 rows
- 2184: 202 rows
- 2203: 202 rows
- 2333: 202 rows
- 2276: 202 rows
- 2194: 202 rows
- 2218: 202 rows
- 2272: 202 rows
- 2341: 202 rows
- 2235: 202 rows
- 2161: 202 rows
- 2182: 202 rows
- 2342: 202 rows
- 2346: 202 rows
- 2162: 202 rows
- 2320: 202 rows
- 2263: 202 rows
- 2204: 202 rows
- 2297: 202 rows
- 2171: 202 rows
- 2339: 202 rows
- 2261: 202 rows
- 2343: 202 rows
- 2265: 202 rows
- 2131: 202 rows
- 2231: 202 rows
- 2286: 202 rows
- 2280: 202 rows
- 2662: 202 rows
- 2174: 202 rows
- 2254: 202 rows
- 2326: 202 rows
- 2233: 202 rows
- 2222: 202 rows
- 2289: 202 rows
- 2123: 202 rows
- 2139: 202 rows
- 2197: 202 rows
- 2120: 202 rows
- 2357: 202 rows

Sample rows:
1. 2500306014 | 2110 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
2. 2500306996 | 2110 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303258 | 2110 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298388 | 2110 | Hushållspapper 12-pack, toalettpapper 18-pack | 59,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100
5. 2500301201 | 2110 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts public-store batch expansion 2026-05-23

- Source: www.willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-23T11:16:28.616Z
- Public store IDs attempted in current fetch: 12
- Current fetch rows inspected before de-duping existing rows: 984
- New weekly discount rows added and wired: 984
- Final real weekly discount rows in file: 37554
- Added store IDs in this iteration: 2860, 2823, 2878, 2810, 2874, 2858, 2857, 2871, 2875, 2850, 2859, 2820
- Zero-row public store IDs in current fetch: none
- Source URLs fetched: 555
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts

Added-store row counts:
- 2860: 82 rows
- 2823: 82 rows
- 2878: 82 rows
- 2810: 82 rows
- 2874: 82 rows
- 2858: 82 rows
- 2857: 82 rows
- 2871: 82 rows
- 2875: 82 rows
- 2850: 82 rows
- 2859: 82 rows
- 2820: 82 rows

Sample newly added rows:
1. 2500306028 | 2860 | Grön sparris 250g | 29,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2860&type=PERSONAL_GENERAL&page=0&size=100
2. 2500307003 | 2860 | Lyxrosor 12-pack | 99,00/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2860&type=PERSONAL_GENERAL&page=0&size=100
3. 2500303259 | 2860 | Mozzarella | 2 för 20,00 | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2860&type=PERSONAL_GENERAL&page=0&size=100
4. 2500297756 | 2860 | Crunchy fries | 19,90/st | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2860&type=PERSONAL_GENERAL&page=0&size=100
5. 2500304262 | 2860 | Läsk 6-pack | Välj & blanda! 3 för 89,00 +pant | 20/05-2026-24/05-2026 | https://www.willys.se/search/campaigns/offline?q=2860&type=PERSONAL_GENERAL&page=0&size=100

## Willys weekly discounts full public-store refresh 2026-05-24

- Source: www.willys.se public Axfood campaign JSON
- Store catalog source: https://www.willys.se/axfood/rest/store
- Source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-24T17:05:34.313Z
- Public store IDs with wired rows: 254
- Source URLs fetched and cited in metadata: 644 campaign pages, plus the store catalog URL and source URL pattern in metadata
- Real weekly discount rows fetched and wired: 44241
- Web wire: apps/web/src/lib/ingested/willys.ts
- Connector: packages/ingestion/src/connectors/willys.ts
- Verification: `node scripts/ingestion/verify-ingested-provenance.mjs` reported rowCount 44241, 0 missing sourceUrl, 0 missing retrievedAt, and 0 duplicate provenance/content keys for `willysWeeklyDiscounts`.

Sample source inspection on 2026-05-24:
- `curl -A "GroceryView/0.1" https://www.willys.se/axfood/rest/store` returned public JSON with 255 store rows.
- `curl -A "GroceryView/0.1" "https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=3"` returned HTTP 200 public JSON with 3 result rows and 71 pages.

Sample campaign row from the inspected endpoint:
1. 2500306014 | 2149 | Grön sparris 250g | 29,90/st | https://www.willys.se/search/campaigns/offline?q=2149&type=PERSONAL_GENERAL&page=0&size=3
