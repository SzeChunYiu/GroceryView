# Coop ingestion evidence

- Source: coop.se public personalization search API configured in the public handla page
- Source URL: https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1
- Settings URL fetched with `curl -A "GroceryView/0.1"`: https://www.coop.se/handla/
- Request bodies: queries kaffe, mjölk, pasta, kyckling, smör, yoghurt, banan, ris, fisk; resultsOptions take 1000, empty sort/facets, relatedResultsOptions take 16
- Required public header: Ocp-Apim-Subscription-Key value exposed in window.coopSettings.serviceAccess.personalizationApiSubscriptionKey
- Retrieved: 2026-05-22T15:33:12.096Z
- Store: 251300
- Device parameter: desktop
- Curl-inspected query counts: kaffe 289, mjölk 270, pasta 397, kyckling 406, smör 104, yoghurt 321, banan 97, ris 176, fisk 313
- Real deduped product rows fetched: 2205
- Connector: packages/ingestion/src/connectors/coop.ts
- Web wire: apps/web/src/lib/ingested/coop.ts

Every emitted row includes Coop product id/EAN, product name, brand, package label, category, B2C SEK price, comparative unit price when present, promotion copy when present, source API URL, product URL, image URL, and retrieval timestamp.

## Weekly flyer discount evidence

- Source: Coop public store API current flyer metadata plus public personalization product search promotions and public DR flyer PDF text
- Store API URLs: per-branch `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true`, listed in `apps/web/src/lib/ingested/coop.ts`
- Flyer PDF URLs: per-branch `https://dr.coop.se/Butik/<store-slug>`, listed in `apps/web/src/lib/ingested/coop.ts`
- Product search URLs: per-branch `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1`, listed in `apps/web/src/lib/ingested/coop.ts`
- Request body: weekly flyer item queries listed in `DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES`, resultsOptions take 8, empty sort/facets, relatedResultsOptions take 0
- Required public headers: `storeApiSubscriptionKey` for store metadata and `personalizationApiSubscriptionKey` for product search, both exposed in `window.coopSettings.serviceAccess` on https://www.coop.se/handla/
- Retrieved: 2026-05-24T06:34:30.556Z for 10 added rows at X:-Tra Töreboda and X:-Tra Mariestad; previous latest retrieval 2026-05-23T18:24:33.749Z for 170 added rows at Coop Funäsdalen, Coop Sveg, Coop Vindeln, Coop Sala, Coop Partille, Coop Mellerud, Coop Björna, Stora Coop Kållered, Coop Träkvista; previous retained rows retrieved 2026-05-23T17:42:43.341Z, 2026-05-23T14:31:15.709Z, 2026-05-23T13:02:38.339Z, 2026-05-22T15:07:27.837Z, 2026-05-22T16:05:03.230Z, 2026-05-22T16:34:51.000Z, 2026-05-22T16:55:10.087Z, 2026-05-22T18:13:24.527Z, 2026-05-22T18:46:18.919Z, 2026-05-22T19:36:22.255Z, 2026-05-22T20:44:26.622Z, 2026-05-22T21:07:45.585Z, 2026-05-22T23:08:48.345Z, 2026-05-22T23:37:11.938Z, 2026-05-23T00:07:02.085Z
- Added this iteration: 015320 Coop Västerhaninge Centrum; 245200 Coop Haparanda; 163900 Coop Sunne; 163500 Coop Hagfors; 136251 Coop Hunnebostrand; 135220 Coop Kungshamn; 205150 Coop Sandviken; 066452 Coop Torup; 075220 Coop Sävsjö; 086811 Coop Högsby; 165500 Coop Sysslebäck; 196311 Coop Sollerön; 235160 Coop Byske; 235180 Coop Norsjö; 235200 Coop Malå
- Added this iteration (worker B follow-up): 235300 Coop Tärnaby; 235380 Coop Burträsk; 235420 Coop Nordmaling; 235430 Coop Storuman; 235480 Coop Robertsfors; 235920 Coop Hammarstrand; 235960 Coop Åre; 235980 Coop Järpen; 236030 Coop Bjurholm; 235600 Coop Kramfors; 235900 Coop Strömsund; 235410 Coop Vännäs; 235510 Coop Ånge; 135030 Coop Lysekil
- Added this iteration (worker B second follow-up): 074400 Coop Tranås; 245040 Coop Älvsbyn; 086804 Coop Kolberga; 083700 Coop Flanaden
- Added this iteration (worker B third follow-up): 105860 Stora Coop Stadion. Flyer PDF offer prices were verified from `https://dr.coop.se/Butik/Stora-Coop-Stadion`; ordinary prices came from the store-scoped product search URL listed in `apps/web/src/lib/ingested/coop.ts`.
- Added this iteration (worker B fourth follow-up): 163120 Stora Coop Karlskoga. Current flyer hash matched the already-ingested Värmland Stora Coop flyer group; ordinary prices came from the store-scoped product search URL listed in apps/web/src/lib/ingested/coop.ts.
- Added this iteration (worker B fifth follow-up): 055500 Coop Stenbärsvägen Nyköping; 075600 Coop Kristinedal; 135040 Coop Älvängen; 235610 Coop Sollefteå; 165250 Coop Charlottenberg; 196170 Coop Sälen; 195520 Coop Rättvik; 195070 Coop Orsa; 195040 Coop Säter; 185261 Coop Skinnskatteberg; 184400 Coop Fagersta; 035440 Coop Tierp; 035400 Stora Coop Östhammar; 156000 Coop Änghagen Lidköping; 155550 Coop Vipans Gränd Skövde; 155000 Coop Sydport Mariestad; 154900 Coop Tidaholm; 154000 Coop Falköping; 126406 Coop Gamlestaden; 126350 Coop Eriksberg; 123000 Coop Stenungsund; 030760 Coop Tyresö Centrum; 185010 Coop Pilgatan Västerås; 106433 Coop Simrishamn; 035000 Coop Daglivs; 133700 Coop Kronhjorten. Coop product search returned promotion objects with ordinary and offer prices for these store-scoped branches; current flyer URLs and validity came from the public store API.
- Added this iteration (worker B sixth follow-up): 056313 Coop Östermalmshallen; 196231 Coop Bjursås; 245080 Coop Arjeplog; 245050 Coop Pajala; 116385 Coop Getinge; 116418 Coop Knäred. Fresh connector fetch also matched falukorv offers for all six stores. Flyer PDF text from `https://dr.coop.se/Butik/<store-slug>` verified offer prices for falukorv, avokado, spare ribs, Finish maskindisktabletter, ost familjefavoriter, and Coop fiskpinnar; ordinary prices came from the matching store-scoped product search URLs listed in `apps/web/src/lib/ingested/coop.ts`.
- Added this iteration (worker B seventh follow-up): 135120 Coop Åmål Mellanbrogatan, 12 real discount rows. Flyer PDF text from `https://dr.coop.se/Butik/Coop-%C3%85m%C3%A5l-Mellanbrogatan` matched the Avenyn flyer group and verified the offer prices; ordinary prices came from `https://external.api.coop.se/personalization/search/products?store=135120&device=desktop&direct=true&api-version=v1`, with validity and flyer URL from `https://proxy.api.coop.se/external/store/stores/135120?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true`.
- Added this iteration (worker B eighth follow-up): 086802 Coop Fårbo; 245060 Coop Harads; 235190 Coop Sorsele; 235220 Coop Dorotea; 235400 Coop Åsele, 25 real discount rows. Store API validity and flyer URLs came from the matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses. Ordinary prices came from the matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses. Flyer PDF text from each added branch URL verified the emitted small-store offer prices for falukorv, avokado, Finish maskindisktabletter, ost familjefavoriter, spare ribs where emitted, and Coop fiskpinnar.
- Added this iteration (worker B ninth follow-up): 235460 Coop Hörnefors; 235540 Coop Bollstabruk; 236075 Coop Jörn; 236077 Coop Lövånger; 236402 Coop Köpmanholmen; 236404 Coop Mellansel; 236405 Coop Bredbyn; 236708 Coop Torpshammar; 236742 Coop Fränsta; 236788 Coop Näsåker; 235580 Coop Lycksele; 126500 Coop Alingsås, 166 real discount rows. Store API validity and flyer URLs came from the matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses. Ordinary prices and offer prices came from the matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses retrieved at 2026-05-23T00:07:02.085Z. Candidate 086809 Coop Kristdala was inspected but excluded because it returned no qualifying ordinary-price-greater-than-offer-price discount rows.
- Added this iteration (worker B tenth follow-up): 176211 Stora Coop Ladugårdsängen (Örebro); 106436 Coop Örkelljunga (Örkelljunga); 135060 Stora Coop Tanumshede (Tanum); 086815 Coop Målilla (Målilla); 192500 Coop Leksand (Leksand); 056095 Stora Coop Risängen (Norrköping); 235620 Coop Vilhelmina (Vilhelmina); 245020 Coop Överkalix (Överkalix); 183500 Coop Sveaplan Eskilstuna (Eskilstuna); 065050 Coop Hyltebruk (Hyltebruk); 072700 Coop Västervik (Västervik); 236085 Coop Ånäset (Ånäset); 106114 Stora Coop Falkenberg (Falkenberg); 122000 Coop Kongahälla (Kungälv), 276 real discount rows (176211:25, 106436:22, 135060:25, 086815:14, 192500:18, 056095:22, 235620:15, 245020:16, 183500:22, 065050:21, 072700:18, 236085:11, 106114:25, 122000:22). Store API validity and flyer URLs came from matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses retrieved at 2026-05-23T13:02:38.339Z. Ordinary and offer prices came from matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses. Candidate stores 242300, 235660, 093300, 206402, 236420, 236451, 236023, 235440, 055240, 235650, and 236020 were inspected but excluded because they returned no qualifying ordinary-price-greater-than-offer-price discount rows in this probe.
- Added this iteration (worker B eleventh follow-up): 056030 Coop Linden Motala; 056215 Coop Stockholmsvägen; 056212 Coop Ullstämma; 016041 Coop Hagastaden; 026828 Coop Bålsta; 126400 Coop Kolla Parkstad; 123300 Coop Öjersjö; 235970 Coop Vemdalen; 016170 Stora Coop Spånga; 055030 Stora Coop Ingelsta; 015480 Stora Coop Barkarby; 232400 Stora Coop Avion; 245270 Coop Arvidsjaur, 267 real discount rows (056030:21, 056215:16, 056212:17, 016041:19, 026828:20, 126400:17, 123300:23, 235970:19, 016170:25, 055030:25, 015480:26, 232400:18, 245270:21). Store API validity and flyer URLs came from matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses retrieved at 2026-05-23T14:31:15.709Z. Ordinary and offer prices came from matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses. Candidate stores 242300, 235660, 093300, 206402, 236420, 236451, 236023, 235440, 055240, 235650, 236020, 106441, 093400, 232200, 104210, and 236013 were inspected but excluded because they only yielded flyer-PDF fallback rows without a verified ordinary-price-greater-than-offer-price discount.
- Added this iteration (worker B thirteenth follow-up): 225360 Coop Funäsdalen (Funäsdalen) 15; 225340 Coop Sveg (Sveg) 16; 235490 Coop Vindeln (Vindeln) 18; 184900 Coop Sala (Sala) 21; 123200 Coop Partille (Partille) 22; 136000 Coop Mellerud (Mellerud) 22; 236464 Coop Björna (Björna) 10; 133900 Stora Coop Kållered (Kållered) 26; 016195 Coop Träkvista (Ekerö) 20. Store API validity and flyer URLs came from matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses retrieved at 2026-05-23T18:24:33.749Z. Ordinary and offer prices came from matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses; only product-search rows with ordinaryPrice greater than offerPrice were emitted.
- Added this iteration (worker B fourteenth follow-up): 246549 Coop Vittangi (Vittangi) 13; 246550 Coop Svappavaara (Svappavaara) 14; 245030 Coop Övertorneå (Övertorneå) 17; 085130 Coop Mönsterås (Mönsterås) 21; 085320 Coop Hultsfred (Hultsfred) 15. Store API validity and flyer URLs came from matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses retrieved at 2026-05-23T19:59:28.767Z. Ordinary and offer prices came from matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses; only product-search rows with ordinaryPrice greater than offerPrice were emitted. Candidate stores 246030, 245010, 245090, 085210, and 086820 were inspected but excluded because they returned no qualifying ordinary-price-greater-than-offer-price discount rows in this probe.
- Added this iteration (worker B fifteenth follow-up): 136049 X:-Tra Töreboda and 136050 X:-Tra Mariestad, 10 real current-week discount rows (5 each). Store API validity and flyer URLs came from matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses retrieved at 2026-05-24T06:34:30.556Z. Offer and ordinary prices came from public DR flyer PDF text at `https://dr.coop.se/Butik/X%3Atra-T%C3%B6reboda` and `https://dr.coop.se/Butik/X%3Atra-Mariestad`; only rows with ordinaryPrice greater than offerPrice and validity 2026-05-18T00:00:00 through 2026-05-24T23:59:59 were emitted. Candidate stores 196183, 176310, 136048, 136051, 136057, 136022, 136038, 136041, 136027, 136044, 136045, 056231, 056214, and 216544 were inspected but returned no qualifying current-week discount rows in this probe.
- Added this iteration (worker B twelfth follow-up): 235990 Coop Bräcke; 236401 Coop Ullånger, 37 real discount rows (235990:18, 236401:19). Store API validity and flyer URLs came from matching `https://proxy.api.coop.se/external/store/stores/<storeId>?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true` responses retrieved at 2026-05-23T17:42:43.341Z. Ordinary and offer prices came from matching store-scoped `https://external.api.coop.se/personalization/search/products?store=<storeId>&device=desktop&direct=true&api-version=v1` responses. Candidate stores outside the connector default list were probed directly against the public personalization API; most returned 403 or only non-qualifying/no promotion rows, and only these two stores returned verified ordinary-price-greater-than-offer-price discounts.
- Stores:
  - 176110, Coop City Hallsberg, Hallsberg, 22 real discount rows
  - 216502, X:-Tra Kirseberg, Malmö, 3 real discount rows
  - 136049, X:-Tra Töreboda, Töreboda, 5 real discount rows
  - 136050, X:-Tra Mariestad, Mariestad, 5 real discount rows
  - 136058, X:-Tra Herrljunga, Herrljunga, 3 real discount rows
  - 136055, X:-Tra Lidköping, Lidköping, 3 real discount rows
  - 136028, X:-Tra Svenljunga, Svenljunga, 3 real discount rows
  - 136029, X:-Tra Hisingen, Göteborg, 3 real discount rows
  - 136021, X:-Tra Borås, Borås, 3 real discount rows
  - 136040, X:-Tra Lilla Edet, Lilla Edet, 3 real discount rows
  - 056217, X:-Tra Ljura, Norrköping, 3 real discount rows
  - 186116, X:-Tra Stengatan, Västerås, 3 real discount rows
  - 186311, X:-Tra Surahammar, Surahammar, 3 real discount rows
  - 176215, X:-Tra Haga Örebro, Örebro, 3 real discount rows
  - 176217, X:-Tra Markbacken, Örebro, 3 real discount rows
  - 186370, X:-Tra Arboga, Arboga, 3 real discount rows
  - 176311, X:-Tra Askersund, Askersund, 3 real discount rows
  - 176111, X:-Tra Hallsberg, Hallsberg, 3 real discount rows
  - 056219, X:-Tra Motala, Motala, 3 real discount rows
  - 216532, X:-Tra Söderkulla, Malmö, 3 real discount rows
  - 216527, X:-Tra Arlövsvägen, Arlöv, 3 real discount rows
  - 216528, X:-Tra Dalbyvägen, Arlöv, 3 real discount rows
  - 216517, X:-Tra Remigatan, Landskrona, 3 real discount rows
  - 106118, X:-Tra Snöstorpsvägen, Halmstad, 3 real discount rows
  - 106116, X:-Tra Arvidstorp, Falkenberg, 3 real discount rows
  - 216508, X:-Tra Örkelljunga, Örkelljunga, 3 real discount rows
  - 216516, X:-Tra Vasatorp, Helsingborg, 3 real discount rows
  - 216539, X:-Tra Sjöbo, Sjöbo, 3 real discount rows
  - 216545, X:-Tra Perstorp, Perstorp, 3 real discount rows
  - 056230, Coop Fiskaregatan Vimmerby, Vimmerby, 14 real discount rows
  - 056313, Coop Östermalmshallen, Finspång, 4 real discount rows
  - 136037, X:-Tra Vetlanda, Vetlanda, 3 real discount rows
  - 136006, X:-Tra Ljungby, Ljungby, 3 real discount rows
  - 136010, X:-Tra Alvesta, Alvesta, 3 real discount rows
  - 216548, X:-Tra Sölvesborg, Sölvesborg, 3 real discount rows
  - 216554, X:-Tra Karlskrona, Karlskrona, 3 real discount rows
  - 136019, X:-Tra Mullsjö, Mullsjö, 3 real discount rows
  - 216503, X:-Tra Höör, Höör, 3 real discount rows
  - 216538, X:-Tra Hörby, Hörby, 3 real discount rows
  - 216540, X:-Tra Eslöv, Eslöv, 3 real discount rows
  - 216547, X:-Tra Hässleholm, Hässleholm, 3 real discount rows
  - 216549, X:-Tra Österäng, Kristianstad, 3 real discount rows
  - 216550, X:-Tra Näsby, Kristianstad, 3 real discount rows
  - 216555, X:-Tra Osby, Osby, 3 real discount rows
  - 016712, X:-Tra Aspudden, Hägersten, 3 real discount rows
  - 136043, X:-Tra Hisings Backa, Hising Backa, 3 real discount rows
  - 216512, X:-Tra Elineberg, Helsingborg, 3 real discount rows
  - 026500, Coop Bredden, Upplands Väsby, 16 real discount rows
  - 136635, X:-Tra Ljungskile, Ljungskile, 3 real discount rows
  - 136039, X:-Tra Trollhättan, Trollhättan, 3 real discount rows
  - 136046, X:-Tra Sävsjö, Sävsjö, 3 real discount rows
  - 136015, X:-Tra Eksjö, Eksjö, 3 real discount rows
  - 136013, X:-Tra Smålandsstenar, Smålandsstenar, 3 real discount rows
  - 163400, Stora Coop Kristinehamn, Kristinehamn, 25 real discount rows
  - 231400, Stora Coop Ersboda, Umeå, 24 real discount rows
  - 231500, Stora Coop Härnösand, Härnösand, 25 real discount rows
  - 231800, Stora Coop Örnsköldsvik, Örnsköldsvik, 27 real discount rows
  - 093200, Stora Coop Karlshamn, Karlshamn, 24 real discount rows
  - 133100, Stora Coop Överby, Trollhättan, 23 real discount rows
  - 231900, Stora Coop Östersund, Östersund, 25 real discount rows
  - 030500, Stora Coop Vinsta, Vällingby, 23 real discount rows
  - 252700, Stora Coop Bromma, Bromma, 25 real discount rows
  - 075800, Stora Coop Norremark, Växjö, 25 real discount rows
  - 022500, Stora Coop Visby, Visby, 26 real discount rows
  - 201700, Stora Coop Valbo, Valbo, 21 real discount rows
  - 242200, Stora Coop Storheden, Luleå, 25 real discount rows
  - 255500, Stora Coop Sisjön, Askim, 25 real discount rows
  - 253200, Stora Coop Skara, Skara, 27 real discount rows
  - 252600, Stora Coop Backaplan, Göteborg, 25 real discount rows
  - 252500, Stora Coop Bäckebol, Hisings Backa, 23 real discount rows
  - 175010, Coop Forum Marieberg, Örebro, 23 real discount rows
  - 231300, Stora Coop Sörböle, Skellefteå, 18 real discount rows
  - 241200, Stora Coop Kiruna, Kiruna, 25 real discount rows
  - 256600, Stora Coop Västberga, Hägersten, 25 real discount rows
  - 112000, Stora Coop Varberg, Varberg, 27 real discount rows
  - 105860, Stora Coop Stadion, Malmö, 6 real discount rows
  - 255700, Stora Coop Häggvik, Sollentuna, 24 real discount rows
  - 015350, Stora Coop Huddinge, Huddinge, 25 real discount rows
  - 026000, Stora Coop Märsta, Märsta, 26 real discount rows
  - 254800, Stora Coop Nolhaga Skövde, Skövde, 25 real discount rows
  - 255900, Stora Coop Kungsbacka, Kungsbacka, 26 real discount rows
  - 105760, Stora Coop Lund, Lund, 5 real discount rows
  - 162000, Stora Coop Bergvik, Karlstad, 23 real discount rows
  - 241800, Stora Coop Kalix, Kalix, 26 real discount rows
  - 015810, Stora Coop Sundby Park, Sundbyberg, 27 real discount rows
  - 205180, Stora Coop Hudiksvall, Hudiksvall, 22 real discount rows
  - 251300, Stora Coop Boländerna, Uppsala, 27 real discount rows
  - 015700, Stora Coop Danderyd, Danderyd, 26 real discount rows
  - 072000, Stora Coop Jönköping, Jönköping, 24 real discount rows
  - 241100, Stora Coop Gällivare, Gällivare, 23 real discount rows
  - 254700, Stora Coop Nyköping, Nyköping, 25 real discount rows
  - 036968, Stora Coop Norrteljeporten, Norrtälje, 25 real discount rows
  - 015220, Stora Coop Stuvsta, Huddinge, 25 real discount rows
  - 016141, Stora Coop Orminge, Saltsjö-Boo, 24 real discount rows
  - 255400, Stora Coop Värmdö, Gustavsberg, 25 real discount rows
  - 250800, Stora Coop Södertälje, Södertälje, 25 real discount rows
  - 105740, Stora Coop Råå Hbg, Helsingborg, 4 real discount rows
  - 105710, Stora Coop Väla Hbg, Ödåkra, 6 real discount rows
  - 257400, Stora Coop Strängnäs, Strängnäs, 26 real discount rows
  - 253000, Stora Coop Eskilstuna, Eskilstuna, 21 real discount rows
  - 252200, Stora Coop Borås, Borås, 27 real discount rows
  - 205140, Stora Coop Bollnäs, Bollnäs, 26 real discount rows
  - 163300, Stora Coop Palmviken Arvika, Arvika, 25 real discount rows
  - 165400, Stora Coop Styckåsen, Arvika, 26 real discount rows
  - 163800, Stora Coop Hammarö, Hammarö, 23 real discount rows
  - 015400, Stora Coop Åkersberga, Åkersberga, 24 real discount rows
  - 254900, Stora Coop Enköping, Enköping, 21 real discount rows
  - 054000, Stora Coop Finspång, Finspång, 27 real discount rows
  - 185510, Stora Coop Stenby Västerås, Västerås, 27 real discount rows
  - 232000, Stora Coop Sundsvall, Sundsvall, 25 real discount rows
  - 105610, Stora Coop Halmstad, Halmstad, 27 real discount rows
  - 195020, Stora Coop Norra Backa, Borlänge, 27 real discount rows
  - 163000, Stora Coop Välsviken, Karlstad, 22 real discount rows
  - 196000, Stora Coop Ludvika, Ludvika, 22 real discount rows
  - 026810, Stora Coop Kungsängen, Kungsängen, 27 real discount rows
  - 056010, Stora Coop Garnisonen Linköping, Linköping, 22 real discount rows
  - 195030, Stora Coop Falun, Falun, 25 real discount rows
  - 015430, Stora Coop Tumba, Tumba, 25 real discount rows
  - 105830, Stora Coop Trelleborg, Trelleborg, 5 real discount rows
  - 133800, Stora Coop Torp, Uddevalla, 25 real discount rows
  - 015470, Stora Coop Arninge, Täby, 26 real discount rows
  - 201510, Stora Coop Ljusdal, Ljusdal, 24 real discount rows
  - 105630, Stora Coop Burlöv, Arlöv, 4 real discount rows
  - 015320, Coop Västerhaninge Centrum, Västerhaninge, 19 real discount rows
  - 105810, Coop Forum Jägersro, Malmö, 6 real discount rows
  - 163120, Stora Coop Karlskoga, Karlskoga, 14 real discount rows
  - 250400, Stora Coop Haninge, Haninge, 26 real discount rows
  - 245200, Coop Haparanda, Haparanda, 21 real discount rows
  - 163900, Coop Sunne, Sunne, 23 real discount rows
  - 163500, Coop Hagfors, Hagfors, 18 real discount rows
  - 136251, Coop Hunnebostrand, Hunnebostrand, 21 real discount rows
  - 196231, Coop Bjursås, Bjursås, 5 real discount rows
  - 245080, Coop Arjeplog, Arjeplog, 5 real discount rows
- Flyer validity: 2026-05-18T00:00:00 through 2026-05-31T23:59:59
- Real current flyer discount rows fetched: 1974
Every weekly discount row includes a stable Coop product or flyer-derived code, product name, brand/package labels when available, ordinary SEK price, offer SEK price, comparative offer price when present, promotion id/copy, MedMera requirement, store/region, validity, flyer URL, store API source URL, product search URL or flyer text URL, and retrieval timestamp.

## Sample Weekly Discount Rows

1. 2383471000006 | Laxfilé | Harbour | Stora Coop Boländerna | ordinary 259.32 SEK | offer 149.00 SEK | 149.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
2. 2317342100007 | Vattenmelon Mini |  | Stora Coop Boländerna | ordinary 26.45 SEK | offer 20.00 SEK | 20.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
3. 7310865005168 | Smör Normalsaltat | Svenskt Smör från Arla | Stora Coop Boländerna | ordinary 61.45 SEK | offer 45.00 SEK | 90.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
4. 2340375400004 | Hushållsost | Arla® | Stora Coop Boländerna | ordinary 114.50 SEK | offer 74.90 SEK | 74.90 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
5. 7340191179691 | Toalettpapper Nice & Soft 24-pack | Coop | Stora Coop Boländerna | ordinary 124.00 SEK | offer 99.00 SEK | 42.45 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
6. 7300206718000 | Bacon 3-pack | Scan | Stora Coop Boländerna | ordinary 40.65 SEK | offer 37.90 SEK | 90.24 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
7. 7310865095466 | Grekisk yoghurt 10% | Arla Köket® | Stora Coop Boländerna | ordinary 37.81 SEK | offer 29.90 SEK | 29.90 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
8. 80508816 | Olivolja Classico | Monini | Stora Coop Boländerna | ordinary 99.37 SEK | offer 89.00 SEK | 118.66 kr/lit | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
9. 2383471000006 | Laxfilé | Harbour | Coop Västerhaninge Centrum | ordinary 264.05 SEK | offer 149.00 SEK | 149.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
10. 7310865005168 | Smör Normalsaltat | Svenskt Smör från Arla | Coop Västerhaninge Centrum | ordinary 68.10 SEK | offer 45.00 SEK | 90.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
11. 7340191179691 | Toalettpapper Nice & Soft 24-pack | Coop | Coop Västerhaninge Centrum | ordinary 137.00 SEK | offer 99.00 SEK | 42.45 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
12. 7310865005168 | Smör Normalsaltat | Svenskt Smör från Arla | Coop Tranås | ordinary 64.31 SEK | offer 45.00 SEK | 90.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
13. 2383471000006 | Laxfilé | Harbour | Stora Coop Stadion | ordinary 269.00 SEK | offer 149.00 SEK | 149.00 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
14. 5714970007970 | Maskindisktabletter Power | Finish | Coop Knäred | ordinary 95.00 SEK | offer 49.50 SEK | 1.18 kr/tvätt/disk | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
15. 7300206787006 | Falukorv Ring | Scan | Coop Östermalmshallen | ordinary 43.95 SEK | offer 35.00 SEK | 43.75 kr/kg | 2026-05-18T00:00:00 to 2026-05-24T23:59:59
16. 7310865005168 | Smör Normalsaltat | Svenskt Smör från Arla | Coop Åmål Mellanbrogatan | ordinary 63.50 SEK | offer 45.00 SEK | 90.00 kr/kilo | 2026-05-18T00:00:00 to 2026-05-24T23:59:59

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
