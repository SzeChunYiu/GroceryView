# DocMorris SE pricing quirks study

Date checked: 2026-05-25. Scope: the former/current `docmorris.se` entry point and current official DocMorris web properties that a Swedish (`SE`) discovery URL resolves toward.

## Primary-source findings

- `https://docmorris.se/` and `https://www.docmorris.se/` timed out over HTTPS from this environment on 2026-05-25. The HTTP variants responded with `301 Moved Permanently` to `https://docmorris.de`, after which Cloudflare returned `403` to the command-line request. Therefore no current Swedish product catalogue could be verified from `docmorris.se` itself.
- DocMorris corporate says the group is currently focused on three key markets: Germany, Spain, and France. Sweden is not listed as a current key market. Source: https://corporate.docmorris.com/en/about-us/business/markets-and-brands/
- DocMorris corporate describes the core business as online pharmacy, with Rx, OTC, consumer health, beauty/personal-care products, private labels, marketplace services, partner pharmacies/sellers, and fast delivery. Source: https://corporate.docmorris.com/en/about-us/business/business-fields/
- The current DocMorris shop footer states prices on `DocMorris.de` apply only to online orders under `DocMorris.de`, and do not apply in stationary partner pharmacies. Source: https://www.docmorris.de/
- The DocMorris offers listing shows concrete online price mechanics: list/reference price, `Verkaufspreis`, `Grundpreis`, and `Rabattstempel` percentage, e.g. Heumann Ibuprofen 400 mg 50 St at `11,84 €` list / `3,89 €` sale / `0.08 €/St` / `-67%`. Source: https://www.docmorris.de/angebote
- The coupon listing is explicitly a set of products currently cheaper with coupon (`Couponartikel`) and includes filters for category, manufacturer, brand, pack size, dosage form, sales type, product attributes, suitability, price, ratings, and features. Source: https://www.docmorris.de/angebote/couponartikel
- The bundle page (`Sparsets`) explicitly says sets can be bought to save money and lists multi-pack sizes such as `2X15 ml`, `2X20 St`, and `1 Set`. Source: https://www.docmorris.de/angebote/sparsets
- DocMorris points are awarded on online/app orders of non-prescription products: at least 10 points per €1 order value, 50% more points in the app, 1000 points = €1 discount, and redemption is capped at 20% of the eligible non-prescription basket. Source: https://www.docmorris.de/punkte
- The recipe subscription page (`Rezept-Abo`) is a repeat-prescription service for follow-up medication; it is free, has free shipping for subscription orders, can be managed/cancelled in web/app, and is not a separate product-list sale price. Source: https://www.docmorris.de/rezepte/rezept-abo

## Quirk coverage requested by ticket

| Topic | Verifiable result | Connector treatment |
| --- | --- | --- |
| Online vs store | `DocMorris.de` states online prices apply only online and not in stationary partner pharmacies. | Rows set `channel: 'online'`; no store price is emitted. |
| Loyalty | Points can be earned on eligible online/app non-prescription orders; app earns 50% more. | Rows derive `loyalty_points_base` and `loyalty_points_app` from `price_eur`. |
| Format/sub-brand | Official navigation and listings expose categories, brands, manufacturers, dosage forms and private-label products, but no SE-specific sub-brand pricing rule was verified. | No sub-brand field added. |
| Region/store-cluster | No current Swedish store-cluster pricing could be verified; official current focus omits Sweden, and `docmorris.se` redirects toward Germany over HTTP. | Rows carry `requested_market: 'SE'` and `fulfillment_market: 'DE'`; no region/store field added. |
| Subscription/member pricing | `Rezept-Abo` is a free repeat-prescription service with free shipping, not a distinct product-list price. | No subscription price field added. |
| App/coupon | Points page documents app point uplift; coupon listing documents coupon products. | Rows include app/base points and `is_coupon_listing`. |
| Clearance/discount | Offers pages expose list price, sale price, base price and discount stamp. | Rows include `list_price_eur`, `base_price_text`, and `discount_percent`. |
| Bulk tiers | `Sparsets` exposes multi-pack set listings. | Rows include `is_bundle`. |
| Service-counter vs packaged | Current official pages studied are online packaged-product listings and prescription services; no Swedish counter/service price table was found. | No counter/service price is emitted. |
| B2B | Corporate page describes professional health services for doctors, pharmacies, insurers and health institutions, but no product-row B2B price schedule was verified. | No B2B price field added. |

## Implementation notes

`packages/ingestion/src/connectors/docmorris-se.ts` treats `docmorris.se` as a Swedish discovery point that currently resolves to the German DocMorris online market. Default product sources are official DocMorris offer, coupon, and bundle listing URLs. Rows intentionally use `currency: 'EUR'`, `requested_market: 'SE'`, and `fulfillment_market: 'DE'` instead of inventing Swedish SEK rows that cannot be verified from the current primary sources.
