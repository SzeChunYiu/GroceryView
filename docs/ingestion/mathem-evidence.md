# Mathem ingestion evidence

- Source: mathem.se public search page embedded __NEXT_DATA__
- Source URL pattern: https://www.mathem.se/se/search/products/?q={query}
- Retrieved: 2026-05-21T00:50:23.764Z
- Search queries: makaroner, mjolk, kaffe, ris, pasta, yoghurt, brod, ost, agg, smor, potatis, banan, kyckling, ketchup, havregryn
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/mathem.ts
- Web wire: apps/web/src/lib/ingested/mathem.ts

Every emitted row includes a Mathem product id, name, SEK price fields, source search URL, and retrieval timestamp.

## Sample Retrieved Rows

1. 6448 | Kungsörnen Gammaldags Idealmakaroner | Kungsörnen | 22.24 SEK | https://www.mathem.se/se/search/products/?q=makaroner
2. 4793 | Kungsörnen Gammaldags Idealmakaroner | Kungsörnen | 13.72 SEK | https://www.mathem.se/se/search/products/?q=makaroner
3. 6407 | Kungsörnen Fullkornspasta Makaroner | Kungsörnen | 26.45 SEK | https://www.mathem.se/se/search/products/?q=makaroner
4. 7223 | KUNGSÖRNEN Makaroner EKO | KUNGSÖRNEN | 27.40 SEK | https://www.mathem.se/se/search/products/?q=makaroner
5. 5801 | KUNGSÖRNEN Idealmakaroner | KUNGSÖRNEN | 23.60 SEK | https://www.mathem.se/se/search/products/?q=makaroner
6. 7237 | Kungsörnen Snabbmakaroner | Kungsörnen | 27.92 SEK | https://www.mathem.se/se/search/products/?q=makaroner
7. 7919 | Kungsörnen Idealmakaroner | Kungsörnen | 28.50 SEK | https://www.mathem.se/se/search/products/?q=makaroner
8. 5301 | Garant Makaroner Glutenfri | Garant | 19.40 SEK | https://www.mathem.se/se/search/products/?q=makaroner
9. 4065 | Kungsörnen Snabbmakaroner | Kungsörnen | 17.95 SEK | https://www.mathem.se/se/search/products/?q=makaroner
10. 65403 | Garant Eko Makaroner EKO | Garant Eko | 17.51 SEK | https://www.mathem.se/se/search/products/?q=makaroner
11. 52444 | Mississippi Belle Macaroni & Cheese | Mississippi Belle | 25.51 SEK | https://www.mathem.se/se/search/products/?q=makaroner
12. 65174 | Garant Pasta Girandole | Garant | 14.67 SEK | https://www.mathem.se/se/search/products/?q=makaroner
13. 52597 | Barilla Pasta Pipe Rigate | Barilla | 16.00 SEK | https://www.mathem.se/se/search/products/?q=makaroner
14. 65037 | MINO Pipette Glutenfri | MINO | 36.86 SEK | https://www.mathem.se/se/search/products/?q=makaroner
15. 5228 | Zeta Pasta Maccaronetti | Zeta | 21.29 SEK | https://www.mathem.se/se/search/products/?q=makaroner
