# Shell (SE) pricing quirks

Primary sources: Shell.se pages for the Swedish network (`https://www.shell.se/`), St1-operated business list prices (`https://www.shell.se/foretagskund/listpriser.html`), Shell Card Private sunset (`https://www.shell.se/betalningslosningar/shellkort/shell-privatkort.html`), truck diesel card (`https://www.shell.se/foretagskund/shell-truckdieselkort.html`), and station pages (`https://www.shell.se/bensinstationer.html`).

## Source-backed findings

- **Brand/format status:** Shell.se says all Shell stations in Sweden have been rebranded to St1, and that St1's Swedish station network is now about 450 St1 stations after 188 Shell stations were rebranded. Connector rows therefore use `format: 'st1_rebranded_shell'` and `store_id` region tags only for the documented Swedish network rather than active Shell-branded grocery stores.
- **Online vs in-store:** Shell.se does not publish consumer online ordering prices for Select/PLOQ food. No separate online grocery rows are emitted.
- **Loyalty/app pricing:** The Shell Card Private page says the St1 Mobility app can be used at both St1 and Shell and gives a **15 öre/liter** fuel discount on Shell. It also says the app gives unique offers and discounts in PLOQ and Välkommen in! stores. Connector emits an app fuel member row with `is_member_price: true` and `is_coupon_price: true` because the concrete 15 öre/liter app discount is documented.
- **Business/wholesale split:** Shell.se business pages point business customers to St1 list prices. The truckdiesel page says invoices show list price, discount, and net price. Connector emits a `customer_segment: 'business'` B2B list-price metadata row and marks it out of consumer grocery scope.
- **Truck-pump display quirk:** Shell.se says St1 Truckstation pumps may show a fictional 1 kr/liter pump display for St1 Business/Shell TruckDieselkort high-value fills, while receipt/invoice show the actual pump/list/net price. Connector preserves this as a `display_price_note` metadata field, not as a consumer price row.
- **Food scope:** Shell.se station/private-customer pages describe Select/PLOQ/Välkommen in food/coffee/fast-food offers, but the listed sources do not publish item-level food prices. Connector does not fabricate food rows.

## Quirks not codified

- **Region/store-cluster:** Shell.se documents the number of Swedish stations and truck-adapted stations but not regional price differences. No regional price delta is emitted beyond `store_id: 'se:national-rebranded-shell'`.
- **Subscription-required pricing:** No subscription price terms were found in the listed Shell.se sources.
- **Time-of-day/clearance:** No daily evening or close-to-close clearance pattern was found in the listed Shell.se sources.
- **Bulk/multi-buy:** No consumer multi-buy food offer was found in the listed Shell.se sources.
- **Service-counter vs packaged:** No supermarket counter-vs-packaged food pricing was found in the listed Shell.se sources.
