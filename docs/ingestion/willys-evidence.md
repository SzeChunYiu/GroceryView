# Willys ingestion evidence

- Source: handla.willys.se / willys.se public search JSON
- Source URL pattern: https://www.willys.se/search?q={query}
- Retrieved: 2026-05-20T23:54:12.788Z
- Search queries: makaroner, mjolk, kaffe, ris, pasta, yoghurt, brod, ost, agg, smor, potatis, banan, kyckling, ketchup, havregryn
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/willys.ts
- Web wire: apps/web/src/lib/ingested/willys.ts

Every emitted row includes a Willys product code, name, SEK price fields, source search URL, and retrieval timestamp.

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
