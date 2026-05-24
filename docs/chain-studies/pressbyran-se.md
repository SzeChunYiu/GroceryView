# Pressbyrån SE pricing quirks study

Primary sources reviewed: pressbyran.se Pressbyrån Kompis/app, membership terms, student offer, ice-cream campaign, Tidningsbutiken pages, company privacy/about pages, business orders, coupon-store terms, and Pressbyrån @work pages.

## Verifiable findings

1. Online vs in-store: Pressbyrån states that it has physical stores plus an online shop for newspapers/magazines: https://www.pressbyran.se/handla-hos-oss/ and https://www.pressbyran.se/handla-hos-oss/lasa/. I found no primary-source page stating that the same grocery/convenience SKU has a different web price versus store price. Connector action: emit `channel:'online'` only for rows sourced from the newspaper webshop, otherwise `channel:'store'` or `channel:'delivery'` when the source explicitly names delivery.
2. Loyalty program: Pressbyrån Kompis is the customer club in the Pressbyrån app. Members can receive discounts/member offers and redeem app coupons by scanning QR codes in store. Sources: https://www.pressbyran.se/medlemsvillkor/ and https://www.pressbyran.se/handla-hos-oss/pressbyransapp/. Connector action: app/member/coupon rows emit `is_member_price:true` and `is_coupon_price:true` when the source text mentions Kompis, member offer, app coupon, QR coupon, or reward coupon.
3. Format/sub-brand: Reitan Convenience Sweden states it runs Pressbyrån, PBX, and 7-Eleven brands: https://www.pressbyran.se/kontakt/behandling-av-personuppgifter/. I found no primary source showing a Pressbyrån-vs-PBX price ladder for the same item. Connector action: do not emit a non-default `format` until a concrete price example exists.
4. Region/store cluster: I found no primary-source country-region price rule for Pressbyrån. Connector action: keep `store_id`/region unset unless a store-specific source row provides it.
5. Subscription/membership-required pricing: Pressbyrån Kompis requires the app/account for member benefits, but I found no paid subscription price tier. Connector action: always emit `is_subscription_price:false` for these rows.
6. App-only/coupon-required prices: Pressbyrån says app rewards are redeemed as QR app coupons in store, and the Kompisfika example requires scanning the personal QR code. Sources: https://www.pressbyran.se/medlemsvillkor/ and https://www.pressbyran.se/handla-hos-oss/pressbyransapp/. Connector action: mark these as `is_coupon_price:true`.
7. Time-of-day/close-to-close clearance: The Kompisfika example is time-windowed on Tuesdays 15-16, but it is a member coupon/offer, not a clearance discount. I found no daily close-to-close clearance source. Connector action: keep `is_clearance:false` unless a source explicitly says clearance.
8. Bulk/volume tiers: The ice-cream campaign says customers can buy whole boxes and use a downloadable order form; it also states all ice cream was half price during the campaign and delivery was available via Wolt/Foodora/Uber Eats for about 135 stores. Source: https://www.pressbyran.se/handla-hos-oss/ata/glass-godis/halva-priset-pa-all-glass/. Connector action: rows from this campaign can emit `multi_buy:{type:'case_preorder'}` and `channel:'delivery'` when the source mentions the delivery apps.
9. Service-counter vs packaged: I found no source for service-counter pricing at Pressbyrån. Connector action: do not emit `channel:'counter'`.
10. B2B/wholesale split: Pressbyrån has business orders, digital coupon shop terms, gift cards, and Pressbyrån @work workplace fridges. Sources: https://www.pressbyran.se/handla-hos-oss/foretagsbestallningar/, https://www.pressbyran.se/kupongbutiken/allmanna-villkor-for-kupongbutiken/, and https://www.pressbyran.se/pressbyran-work/. These are business/coupon/workplace services, not consumer shelf prices for the public connector. Connector action: keep consumer rows separate; only emit `channel:'b2b_coupon'` for explicit business coupon rows.

## Codified examples

- `Kompisfika`/app reward text justifies `is_member_price:true` and `is_coupon_price:true`.
- Student coffee/Nocco offer source justifies `promotion_type:'student'` for student rows: https://www.pressbyran.se/handla-hos-oss/kaffe-fikabrod/kaffe/studenterbjudande/.
- Ice-cream campaign source justifies `multi_buy.type:'case_preorder'`, campaign discount rows, and delivery-channel rows when Wolt/Foodora/Uber Eats are named.
