# Matpriskollen ingestion evidence

- Source: matpriskollen.se public JSON API used by the public offers page
- Stores source URL: https://matpriskollen.se/api/v1/stores?lat=56.93287&lon=12.54594&limit=20
- Offer source URL pattern: https://matpriskollen.se/api/v1/stores/{storeKey}/offers?lat=56.93287&lon=12.54594&limit=200
- Retrieved: 2026-05-21T01:17:16.641Z
- Location parameters: lat 56.93287, lon 12.54594
- Store limit: 20
- Grocery store filter: /(willys|lidl|coop|ica|hemk[oö]p|city gross)/i
- Stores used: Willys Falkenberg (75)
- Offer limit per store: 200
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/matpriskollen.ts
- Web wire: apps/web/src/lib/ingested/matpriskollen.ts

Every emitted row includes a Matpriskollen offer key, product name, public store key/name, price label, optional compare/regular price labels, category, validity timestamps, source API URL, product URL, and retrieval timestamp.

## Sample Retrieved Rows

1. 0156ff11-3c20-43cf-a217-5a95ccb68b16 | Våtservetter Baby- | Willys Falkenberg | 19,90/frp | Kroppsvård | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
2. 036e04e6-99fa-4621-8321-dea0b65279f1 | Nektarin i ask | Willys Falkenberg | 29,90/frp | Frukt & bär | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
3. 074bffa7-ba96-4ab3-94f2-7463bbd351d6 | Grillkorv, laktosfri | Willys Falkenberg | 24,90/frp | Korv & Pålägg | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
4. 0d838e11-e6b6-47c6-9ef3-1813ba4567b4 | Kycklingnuggets | Willys Falkenberg | 34,90/frp | Färdigmat | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
5. 2066b948-9766-4abf-8a2f-1ad8eada5deb | Grillkorv | Willys Falkenberg | 27,90/frp | Korv & Pålägg | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
6. 2220ed66-6ccf-42ab-974f-631b71f3d63e | Kycklingfilé Minut- | Willys Falkenberg | 73,90/frp | Kött | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
7. 2b88d019-11c4-4371-8469-ef0d30db5e75 | Glass Klassikerlåda | Willys Falkenberg | 79,90/frp | Glass | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
8. 2f69d8b7-1c64-48bd-9fd4-3aaefa2a7c6b | Färskost | Willys Falkenberg | 19,90/frp | Ost | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
9. 318b3f13-c637-4577-8743-ef7e9b9156ab | Grädde Mat-, lång hållbarhet | Willys Falkenberg | 18,90/frp | Mejeri | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
10. 3228c4a4-12e0-40c5-9b97-895249fe16c8 | Leverpastej, bredbar i ask, original/gurka | Willys Falkenberg | 9,90/frp | Korv & Pålägg | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
11. 347a367e-fafc-4884-ab7c-8088b6869c92 | Pastasås | Willys Falkenberg | 16,90/frp | Färdigmat | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
12. 34d24f21-2874-4d71-9e19-56d2003d355c | Pålägg, skivat, plånboksp. | Willys Falkenberg | 2 för 30,00 | Korv & Pålägg | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
13. 3651cf7a-c9f6-43d3-a8f7-b196694cced5 | Barngröt, klämpåse, eko | Willys Falkenberg | 6 för 60,00 | Barnprodukter | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
14. 394e9d7a-35f2-4a39-928f-87adfb552faf | Bacon, skivat | Willys Falkenberg | 79,90/kg | Chark/Delikatess | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
15. 3b64bb04-2017-4885-b3ee-360d535d239d | Chips | Willys Falkenberg | 3 för 30,00 | Snacks & Godis | https://matpriskollen.se/api/v1/stores/d20e31b2-2c0e-4e87-8f8e-280d41b1bb16/offers?lat=56.93287&lon=12.54594&limit=200
