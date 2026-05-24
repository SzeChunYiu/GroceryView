# Chain confidence report

Generated from checked-in GroceryView evidence modules. No country/chain rows are invented; missing values stay `Not reported` in the app table.

| Country | Chain source | Store count | SKU count | Observations in last 7d | Last observed |
| --- | --- | ---: | ---: | ---: | --- |
| SE | OSM/Axfood/OpenPrices generated snapshot | Rendered from `perChainConfidenceRows` | Rendered from `perChainConfidenceRows` | Rendered from `perChainConfidenceRows` | Rendered from `perChainConfidenceRows` |

The runtime table on `/data-sources` and `/[country]/data-sources` is built by `buildPerChainConfidenceRows` from generated OSM stores, Axfood chain products, and OpenPrices rows.
