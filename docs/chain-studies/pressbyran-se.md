# Pressbyrån SE pricing quirks study

Sources used: Pressbyrån `Handla hos oss`, Pressbyrån app terms, Pressbyrån glass campaign page, Pressbyrån @work, and Reitan Convenience Sweden company page.

## Primary-source findings

1. **Online vs in-store.** Pressbyrån says it has physical stores and an online shop for ordering newspapers/magazines. The public Pressbyrån pages reviewed do not publish a product-level online-vs-store price delta, so the connector may emit `channel: 'online'` only when a row comes from the magazine webshop and `channel: 'store'` for ordinary store rows; it must not synthesize paired prices without both observed prices.
2. **Loyalty / app offers.** Pressbyrån names `Pressbyrån Kompis` and says the app contains offers usable in store. The app terms say a user can receive offers and discounts in the app, card registration can earn stamps on selected goods, and multiple stamps can generate an offer. Therefore app-offer rows can set `is_member_price: true` and `is_coupon_price: true` when the observed row is gated by the app account/offer.
3. **Format / sub-brand.** Reitan Convenience Sweden lists Pressbyrån, 7-Eleven and Pressbyrån PBX as separate brands; the reviewed Pressbyrån pages do not verify a shared 7-Eleven loyalty price, so no 7-Eleven member flag is codified. Pressbyrån @work is a workplace fridge format filled by the nearest Pressbyrån store and paid by app. The reviewed sources do not publish same-SKU price levels across Pressbyrån/PBX/@work, so the connector records `format` only when the source labels the row as `pressbyran`, `pbx`, or `pressbyran-work`.
4. **Region / store cluster.** The reviewed pages describe stores nationally and a campaign in all stores nationwide; they do not verify regional price clusters. Do not add region-specific prices unless a source row carries a concrete store/region.
5. **Subscription / membership-required pricing.** No paid subscription price was found. App account offers are covered as member/coupon rows, not subscription rows.
6. **App-only / coupon-required prices.** Digital coupons and app offers are explicitly listed by Pressbyrån. Rows from those sources set `is_coupon_price: true`.
7. **Time-of-day clearance.** No source verified an evening or close-to-close clearance pattern. Do not emit `is_clearance: true` from this study.
8. **Bulk / volume pricing tiers.** The glass campaign lets customers pre-order whole boxes and gives half price on all ice cream during the campaign, including delivery in about 135 stores via Wolt, Foodora and Uber Eats. The page does not publish an N+ unit-price ladder, so do not emit a `multi_buy` tier unless a future source contains that explicit structure.
9. **Service-counter vs packaged.** No service-counter pricing was found for Pressbyrån.
10. **B2B / wholesale.** Pressbyrån offers company orders for physical/digital coupons and Pressbyrån @work for workplaces. These are documented as business channels; they are out of scope for the consumer connector unless the row source is explicitly workplace/coupon inventory.
