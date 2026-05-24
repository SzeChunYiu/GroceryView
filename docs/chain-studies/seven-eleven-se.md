# 7-Eleven Sweden pricing quirks study

Primary sources reviewed: 7-eleven.se assortment, Click and Collect terms, app landing page, app membership terms, corporate ordering page/terms, and contact/privacy pages.

## Verified quirks to codify

1. **Online vs in-store / Click and Collect**
   - Click and Collect runs at `shop.7-eleven.se`; customers choose a store, pickup time, products, and pay through Klarna before pickup.
   - The terms state that current prices are shown in the service, include VAT, and that RCS does not guarantee those service prices follow in-store prices. Therefore the connector must keep Click and Collect rows as `channel: 'online'` and in-store rows as `channel: 'store'`; if both price points are present for the same item, emit both rows.
   - Product categories explicitly covered by the Click and Collect source are fika, bake-off, food, drink, snacks, confectionery, and other selected assortment items.

2. **Loyalty / membership / app coupons**
   - The loyalty program is **The Corner Club**. Membership starts by downloading the 7-Eleven app and creating an account.
   - Public requirements: private persons aged 16+; children under 18 need guardian consent.
   - Benefits are selected/app-scoped, not every item: app deals on food, snacks (`mellis`) and fika; discounts/member offers; partner offers; referral app-deals; stamp-card Treats.
   - Redemption mechanism: member discounts and offers are loaded in the app and redeemed by scanning the specific app-coupon QR code at checkout. Connector rows sourced from these offers must set `is_member_price: true` and `is_coupon_price: true`.
   - Stamp-card terms: purchases below 15 SEK and purchases only containing tobacco, nicotine, alcohol, games/lottery, medicines, mediated services, or gift cards do not generate stamps. Stamps are not direct item prices, so they are documented but not emitted as a product price unless a concrete app-coupon price exists.

3. **Format / sub-brand**
   - The public assortment page lists food prices, but states that assortment deviations may occur and that the listed prices do not apply in airport stores. Connector rows must carry `format: 'standard'` for normal public assortment rows and preserve `format: 'airport'` when a source row is explicitly from an airport store. Do not apply standard public prices to airport rows.

4. **Region / store-cluster**
   - Click and Collect availability and assortment vary by the selected pickup store. The source does not publish a region-price table. Surface the store id plus an optional `region_tag` from the chosen store/source metadata; do not infer Stockholm/rural deltas without source rows.

5. **Subscription pricing**
   - No subscription that unlocks separate consumer prices was verified in the listed sources. Emit `is_subscription_price: false` by default and only set true if a future official source row explicitly contains subscription terms.

6. **App-only / coupon-required prices**
   - App deals and member offers are verified. Rows from app coupons must be flagged with `is_coupon_price: true`.

7. **Time-of-day / close-to-close clearance**
   - The listed sources do not verify a daily evening/end-of-day fresh-food discount. Skip `is_clearance: true` unless a future official source row explicitly states a clearance or time-of-day discount.

8. **Bulk / volume pricing tiers**
   - The terms allow member offers to be an extra item, gift, or similar, but the listed sources reviewed here do not publish a concrete `buy N` unit price tier. Do not emit `multi_buy` from the current connector until an official source row explicitly provides the tier.

9. **Service-counter vs packaged**
   - No service-counter vs packaged price split was verified for 7-Eleven SE in the listed sources. Do not emit counter or packaged channel rows from the current connector.

10. **B2B / wholesale split**
    - Corporate ordering exists for workplace breakfast/lunch/fika, with prices shown on the website or other sales channels and final price in the order confirmation. It is B2B and invoice-based, so it is out of scope for the consumer connector unless mixed into consumer inventory.

## Source URLs

- https://7-eleven.se/vart-sortiment/
- https://7-eleven.se/anvandarvillkor/click-and-collect-tos/
- https://7-eleven.se/ladda-ner-appen/
- https://7-eleven.se/kontakt/behandling-av-personuppgifter/appar/
- https://7-eleven.se/foretagsbestallningar/
- https://7-eleven.se/kontakt/behandling-av-personuppgifter/anvandarvillkor-for-foretagsbestallning-pa-7-eleven-se/
