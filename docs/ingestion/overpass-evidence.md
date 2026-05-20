# Overpass ingestion evidence

- Source: overpass-api.de for OpenStreetMap
- Source URL: https://overpass-api.de/api/interpreter
- Retrieved: 2026-05-20T23:42:42.930Z
- Query: Stockholm county shop=supermarket|convenience|grocery, out center tags 60
- Real rows fetched: 60
- Connector: packages/ingestion/src/connectors/overpass.ts
- Web wire: apps/web/src/lib/ingested/overpass.ts
- License: ODbL, © OpenStreetMap contributors

Every emitted row includes OSM element type/id, coordinates, shop tag, and source URL.

## Sample Retrieved Rows

1. node/29898149 | ICA nära Karlaplan | ICA Nära | supermarket | 59.337217,18.0911217
2. node/29898162 | Coop Erik Dahlbergsgatan | Coop | supermarket | 59.3423537,18.0911049
3. node/35514774 | ICA Nära Vårsta | ICA Nära | supermarket | 59.1646601,17.7961694
4. node/38453442 | ICA nära Norrviken | ICA Nära | supermarket | 59.4586,17.9231
5. node/49888802 | Hemköp Sollentuna Rotehallen | Hemköp | supermarket | 59.4768,17.9118
6. node/49924832 | ICA Supermarket Format | ICA Supermarket | supermarket | 59.4984186,17.9258961
7. node/51229934 | PLOQ Spånga Spångav. | PLOQ Spånga Spångav. | convenience | 59.3781037,17.9053569
8. node/60750116 | Maxi ICA Stormarknad Häggvik | Maxi ICA Stormarknad | supermarket | 59.4377882,17.9319525
9. node/90159005 | Hemköp Stockholm Älvsjö | Hemköp | supermarket | 59.2787519,18.00228
10. node/90399562 | Hemköp Danderyd Mörby Centrum | Hemköp | supermarket | 59.398465,18.0367377
11. node/91625237 | ICA Nära Klingsta | ICA Nära | supermarket | 59.4003431,18.0256737
12. node/148580618 | ICA Tornet | ICA Nära | supermarket | 59.3847828,18.0577742
13. node/151014926 | ICA Supermarket Bro | ICA Supermarket | supermarket | 59.5159804,17.6428187
14. node/223805462 | ICA Kvantum BEA Livsmedel | ICA Kvantum | supermarket | 59.2787858,18.0699775
15. node/247736397 | ICA Supermarket Sigtuna | ICA Supermarket | supermarket | 59.6170493,17.7232231
