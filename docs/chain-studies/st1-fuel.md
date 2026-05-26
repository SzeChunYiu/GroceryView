# ST1 (SE) pricing quirks

Primary sources: ST1 Sweden pages for low fuel price mechanics (`https://st1.se/privat/tjanster/billig-bensin`), ST1 stations (`https://st1.se/privat/tjanster/st1-stationer`), St1 Mobility (`https://st1.se/app-och-erbjudanden/st1-mobility`), light-traffic business list prices (`https://st1.se/foretag/listpris`), heavy-traffic list prices (`https://st1.se/foretag/listpris-truck`), business card terms (`https://st1.se/foretag/st1-business-kort-och-app/st1-business-kort`), and EV charging prices (`https://st1.se/privat/produkter/ladda-bilen/priser`).

## Source-backed findings

- **Online vs in-store:** ST1 publishes fuel prices as station pump/list-price surfaces, not consumer online ordering prices. The low-price page says current consumer prices are visible on each station's price sign and pumps. No online-vs-store grocery row is emitted.
- **Loyalty/business-card pricing:** The light-traffic list-price page says St1 Business-card list prices apply regardless of where the cardholder fuels in Sweden and that any discount applies against the current list price. Connector emits this as an eligibility-bound B2B metadata row with `is_member_price: true` and `out_of_scope_for_consumer_connector: true`.
- **Format/sub-brand:** ST1 separates standard ST1 stations from St1 Truck. The heavy-traffic list-price page applies to St1 Truck in Sweden and says heavy-traffic Business-card diesel pumps may display a fictional 1 kr/liter while the receipt shows the correct price. Connector emits `format: 'st1_truck'` with a `display_price_note`.
- **Region/store-cluster:** The low-price page says fuel prices vary daily across Swedish stations due to local competition, with price reports from the local market. Connector emits a local-market metadata row using `store_id: 'se:local-market-fuel'` and `region: 'se-local-market'`; it does not fabricate city-level petrol/diesel rows without station prices.
- **Station-specific non-fuel pricing:** ST1's EV charging price page publishes per-station kWh prices, including Mullsjö at 2,99 kr/kWh and Arvika at 5,79 kr/kWh in the checked source. Connector emits station-tagged EV rows for those concrete examples.
- **App-only/coupon-required prices:** The St1 Mobility page says the app provides app-unique offers from PLOQ and Välkommen in. Connector emits an app offer metadata row with `is_coupon_price: true`; it does not emit item prices because the ST1 page does not publish item-level offer amounts.
- **B2B/wholesale split:** The business list-price pages are for St1 Business-card customers and heavy traffic. Connector marks those rows as business and out of consumer connector scope.

## Quirks not codified

- **Subscription-required pricing:** No subscription price terms were found in the listed ST1 sources.
- **Time-of-day or close-to-close clearance:** No evening or daily clearance price pattern was found in the listed ST1 sources.
- **Bulk / volume pricing tiers:** No consumer multi-buy or volume-tier grocery pricing was found in the listed ST1 sources.
- **Service-counter vs packaged:** ST1's listed sources mention PLOQ and Välkommen in food stops, but do not publish counter-vs-packaged price examples.
