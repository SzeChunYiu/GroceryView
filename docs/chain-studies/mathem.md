# Mathem Sweden pricing quirks study

Primary sources reviewed: mathem.se product/search pages, Mathem home-delivery page, free-delivery page, support articles for delivery cost, shopping flow, delivery address, and delivery-time reservation.

## Verified quirks to codify

1. **Online vs in-store**
   - Mathem is an online/app grocery flow. The support article for shopping says customers shop online or in the app, choose a delivery time, and then product availability and prices for the selected delivery day are updated. No physical in-store consumer price list was verified. Connector rows should emit `channel: 'online'` and must only emit `channel: 'store'` if a future primary source provides a separate physical-store price.

2. **Loyalty program**
   - No named loyalty program with member-only item prices was verified in the listed sources. The connector sets `is_member_price: false` unless a future official source row explicitly marks a member price.

3. **Format / sub-brand**
   - No consumer store-format split comparable to ICA Maxi/Nära was verified. Connector rows use `format: 'online_grocery'`.

4. **Region / store-cluster**
   - Mathem delivery coverage is address-based and includes large areas such as Stockholm, Göteborg, Malmö, and other localities. The shopping flow and address articles state that delivery times, product availability, prices, and fees are based on the selected/default delivery address. Connector runs may pass a `region_tag` and `store_id`/delivery-zone id from the selected source context; do not infer regional price deltas without source rows.

5. **Subscription / membership-required pricing**
   - A Mathem meal-kit product page says prova-på price applies only when subscribing to the meal-kit subscription and that the subscription can be ended. The current product search connector does not parse meal-kit subscription prices, so regular grocery rows set `is_subscription_price: false` unless the source row explicitly includes subscription terms.

6. **App-only / coupon-required prices**
   - The free-delivery page says the app contains offers, news, lists, tips, tools and recipes, but no app-only product price was verified from the listed sources. Connector rows set `is_coupon_price: false` unless a source row explicitly requires a coupon.

7. **Time-of-day / close-to-close clearance**
   - No daily evening or close-to-close clearance pattern was verified. Connector rows set `is_clearance: false` unless source rows explicitly state clearance.

8. **Bulk / volume pricing tiers**
   - Mathem product listing pages can show volume offers such as `2 för 30 kr`. Connector rows should surface such source text as `multi_buy` when present.

9. **Service-counter vs packaged**
   - No service-counter vs packaged consumer price split was verified for Mathem. Do not emit counter/packaged channel rows.

10. **B2B / wholesale split**
    - Delivery fees differ for business customers versus private customers according to the home-delivery page. The consumer product connector remains online-consumer scoped; business delivery fees are documented but not mixed into consumer rows.

## Delivery fee quirks

- Delivery fee can vary by delivery time, delivery method, delivery interval length, and delivery address.
- Home-delivery page states delivery fees can start at 0 kr; average private-customer fee is 20 kr; highest cost is 99 kr; same-day delivery costs 29–119 kr; business-customer fees are higher.
- Small-basket fees can apply based on order value and are listed as 0–99 kr.
- New customers can get free delivery for 98 days if they order at least 800 kr at least every other week; same-day deliveries are excluded.

## Source URLs

- https://www.mathem.se/se/about/hemleverans/
- https://www.mathem.se/se/about/gratis-leverans/
- https://support.mathem.se/sv/articles/15-vad-kostar-det-att-fa-varorna-levererade
- https://support.mathem.se/sv/articles/34-hur-handlar-jag-pa-mathem
- https://support.mathem.se/sv/article/68f403
- https://support.mathem.se/sv/article/dca02b
- https://www.mathem.se/se/products/13540-mathem-i-sverige-inspirationskasse-2-personer/
- https://www.mathem.se/se/products/brand/3791-lowcaly/
