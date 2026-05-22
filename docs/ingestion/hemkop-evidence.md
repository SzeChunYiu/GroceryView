# Hemkop ingestion evidence

- Source: hemkop.se public search JSON
- Source URL pattern: https://www.hemkop.se/search?q={query}
- Retrieved: 2026-05-21T00:41:39.516Z
- Search queries: makaroner, mjolk, kaffe, ris, pasta, yoghurt, brod, ost, agg, smor, potatis, banan, kyckling, ketchup, havregryn
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/hemkop.ts
- Web wire: apps/web/src/lib/ingested/hemkop.ts

Every emitted row includes a Hemkop product code, name, SEK price fields, source search URL, and retrieval timestamp.

## Weekly Discount Rows

- Source: hemkop.se public Axfood offline campaign JSON
- Source URL: https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
- Retrieved: 2026-05-22T08:28:40.482Z
- Store id: 4003
- Validity window in retrieved rows: 18/05-2026 through 24/05-2026, with weekend rows starting 20/05-2026
- Real weekly discount rows fetched and wired: 45

Every weekly discount row includes an Axfood promotion code, product code, product name, campaign type, promotion price text, compare price text when present, regular price text when present, save-price text when present, validity dates, source URL, and retrieval timestamp.

### Sample Weekly Discount Rows

1. 2500309493 | 101291077_ST | Läsk | 6 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
2. 2500303429 | 100168667_ST | Lingongrova, Guldkorn | 19 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
3. 2500298172 | 101017249_ST | Svenskt smör | 39,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
4. 2500298127 | 101183319_ST | Smörgåspålägg | 2 för 28 kr | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
5. 2500299506 | 101241262_ST | Kaffe | 59,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50

## Sample Retrieved Rows

1. 101205621_ST | Idealmakaroner Gammaldags | Kungsörnen | 14,14 kr | https://www.hemkop.se/search?q=makaroner
2. 101205570_ST | Idealmakaroner Gammaldags | Kungsörnen | 24,55 kr | https://www.hemkop.se/search?q=makaroner
3. 100044328_ST | Makaroner Fullkornspasta | Kungsörnen | 26,45 kr | https://www.hemkop.se/search?q=makaroner
4. 101205623_ST | Snabbmakaroner | Kungsörnen | 18,45 kr | https://www.hemkop.se/search?q=makaroner
5. 101302991_ST | Makaroner Pasta | Garant Eko | 17,93 kr | https://www.hemkop.se/search?q=makaroner
6. 101301620_ST | Makaroner Klassiska | Garant | 20,77 kr | https://www.hemkop.se/search?q=makaroner
7. 101300386_ST | Idealmakaroner | Kungsörnen | 26,45 kr | https://www.hemkop.se/search?q=makaroner
8. 101152565_ST | Eko Makaroner | Kungsörnen | 28,34 kr | https://www.hemkop.se/search?q=makaroner
9. 101205598_ST | Snabbmakaroner | Kungsörnen | 27,39 kr | https://www.hemkop.se/search?q=makaroner
10. 101240220_ST | Snabbmakaroner | Monte Castello | 16,04 kr | https://www.hemkop.se/search?q=makaroner
11. 101205823_ST | Mellanmjölk 1,5% | Garant | 13,20 kr | https://www.hemkop.se/search?q=mjolk
12. 101233931_ST | Mjölk Längre Hållbarhet 3% | Garant | 18,45 kr | https://www.hemkop.se/search?q=mjolk
13. 101233933_ST | Mellanmjölk Längre Hållbarhet 1,5% | Garant | 18,45 kr | https://www.hemkop.se/search?q=mjolk
14. 101266069_ST | Mellanmjölk Längre Hållbarhet Ekologisk 1,5% | Garant Eko | 22,24 kr | https://www.hemkop.se/search?q=mjolk
15. 101205891_ST | Mjölk 3% | Garant | 13,72 kr | https://www.hemkop.se/search?q=mjolk

## Hemköp weekly discounts 2026-05-22

- Source: Hemköp public Axfood campaign JSON
- Source URL: https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
- Retrieved: 2026-05-22T08:28:40.482Z
- Store ID: 4003
- Real discount rows fetched: 45
- Web wire: apps/web/src/lib/ingested/hemkop.ts

Sample rows:
1. 2500309493 | Läsk | 6 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
2. 2500303429 | Lingongrova, Guldkorn | 19 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
3. 2500298172 | Svenskt smör | 39,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
4. 2500298127 | Smörgåspålägg | 2 för 28 kr | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
5. 2500299506 | Kaffe | 59,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
6. 2500298024 | Kycklinginnerfilé | 46,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
7. 2500298454 | Styckglass | 10 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
8. 2500298365 | Olivolja Classico | 66 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
9. 2500298362 | Prosciutto Crudo | 18 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50
10. 2500298307 | Riven ost | 18 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50

## Hemköp weekly discounts expansion 2026-05-22

- Source: hemkop.se public Axfood campaign JSON
- Source URL pattern: https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T10:55:44.095Z
- Store IDs: 4003, 4127, 4190, 4798, 4660, 4775, 4196, 4111, 4162, 4273, 4349, 4359
- Real weekly discount rows fetched and wired: 2987
- Web wire: apps/web/src/lib/ingested/hemkop.ts

Sample rows:
1. 2500309493 | 4003 | Läsk | 6 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
2. 2500303429 | 4003 | Lingongrova, Guldkorn | 19 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
3. 2500298172 | 4003 | Svenskt smör | 39,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100

## Hemköp weekly discounts 24-store expansion 2026-05-22

- Source: hemkop.se public Axfood campaign JSON
- Store catalog source: https://www.hemkop.se/axfood/rest/store?online=true
- Source URL pattern: https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T11:57:50.378Z
- Store IDs: 4003, 4127, 4190, 4798, 4660, 4775, 4196, 4111, 4162, 4273, 4349, 4359, 4734, 4773, 4239, 4667, 4221, 4203, 4521, 4930, 4524, 4146, 4222, 4219
- Real weekly discount rows fetched and wired: 5966
- Web wire: apps/web/src/lib/ingested/hemkop.ts
- Connector: packages/ingestion/src/connectors/hemkop.ts

Sample rows:
1. 2500309493 | 4003 | Läsk | 6 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
2. 2500303429 | 4003 | Lingongrova, Guldkorn | 19 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
3. 2500298172 | 4003 | Svenskt smör | 39,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
4. 2500309493 | 4734 | Läsk | 6 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4734&type=PERSONAL_GENERAL&page=0&size=100
5. 2500303429 | 4734 | Lingongrova, Guldkorn | 19 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4734&type=PERSONAL_GENERAL&page=0&size=100
## Hemköp weekly discounts 36-store expansion 2026-05-22

- Source: hemkop.se public Axfood campaign JSON
- Store catalog source: https://www.hemkop.se/axfood/rest/store?online=true
- Source URL pattern: https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100
- Retrieved: 2026-05-22T12:26:44.878Z
- Store IDs: 4003, 4127, 4190, 4798, 4660, 4775, 4196, 4111, 4162, 4273, 4349, 4359, 4734, 4773, 4239, 4667, 4221, 4203, 4521, 4930, 4524, 4146, 4222, 4219, 4792, 4245, 4189, 4511, 4263, 4293, 4214, 4526, 4131, 4266, 4207, 4535
- Real weekly discount rows fetched and wired: 8946
- Source URLs fetched: 108
- Web wire: apps/web/src/lib/ingested/hemkop.ts
- Connector: packages/ingestion/src/connectors/hemkop.ts

Per-store row counts:
- 4003: 249 rows
- 4127: 246 rows
- 4190: 249 rows
- 4798: 248 rows
- 4660: 250 rows
- 4775: 250 rows
- 4196: 250 rows
- 4111: 247 rows
- 4162: 250 rows
- 4273: 249 rows
- 4349: 250 rows
- 4359: 249 rows
- 4734: 248 rows
- 4773: 249 rows
- 4239: 249 rows
- 4667: 249 rows
- 4221: 250 rows
- 4203: 246 rows
- 4521: 249 rows
- 4930: 248 rows
- 4524: 248 rows
- 4146: 249 rows
- 4222: 246 rows
- 4219: 248 rows
- 4792: 248 rows
- 4245: 248 rows
- 4189: 248 rows
- 4511: 250 rows
- 4263: 249 rows
- 4293: 248 rows
- 4214: 249 rows
- 4526: 249 rows
- 4131: 248 rows
- 4266: 249 rows
- 4207: 247 rows
- 4535: 247 rows

Sample rows:
1. 2500309493 | 4003 | Läsk | 6 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
2. 2500303429 | 4003 | Lingongrova, Guldkorn | 19 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
3. 2500298172 | 4003 | Svenskt smör | 39,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
4. 2500298127 | 4003 | Smörgåspålägg | 2 för 28 kr | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
5. 2500299506 | 4003 | Kaffe | 59,95 kr/st | 18/05-2026-24/05-2026 | https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=100
