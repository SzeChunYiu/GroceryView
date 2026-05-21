# ICA handla ingestion evidence

- Source: handla.ica.se public product-card HTML
- Source URL pattern: https://handla.ica.se/{path}
- Retrieved: 2026-05-21T00:58:33.537Z
- Source paths used: /, /kategori/627, /kategori/1, /kategori/4942, /kategori/256
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/ica.ts
- Web wire: apps/web/src/lib/ingested/ica.ts

Every emitted row includes an ICA product id, product name, brand when present, category labels when present, product URL, image URL, source page URL, and retrieval timestamp. The public cards omit price or expose data-price as 0 until a store is selected, so this ingest is product-card/catalog evidence rather than live priced SEK evidence.

## Sample Retrieved Rows

1. 1203222 | Ägg Frigående M 15-p ICA | unknown | Mejeri & Ost | https://handla.ica.se/
2. 1214490 | Blåbär 125g Klass 1 ICA | unknown | Frukt & Grönt | https://handla.ica.se/
3. 1302239 | Pesto Tomat 185g ICA | unknown | Skafferi | https://handla.ica.se/
4. 1328390 | Vatten Kolsyrad Citron 33cl 12-p Loka | unknown | Dryck | https://handla.ica.se/
5. 1343305 | Pannkakor fryst 800g Kungsörnen | unknown | Fryst | https://handla.ica.se/
6. 1371787 | Toalettpapper 6-p Miljömärkt ICA | unknown | Städ, Tvätt & Papper | https://handla.ica.se/
7. 1382097 | Päron i korg 1kg Klass 2 ICA | unknown | Frukt & Grönt | https://handla.ica.se/
8. 1382628 | Basilika Ekologisk 1-p KRAV Klass 1 ICA I | unknown | Frukt & Grönt | https://handla.ica.se/
9. 1396763 | Sallatsmix Finbladig Spröd Sköljd 65g ICA | unknown | Grill | https://handla.ica.se/
10. 1422163 | Lantskinka Rökt 120g ICA | unknown | Kött, Chark & Fågel | https://handla.ica.se/
11. 1441052 | Granola Kakao & hallon 450g Pauluns | unknown | Skafferi | https://handla.ica.se/
12. 1478802 | Majskakor Chiafrö & havssalt Glutenfri 130g Friggs | unknown | Bröd & Kakor | https://handla.ica.se/
13. 1487595 | Krögarpytt klassisk Fryst 1,5kg Felix | unknown | Fryst | https://handla.ica.se/
14. 1489303 | Skivade Rödbetor 710g Felix | unknown | Skafferi | https://handla.ica.se/
15. 1508096 | Bryggkaffe Mon Amie 450g Zoegas | unknown | Dryck | https://handla.ica.se/
