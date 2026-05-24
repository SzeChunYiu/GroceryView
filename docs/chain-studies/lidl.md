# Lidl SE pricing quirks study

Sources used: lidl.se public offer/product pages, Lidl Plus pages on lidl.se, and current/archived flyer-week pages linked from lidl.se. Claims below are limited to those sources.

## Findings to codify

1. **Online vs in-store.** The public Lidl SE offer/product pages observed for this study state `I butik` with validity windows (example: Ramlösa `2 FÖR: 22:-`, `I butik 09/06 - 15/06`: https://www.lidl.se/p/ramlosa-kolsyrat-mineralvatten/p10031399). Lidl Plus terms for Click & Collect say reservations are non-binding and do not create a right to buy the product at a specific price; product availability is tied to the selected store (https://www.lidl.se/c/lidl-plus-allmanna-villkor/s10017058). I found no primary-source Lidl SE grocery checkout price that is a separate online-order price, so the connector should mark scraped public offer rows as `channel: 'store'` and should not synthesize online rows.

2. **Loyalty program.** The program is **Lidl Plus**. Lidl says weekly Lidl Plus offers are selected favorites and are redeemed automatically when the customer scans the Lidl Plus card at checkout; use requires downloading the Lidl app and active Lidl Plus membership (https://www.lidl.se/c/lidl-plus-erbjudanden/s10017715). The current Lidl Plus offer page shows examples with normal crossed prices and `Med Lidl Plus`, e.g. red pepper 44.90 to 29.90/kg (-33%) and salmon 66.15 to 52.90 (-20%) on 18/5-24/5 (https://www.lidl.se/c/lidl-plus-erbjudanden/a10094682). Connector rows backed by `currentLidlPlusPrice` must emit `is_member_price: true`.

3. **App-only / coupon-required prices.** Lidl's coupon page says weekly coupons provide exclusive discounts for Lidl Plus members, must be activated in `Mina kuponger`, and redeem automatically when the Lidl Plus card is scanned; use requires the Lidl app and active membership (https://www.lidl.se/c/lidl-plus-kuponger/s10017713). The Lidl Plus offer page includes a concrete coupon example: BELBAKE Strösocker, `Kupong -23%`, 16.90 for 2 kg on 18/5-24/5 (https://www.lidl.se/c/lidl-plus-erbjudanden/a10094682). Connector rows whose Lidl Plus promotion text contains `Kupong` must emit `is_coupon_price: true`.

4. **Bulk / volume pricing tiers.** Lidl public product pages show explicit multi-buy offers. Ramlösa mineral water is listed as `2 FÖR: 22:-` for 1.5 l/förp. in store 09/06-15/06 (https://www.lidl.se/p/ramlosa-kolsyrat-mineralvatten/p10031399). Monster energy drink is listed as old price 33:- and `2 FÖR: 25:-` for 50 cl/förp. in store 03/11-09/11 (https://www.lidl.se/p/monster-energidryck/p10038041). Connector rows with promotion text matching `N FÖR` must emit a `multi_buy` promotion object.

5. **Region / store-cluster.** Lidl states that local deviations may occur on Lidl Plus coupon/offer pages (https://www.lidl.se/c/lidl-plus-kuponger/s10017713). The connector already carries `regions` from Lidl's embedded region-pricing payload and store-specific `storeId` when expanding store offers. No new region field is added in this change because the public source reviewed here did not expose a concrete named regional price delta.

## Findings not codified

- **Format / sub-brand:** no primary-source Lidl SE evidence found for different consumer price levels by store format under Lidl SE.
- **Subscription / membership-required pricing beyond Lidl Plus:** no paid subscription price was found. Lidl Pay is a mobile payment method in Lidl Plus, not a grocery-price subscription (https://www.lidl.se/c/lidl-plus-lidl-pay/s10042241).
- **Time-of-day or close-to-close clearance:** no official daily evening/clearance pricing rule was found in the listed sources.
- **Service-counter vs packaged:** no Lidl SE public source reviewed here exposed a separate counter-vs-packaged price for the same item.
- **B2B / wholesale split:** no Lidl SE consumer source reviewed here exposed restaurant/cafe wholesale pricing mixed into the consumer offer inventory.
