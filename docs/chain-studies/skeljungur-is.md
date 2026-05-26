# Skeljungur IS Pricing Quirks

Study note date: 2026-05-25.

Primary sources checked:

- https://www.skeljungur.is/
- https://www.skeljungur.is/hafa-samband
- https://en.skeljungur.is/en/fuel-prices
- https://en.skeljungur.is/api/pricelistdata?date=2026-05-25
- https://verslun.skeljungur.is/products/shell-bensinbrusi-5l

## Public fuel list prices

Skeljungur publishes a fuel list-price page. The page states that the prices are list prices and do not account for special terms. On 2026-05-25, the page data endpoint returned list-price rows for Bensin 95 okt, Bensin 98 okt, Gasolia-Diesel, Lifdiesel, Flug bensin, JET A-1, Skipagasolia, MD olia, DMA olia, Svartolia blondud, and Metan.

Connector action: `packages/ingestion/src/connectors/skeljungur-is.ts` parses the public list-price endpoint into `domain:'fuel'` rows with `channel:'list_price'`, `is_member_price:false`, the source URL, the execution date, and the list-price disclaimer in provenance.

## Online vs store price evidence

The Skeljungur shop product page for `Shell Bensinbrusi 5L` shows `listaverd med VSK`, online availability (`Netverslun: Til a lager`), and store availability at Skutuvogur (`Verslun Skutuvogi: Til a lager`). The embedded variant data exposes the same ISK list price for the product variants.

Connector action: the product-page parser emits separate rows for `channel:'online'` and `channel:'store'`; the store row uses `store_id:'skeljungur-is-skutuvogur'`. No online/store price delta is emitted because the checked primary source exposes the same list-price data for both channels.

## Loyalty and special terms

Skeljungur presents `Vidskiptakort Skeljungs` as a business card that gives companies discounts on fuel, goods, and services with Skeljungur partners. The homepage says the card can be used for fuel at 70 Orkan stations, charging at Orkan rapid-charging multi-energy stations, and car washes at Lodur. The homepage lists partner examples including Klettur 15% discount on lubrication and tire service, Lodur 15% discount on car wash with the Skeljungur business card, and Dynjandi 10% discount on workwear in store. The contact page says Skeljungur customizes terms to the company's needs.

Connector action: no `is_member_price:true` rows are emitted for fuel or shop products because the checked primary sources do not expose item-level Skeljungur member prices. The fuel connector marks the public list prices as `is_member_price:false`.

## Format, region, subscription, app, coupon, clearance, and counter pricing

The checked Skeljungur sources do not expose consumer grocery formats, region-specific consumer product prices, subscription pricing, app-only prices, coupon prices, daily clearance prices, or service-counter versus packaged grocery prices.

Connector action: no `format`, `is_subscription_price:true`, `is_coupon_price:true`, `is_clearance:true`, or `channel:'counter'|'packaged'` rows are emitted.

## Bulk / volume tiers

The checked shop product page exposes unit-size variants for `STK`, `KASSI`, and `BRETTI`; the embedded data includes example quantities such as `12 STK` for `KASSI` and `192 STK` for `BRETTI`.

Connector action: the shop parser emits a `multi_buy` object when a variant quantity is greater than one, using the quantity from `qty_uom` and the variant's total list price.

## B2B / wholesale split

Skeljungur describes its business as serving companies and farmers with fuel, lubricants, cleaning and chemical products, fertilizer, and related services. The homepage and contact page describe company-specific terms through the Skeljungur business card and business contact flow.

Connector action: these B2B terms are documented but not emitted as consumer price rows unless a checked primary source exposes item-level prices that can be tied to those terms.
