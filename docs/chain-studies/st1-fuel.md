# St1 SE pricing quirks

Study date: 2026-05-25. Sources were limited to `st1.se` public pages.

## Source-backed findings

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs in-store | No online fuel ordering price was found. St1 says current consumer pump prices are shown on each station's price pole and pumps, while the public `St1 Business-kort` page publishes business list prices. | Do not synthesize online/store fuel rows. Fuel rows from `foretag/listpris` are tagged as national business-card list prices, not consumer pump prices. |
| Loyalty program | No consumer fuel loyalty price was found. The verified fuel program is `St1 Business-kort` with list-price agreements for business customers; St1 states any discount applies against the current list price but does not publish a row-level discount amount. | Emit only the published list-price row; do not emit discounted/member rows without a concrete discounted example. Rows carry `pricing_program: st1_business_kort_listprisavtal` and `customer_segment: business_light_traffic`. |
| Format / sub-brand | The light-traffic list-price page is headed `St1 -stationer`. The truck page is separate and applies to `St1 Truck` heavy traffic. | Light-traffic rows carry `format: st1-stationer`. Truck rows are not mixed into this connector without a separate parser and tests. |
| Region / store-cluster | St1 says the light-traffic business list prices apply no matter where the card is used at St1 stations in Sweden. Consumer pump prices vary by local market and are reported by local price checks several times per day. | Light-traffic list rows use `store_id: null`, `region: sweden`, and `price_scope: national_business_list_price`. No station-specific pump rows are emitted. |
| Subscription / membership-required pricing | No paid consumer subscription that unlocks different fuel prices was found in the reviewed pages. | No subscription-price rows are emitted. |
| App-only / coupon-required prices | St1 Mobility supports app payment and app-unique offers, but the reviewed page describes the app-unique offers for PLOQ/Välkommen in food destinations rather than fuel. | No app-only or coupon fuel rows are emitted. |
| Time-of-day or close-to-close clearance | The reviewed St1 pages describe low prices around the clock and local price checks several times per day; no daily evening or close-to-close fuel clearance price was found. | No clearance rows are emitted. |
| Bulk / volume pricing tiers | No `buy N+` fuel volume tier was found in the reviewed pages. | No multi-buy fuel rows are emitted. |
| Service-counter vs packaged | Not applicable to the fuel list-price page. St1 station pages mention shop/food services at some locations, but no service-counter versus packaged price example was found. | No counter/packaged fuel rows are emitted. |
| B2B / wholesale split | St1 publishes separate business list-price pages for light traffic and heavy traffic. The heavy-traffic page states St1 Business-card truck customers are charged weekly list price minus any discount at St1 Truck and current pump price without discount at St1 stations. | The existing connector remains scoped to light-traffic `St1 Business-kort` rows; it marks those rows as business light traffic so consumer comparisons do not treat them as pump prices. |

## Reviewed examples

- Light traffic business list prices: `https://st1.se/foretag/listpris` states that the listed prices are for `St1 Business-kort` business customers with list-price agreements at St1 stations in Sweden, apply regardless of where the card is used in Sweden, and are valid from 00:01 on the listed date. On 2026-05-25 the page listed Bensin 98, Bensin 95, E85, Diesel, and HVO100 per-litre prices under `St1 -stationer`.
- Heavy traffic business list prices: `https://st1.se/foretag/listpris-truck` states that St1 Business-card heavy-traffic and Volvo truck-card customers are charged weekly list price minus any discount, that a St1 Truck diesel pump can show a fictitious 1 kr/litre while the receipt shows the correct price, and that St1-station tanking uses current pump price without discount.
- Consumer pump-price dynamics: `https://st1.se/privat/tjanster/billig-bensin` says St1 performs more than 1,000 price checks per day and that fuel prices vary locally due to competition. It says the current price is visible on the station price pole and pumps.
- App offers: `https://st1.se/app-och-erbjudanden/st1-mobility` says St1 Mobility supports app fueling/payment and app-unique offers, then describes those app-unique offers as food-and-drink offers from PLOQ and Välkommen in.
- EV charging: `https://st1.se/privat/produkter/ladda-bilen/priser` publishes station-specific charging prices, e.g. Arvika at 5.79 kr/kWh and Askersund at 5.84 kr/kWh on the reviewed page. These are non-fuel charging prices and are outside the current fuel list-price connector.

## No codified row changes from the reviewed pages

- No consumer online/store fuel price delta was found.
- No concrete consumer fuel loyalty discount row was found.
- No subscription, coupon, clearance, multi-buy, or service-counter fuel price was found.
- No station-specific consumer pump price table was found on `st1.se`; St1 directs users to station signs/pumps for current pump prices.
