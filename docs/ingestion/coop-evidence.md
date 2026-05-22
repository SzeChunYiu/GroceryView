# Coop ingestion evidence

- Source: coop.se public personalization search API configured in the public handla page
- Source URL: https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
- Request body: query kaffe, resultsOptions take 1000, empty sort/facets, relatedResultsOptions take 16
- Required public header: Ocp-Apim-Subscription-Key value exposed in window.coopSettings.serviceAccess.personalizationApiSubscriptionKey
- Retrieved: 2026-05-22T12:58:35.902Z
- Store: 251300
- Device parameter: desktop
- Real rows fetched: 290
- Connector: packages/ingestion/src/connectors/coop.ts
- Web wire: apps/web/src/lib/ingested/coop.ts

Every emitted row includes Coop product id/EAN, product name, brand, package label, category, B2C SEK price, comparative unit price when present, promotion copy when present, source API URL, product URL, image URL, and retrieval timestamp.

## Weekly flyer discount evidence

- Source: Coop public store API current flyer metadata plus public personalization product search promotions
- Store API URLs: per-branch `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true`, listed in `apps/web/src/lib/ingested/coop.ts`
- Flyer PDF URLs: per-branch `https://dr.coop.se/Butik/<store-slug>`, listed in `apps/web/src/lib/ingested/coop.ts`
- Product search URLs: per-branch `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1`, listed in `apps/web/src/lib/ingested/coop.ts`
- Request body: weekly flyer item queries listed in `DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES`, resultsOptions take 8, empty sort/facets, relatedResultsOptions take 0
- Required public headers: `storeApiSubscriptionKey` for store metadata and `personalizationApiSubscriptionKey` for product search, both exposed in `window.coopSettings.serviceAccess` on https://www.coop.se/handla/
- Retrieved: 2026-05-22T14:18:16.300Z
- Added this iteration: 105610 Stora Coop Halmstad; 195020 Stora Coop Norra Backa; 163000 Stora Coop Välsviken; 196000 Stora Coop Ludvika; 026810 Stora Coop Kungsängen; 056010 Stora Coop Garnisonen Linköping; 195030 Stora Coop Falun; 015430 Stora Coop Tumba; 133800 Stora Coop Torp; 201510 Stora Coop Ljusdal; 165270 Stora Coop Kil; 165290 Stora Coop Torsby
- Stores:
  - 251300, Stora Coop Boländerna, Uppsala, 26 real discount rows
  - 252700, Stora Coop Bromma, Bromma, 24 real discount rows
  - 256600, Stora Coop Västberga, Hägersten, 24 real discount rows
  - 255700, Stora Coop Häggvik, Sollentuna, 22 real discount rows
  - 015700, Stora Coop Danderyd, Danderyd, 24 real discount rows
  - 015810, Stora Coop Sundby Park, Sundbyberg, 25 real discount rows
  - 015350, Stora Coop Huddinge, Huddinge, 23 real discount rows
  - 026000, Stora Coop Märsta, Märsta, 25 real discount rows
  - 015220, Stora Coop Stuvsta, Huddinge, 24 real discount rows
  - 016141, Stora Coop Orminge, Saltsjö-Boo, 23 real discount rows
  - 255400, Stora Coop Värmdö, Gustavsberg, 24 real discount rows
  - 250800, Stora Coop Södertälje, Södertälje, 24 real discount rows
  - 015400, Stora Coop Åkersberga, Åkersberga, 22 real discount rows
  - 015470, Stora Coop Arninge, Täby, 25 real discount rows
  - 250400, Stora Coop Haninge, Haninge, 25 real discount rows
  - 163400, Stora Coop Kristinehamn, Kristinehamn, 24 real discount rows
  - 231400, Stora Coop Ersboda, Umeå, 23 real discount rows
  - 231500, Stora Coop Härnösand, Härnösand, 24 real discount rows
  - 231800, Stora Coop Örnsköldsvik, Örnsköldsvik, 26 real discount rows
  - 093200, Stora Coop Karlshamn, Karlshamn, 23 real discount rows
  - 133100, Stora Coop Överby, Trollhättan, 22 real discount rows
  - 231900, Stora Coop Östersund, Östersund, 24 real discount rows
  - 030500, Stora Coop Vinsta, Vällingby, 21 real discount rows
  - 075800, Stora Coop Norremark, Växjö, 24 real discount rows
  - 022500, Stora Coop Visby, Visby, 25 real discount rows
  - 201700, Stora Coop Valbo, Valbo, 20 real discount rows
  - 242200, Stora Coop Storheden, Luleå, 24 real discount rows
  - 255500, Stora Coop Sisjön, Askim, 24 real discount rows
  - 253200, Stora Coop Skara, Skara, 26 real discount rows
  - 252600, Stora Coop Backaplan, Göteborg, 24 real discount rows
  - 252500, Stora Coop Bäckebol, Hisings Backa, 22 real discount rows
  - 231300, Stora Coop Sörböle, Skellefteå, 17 real discount rows
  - 241200, Stora Coop Kiruna, Kiruna, 24 real discount rows
  - 176110, Coop City Hallsberg, Hallsberg, 21 real discount rows
  - 112000, Stora Coop Varberg, Varberg, 26 real discount rows
  - 254800, Stora Coop Nolhaga Skövde, Skövde, 23 real discount rows
  - 255900, Stora Coop Kungsbacka, Kungsbacka, 25 real discount rows
  - 162000, Stora Coop Bergvik, Karlstad, 22 real discount rows
  - 241800, Stora Coop Kalix, Kalix, 25 real discount rows
  - 205180, Stora Coop Hudiksvall, Hudiksvall, 21 real discount rows
  - 072000, Stora Coop Jönköping, Jönköping, 23 real discount rows
  - 241100, Stora Coop Gällivare, Gällivare, 22 real discount rows
  - 056230, Coop Fiskaregatan Vimmerby, Vimmerby, 13 real discount rows
  - 026500, Coop Bredden, Upplands Väsby, 16 real discount rows
  - 175010, Coop Forum Marieberg, Örebro, 22 real discount rows
  - 254700, Stora Coop Nyköping, Nyköping, 24 real discount rows
  - 036968, Stora Coop Norrteljeporten, Norrtälje, 24 real discount rows
  - 257400, Stora Coop Strängnäs, Strängnäs, 25 real discount rows
  - 253000, Stora Coop Eskilstuna, Eskilstuna, 20 real discount rows
  - 252200, Stora Coop Borås, Borås, 25 real discount rows
  - 205140, Stora Coop Bollnäs, Bollnäs, 25 real discount rows
  - 163300, Stora Coop Palmviken Arvika, Arvika, 24 real discount rows
  - 165400, Stora Coop Styckåsen, Arvika, 25 real discount rows
  - 163800, Stora Coop Hammarö, Hammarö, 22 real discount rows
  - 185510, Stora Coop Stenby Västerås, Västerås, 26 real discount rows
  - 232000, Stora Coop Sundsvall, Sundsvall, 24 real discount rows
  - 254900, Stora Coop Enköping, Enköping, 20 real discount rows
  - 054000, Stora Coop Finspång, Finspång, 25 real discount rows
  - 105610, Stora Coop Halmstad, Halmstad, 26 real discount rows
  - 195020, Stora Coop Norra Backa, Borlänge, 26 real discount rows
  - 163000, Stora Coop Välsviken, Karlstad, 21 real discount rows
  - 196000, Stora Coop Ludvika, Ludvika, 21 real discount rows
  - 026810, Stora Coop Kungsängen, Kungsängen, 26 real discount rows
  - 056010, Stora Coop Garnisonen Linköping, Linköping, 21 real discount rows
  - 195030, Stora Coop Falun, Falun, 23 real discount rows
  - 015430, Stora Coop Tumba, Tumba, 24 real discount rows
  - 133800, Stora Coop Torp, Uddevalla, 24 real discount rows
  - 201510, Stora Coop Ljusdal, Ljusdal, 23 real discount rows
  - 165270, Stora Coop Kil, Kil, 26 real discount rows
  - 165290, Stora Coop Torsby, Torsby, 20 real discount rows
- Flyer validity: 2026-05-18T00:00:00 through 2026-05-24T23:59:59
- Real current flyer discount rows fetched: 1626

Every weekly discount row includes Coop product id/EAN, product name, brand, package label, ordinary B2C SEK price, offer SEK price, comparative offer price when present, promotion id/copy, MedMera requirement, store/region, validity, flyer URL, store API source URL, product search URL, and retrieval timestamp.

## Sample Weekly Discount Rows

1. 2383471000006 | Laxfilé | Harbour | Stora Coop Boländerna | ordinary 259.32 SEK | offer 149.00 SEK | 149.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
2. 2317342100007 | Vattenmelon Mini |  | Stora Coop Boländerna | ordinary 26.45 SEK | offer 20.00 SEK | 20.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
3. 7310865005168 | Smör Normalsaltat | Svenskt Smör från Arla | Stora Coop Boländerna | ordinary 61.45 SEK | offer 45.00 SEK | 90.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
4. 2340375400004 | Hushållsost | Arla® | Stora Coop Boländerna | ordinary 114.50 SEK | offer 74.90 SEK | 74.90 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
5. 7340191179691 | Toalettpapper Nice & Soft 24-pack | Coop | Stora Coop Boländerna | ordinary 124.00 SEK | offer 99.00 SEK | 42.45 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
6. 7300206718000 | Bacon 3-pack | Scan | Stora Coop Boländerna | ordinary 40.65 SEK | offer 37.90 SEK | 90.24 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
7. 7310865095466 | Grekisk yoghurt 10% | Arla Köket® | Stora Coop Boländerna | ordinary 37.81 SEK | offer 29.90 SEK | 29.90 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
8. 80508816 | Olivolja Classico | Monini | Stora Coop Boländerna | ordinary 99.37 SEK | offer 89.00 SEK | 118.66 kr/lit | 2026-05-18T00:00:00 to 2026-05-24T23:59:59

## Sample Retrieved Rows

1. 7310760012896 | Bryggkaffe Mellanrost | Arvid Nordquist | 500 g | 75.17 SEK | 150.34 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
2. 8711000530085 | Bryggkaffe Mellanrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
3. 8711000591840 | Bryggkaffe Ebony Mörkrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
4. 8711000530252 | Kaffe Presso Mellanrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
5. 7310760012919 | Bryggkaffe Mellanmörk Svea | Arvid Nordquist | 500 g | 75.17 SEK | 150.34 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
6. 8711000530207 | Bryggkaffe El-brygg Mellanrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
7. 8711000537411 | Bryggkaffe Mellanrost Eko | Gevalia | 425 g | 83.99 SEK | 197.62 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
8. 8711000602102 | Bryggkaffe Karaktär Mörkrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
9. 8711000530283 | Bryggkaffe Lätt Mörkrost | Gevalia | 450 G | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
10. 8711000602164 | Bryggkaffe Milea Ljusrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
11. 7310760012988 | Presskaffe Mörkrost Pressiado | Arvid Nordquist | 500 g | 75.17 SEK | 150.34 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
12. 8711000537497 | Bryggkaffe Koffeinfritt Mellanrost | Gevalia | 425g | 82.20 SEK | 193.41 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
13. 7310050001043 | Bryggkaffe Mellanrost | Löfbergs | 450 g | 63.26 SEK | 140.58 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
14. 8000070024083 | Bryggkaffe Qualita Rossa | Lavazza | 340 g | 77.56 SEK | 228.12 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
15. 7310831020058 | Bryggkaffe Mörkrost | Lindvalls Kaffe | 450 gr | 84.18 SEK | 187.07 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
