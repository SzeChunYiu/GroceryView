# ICA reklamblad ingestion evidence

- Source: ICA Focus public weekly offers page carrying the current e-magin reklamblad link
- Source URL: https://www.ica.se/erbjudanden/ica-focus-1004247/
- E-magin flyer URL: https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
- E-magin PDF API URL: https://api.e-magin.se/api/pdf/6h3pqb3k
- Retrieved: 2026-05-21T01:40:54.156Z
- Store: ICA Focus (BMS store id 1735)
- Real rows fetched: 75
- Connector: packages/ingestion/src/connectors/ica-reklamblad.ts
- Web wire: apps/web/src/lib/ingested/ica-reklamblad.ts

The deprecated host reklamblad.ica.se did not resolve in the manager probe. ICA's current public store offer page exposes a DRBlad/e-magin weekly flyer link and structured weeklyOffers rows in the page state. Every emitted row includes an ICA offer id, product name, brand, package label, price text, comparison and regular price text when present, validity date, store identity, source page URL, e-magin flyer URL, PDF API URL, image URL, and retrieval timestamp.

## Sample Retrieved Rows

1. 5003918750 | Läsk | Trocadero, Loka crush, Champis | 140-150 cl | 3 för 40 kr | Skafferivaror | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
2. 5003918751 | Fryst hamburgare | ICA | 720 g | 70 kr/st | Djupfryst | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
3. 5003918752 | Mogen avokado 3-pack | ICA. Sydafrika/Peru | 330 g | 25 kr/st | Frukt & Grönt | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
4. 5003918753 | Glass flerpack | SIA Glass | 4-6 pack | 2 för 70 kr | Djupfryst | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
5. 5003918754 | Juice | God Morgon | 1 liter | 2 för 40 kr | Mejeri | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
6. 5003957696 | Turkisk, Grekisk Yoghurt | Salakis | 1 kg | 25 kr/st | Mejeri | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
7. 5003957968 | Marsipanbröd | Anthon Berg | 33-40 g | 2 för 18 kr | Skafferivaror | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
8. 5003957970 | Grötbröd, Müslibröd | Pågen | 650-780 g | 2 för 40 kr | Bröd, kex & bageri | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
9. 5003957971 | Korvbröd surdeg | ICA | 8-pack | 2 för 28 kr | Bröd, kex & bageri | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
10. 2003087280 | Iskaffe | Hell | 250 ml | 10 kr/+pant | Mejeri | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
11. 2003433579 | Knatter | Brynild | 80-100g | 2 för 22 kr | Skafferivaror | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
12. 2003433869 | Wellibites | Wellibites | 70g | 2 för 35 kr | Skafferivaror | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
13. 2003586802 | Lättdryck koncentrat | Kiviks Musteri | 20cl | 3 för 18 kr | Skafferivaror | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
14. 2003660262 | Barista | Oddlygood | 1000 ml | 2 för 39 kr | Mejeri | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
15. 2003697911 | Ingefära Shot | Herrljunga | 50cl | 35 kr/st | Skafferivaror | https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1
