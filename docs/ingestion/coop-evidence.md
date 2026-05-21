# Coop ingestion evidence

- Source: coop.se public personalization search API configured in the public handla page
- Source URL: https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
- Request body: query kaffe, resultsOptions take 75, empty sort/facets, relatedResultsOptions take 16
- Required public header: Ocp-Apim-Subscription-Key value exposed in window.coopSettings.serviceAccess.personalizationApiSubscriptionKey
- Retrieved: 2026-05-21T01:29:42.710Z
- Store: 251300
- Device parameter: desktop
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/coop.ts
- Web wire: apps/web/src/lib/ingested/coop.ts

Every emitted row includes Coop product id/EAN, product name, brand, package label, category, B2C SEK price, comparative unit price when present, promotion copy when present, source API URL, product URL, image URL, and retrieval timestamp.

## Sample Retrieved Rows

1. 7310760012896 | Bryggkaffe Mellanrost | Arvid Nordquist | 500 g | 75.17 SEK | 150.34 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
2. 8711000530085 | Bryggkaffe Mellanrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
3. 8711000591840 | Bryggkaffe Ebony Mörkrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
4. 8711000530252 | Kaffe Presso Mellanrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
5. 8711000530207 | Bryggkaffe El-brygg Mellanrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
6. 7310760012919 | Bryggkaffe Mellanmörk Svea | Arvid Nordquist | 500 g | 75.17 SEK | 150.34 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
7. 8711000537411 | Bryggkaffe Mellanrost Eko | Gevalia | 425 g | 83.99 SEK | 197.62 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
8. 8711000530283 | Bryggkaffe Lätt Mörkrost | Gevalia | 450 G | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
9. 8711000602102 | Bryggkaffe Karaktär Mörkrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
10. 8711000602164 | Bryggkaffe Milea Ljusrost | Gevalia | 450 g | 74.67 SEK | 165.93 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
11. 7310760012988 | Presskaffe Mörkrost Pressiado | Arvid Nordquist | 500 g | 75.17 SEK | 150.34 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
12. 8711000537497 | Bryggkaffe Koffeinfritt Mellanrost | Gevalia | 425g | 82.20 SEK | 193.41 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
13. 7310050001043 | Bryggkaffe Mellanrost | Löfbergs | 450 g | 63.26 SEK | 140.58 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
14. 8000070024083 | Bryggkaffe Qualita Rossa | Lavazza | 340 g | 77.56 SEK | 228.12 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
15. 7310831020058 | Bryggkaffe Mörkrost | Lindvalls Kaffe | 450 gr | 84.18 SEK | 187.07 kr/kg | https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
