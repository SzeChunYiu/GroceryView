# Matspar ingestion evidence

- Source: matspar.se public search page embedded __PAGEDATA__
- Source URL pattern: https://www.matspar.se/kategori/?q={query}
- Retrieved: 2026-05-21T01:07:13.735Z
- Search queries: makaroner, mjolk, kaffe, ris, pasta, yoghurt, brod, ost, agg, smor, potatis, banan, kyckling, ketchup, havregryn
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/matspar.ts
- Web wire: apps/web/src/lib/ingested/matspar.ts

Every emitted row includes a Matspar product id, name, brand, package text, SEK price fields, warehouse price coverage count, source search URL, and retrieval timestamp.

## Sample Retrieved Rows

1. 3270 | Snabbmakaroner | Kungsörnen | 15.00 SEK | warehouses 67 | https://www.matspar.se/kategori/?q=makaroner
2. 3351 | Makaroner fullkornspasta | Kungsörnen | 22.60 SEK | warehouses 67 | https://www.matspar.se/kategori/?q=makaroner
3. 3271 | Idealmakaroner Gammaldags | Kungsörnen | 8.47 SEK | warehouses 67 | https://www.matspar.se/kategori/?q=makaroner
4. 251722 | Makaroner | Garant | 18.83 SEK | warehouses 2 | https://www.matspar.se/kategori/?q=makaroner
5. 409400 | Makaroner | ICA | 18.80 SEK | warehouses 63 | https://www.matspar.se/kategori/?q=makaroner
6. 245035 | Makaroner Eko | Garant | 12.20 SEK | warehouses 3 | https://www.matspar.se/kategori/?q=makaroner
7. 168341 | Makaroner Glutenfri | Garant | 15.04 SEK | warehouses 3 | https://www.matspar.se/kategori/?q=makaroner
8. 224078 | Makaroner glutenfria | ICA | 13.20 SEK | warehouses 63 | https://www.matspar.se/kategori/?q=makaroner
9. 3273 | Idealmakaroner Gammaldags | Kungsörnen | 20.40 SEK | warehouses 67 | https://www.matspar.se/kategori/?q=makaroner
10. 156174 | Makaroner Med Ostsåspulver | Mississippi Belle | 23.56 SEK | warehouses 3 | https://www.matspar.se/kategori/?q=makaroner
11. 409432 | Snabbmakaroner | ICA | 16.50 SEK | warehouses 63 | https://www.matspar.se/kategori/?q=makaroner
12. 3259 | Makaroner EKO | Kungsörnen | 26.40 SEK | warehouses 67 | https://www.matspar.se/kategori/?q=makaroner
13. 246568 | Snabbmakaroner | Garant | 16.94 SEK | warehouses 2 | https://www.matspar.se/kategori/?q=makaroner
14. 3346 | Idealmakaroner | Kungsörnen | 23.60 SEK | warehouses 66 | https://www.matspar.se/kategori/?q=makaroner
15. 3285 | Idealmakaroner | Kungsörnen | 27.35 SEK | warehouses 3 | https://www.matspar.se/kategori/?q=makaroner
