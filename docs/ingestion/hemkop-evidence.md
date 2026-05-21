# Hemkop ingestion evidence

- Source: hemkop.se public search JSON
- Source URL pattern: https://www.hemkop.se/search?q={query}
- Retrieved: 2026-05-21T00:41:39.516Z
- Search queries: makaroner, mjolk, kaffe, ris, pasta, yoghurt, brod, ost, agg, smor, potatis, banan, kyckling, ketchup, havregryn
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/hemkop.ts
- Web wire: apps/web/src/lib/ingested/hemkop.ts

Every emitted row includes a Hemkop product code, name, SEK price fields, source search URL, and retrieval timestamp.

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
