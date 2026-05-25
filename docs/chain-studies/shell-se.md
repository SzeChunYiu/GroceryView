# Shell (SE) pricing quirks

Primary sources: Shell.se pages for the Swedish network (`https://www.shell.se/` and `https://www.shell.se/betalningslosningar/shellkort/shell-privatkort.html`) and the St1-operated pages Shell.se points customers to (`https://st1.se/`, `https://st1.se/app-och-erbjudanden/st1-mobility`, `https://st1.se/privat/bonustian-kampanj`, `https://st1.se/foretag/foretag-tjanster/listpriser`, `https://st1.se/foretag/st1-business-kort-och-app/st1-business-kort`, and `https://st1.se/foretag/listpris-truck`).

## Source-backed findings

- **Brand/format status:** Shell.se says the Swedish station network has been rebranded and is operated by a new provider. St1.se says all Shell stations were rebranded to St1 and that 188 stations were added in 2025. Connector rows use `format: 'st1_rebranded_shell'` and the national `store_id` region tag for the documented Swedish network.
- **Online vs in-store:** The listed sources do not publish consumer online ordering prices for Shell/Select/PLOQ/Välkommen in food. No separate online grocery rows are emitted.
- **Dynamic fuel pricing:** St1.se says St1 makes about 1000 price checks daily, that the pump price is the price the customer pays, and that station pricing depends on world market prices, exchange rate, and local competition. Connector emits a store metadata row for local dynamic pump pricing.
- **Loyalty/app pricing:** The Shell Card Private page says St1 Mobility gives a **15 rabatt/liter** fuel discount on Shell and gives unique offers and discounts in PLOQ and Välkommen in! stores. The St1 Mobility page says app users can get app-unique offers from PLOQ and Välkommen in. Connector emits app rows with `is_member_price: true` and `is_coupon_price: true`.
- **Bonustian voucher tiers:** The St1 Bonustian page says a St1 Mobility fuel purchase gives 1 Bonustia worth 10 kr at 15 liters, 2 Bonustior worth 20 kr at 30 liters, and 3 Bonustior worth 30 kr at 45 liters. It says the voucher applies to PLOQ/Välkommen in products, excluding fuel, tobacco, lottery tickets, newspapers, and non-prescription medicines, and it cannot be combined with other discounts/coupons. Connector emits the documented tier as a `multi_buy` app coupon row.
- **Business/wholesale split:** St1 business list-price pages publish St1 Business list prices for light traffic and truck traffic. St1 Business card pages say the card can be used around St1/Shell networks and has no annual fee. Connector emits B2B metadata rows and marks them out of consumer grocery scope.
- **Truck-pump display quirk:** St1's truck list-price page says St1 Truck applies a weekly list price minus any discount for heavy-traffic St1 Business cards and that the diesel pump may show a fictional 1 kr/liter, while the receipt shows the correct price. Connector preserves this as a `display_price_note` metadata field, not as a consumer price row.
- **Food scope:** Shell.se and St1.se describe PLOQ/Välkommen in food, coffee, and fast-food offers, but the listed sources do not publish item-level food prices. Connector emits only app-offer/voucher metadata rows, not fabricated food item prices.

## Quirks not codified

- **ClubSmart points:** No active ClubSmart points pricing was found in the listed Shell.se/St1-operated sources. No ClubSmart row is emitted.
- **Region/store-cluster:** The listed sources document local competition as a pump-pricing factor but do not publish concrete regional price differences. No regional price delta is emitted beyond `store_id: 'se:national-rebranded-shell'`.
- **Subscription-required pricing:** No subscription price terms were found in the listed Shell.se sources.
- **Time-of-day/clearance:** No daily evening or close-to-close clearance pattern was found in the listed Shell.se sources.
- **Bulk/multi-buy food pricing:** No consumer "price per item when buying N+" food offer was found in the listed sources. The only coded tier is the documented Bonustian fuel-volume voucher.
- **Service-counter vs packaged:** No supermarket counter-vs-packaged food pricing was found in the listed Shell.se sources.
