# 7-Eleven SE pricing quirks

Study date: 2026-05-25. Sources were limited to `7-eleven.se`.

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs in-store | The Click and Collect terms say the service lets customers order fika, bake-off, food, drinks, snacks, confectionery, and other assortment products from `shop.7-eleven.se` for pickup in the selected store. The same terms state that RCS does not guarantee that Click and Collect product prices follow in-store prices. No concrete same-SKU online and store price pair was published in the checked sources. | Click and Collect evidence emits an `online` metadata row for the possible price split, but no synthetic same-SKU store row is emitted without a concrete in-store price. |
| Loyalty program | The app page names `The Corner Club` and says users get a free coffee after downloading/registering, collect stamps, choose Treats, and get exclusive app deals on food, snacks, and fika. The app terms say membership starts when the user downloads the 7-Eleven app and creates an account. | The app-deals row emits `is_member_price: true`, `membershipProgram: 'The Corner Club'`, and `channel: 'app'`. |
| Format / sub-brand | The checked 7-eleven.se pages describe 7-Eleven stores and Click and Collect but do not publish price tiers by store format or sub-brand. | Rows use `format: 'seven_eleven'`; no unverified format tier is emitted. |
| Region / store-cluster | The checked pages did not publish regional or store-cluster price differences. | Rows use national evidence IDs such as `store_id: 'se:national-seven-eleven'`; no regional price delta is emitted. |
| Subscription / membership-required pricing | The checked pages document free app membership and app/Treat benefits. They do not document a paid subscription that unlocks product prices. | Rows set `is_subscription_price: false`. |
| App-only / coupon-required prices | The app terms say members can receive discounts and offers loaded in the 7-Eleven app and redeem them by scanning the specific App coupon QR code at a 7-Eleven checkout. Treats can become free or discount App coupons. | App rows emit `is_coupon_price: true`. |
| Time-of-day or close-to-close clearance | The checked 7-eleven.se pages did not verify a daily end-of-day, close-to-close, short-date, or clearance discount. | Rows set `is_clearance: false`; no clearance row is emitted. |
| Bulk / volume pricing tiers | The checked 7-eleven.se pages did not publish a `buy N for X kr` or price-per-item-when-buying-N tier. | Rows set `multi_buy: null`. |
| Service-counter vs packaged | The checked food and fika pages describe in-store baked goods and prepared food but do not publish a same-product counter-vs-packaged price split. | No `channel: 'counter'` or `channel: 'packaged'` row is emitted. |
| B2B / wholesale split | The existing 7-Eleven connector parses the official business-order assortment PDF linked from `7-eleven.se/foretagsbestallningar/`. Those rows are business-order evidence, not consumer shelf-price evidence. | Assortment PDF rows emit `channel: 'b2b'`, `customerSegment: 'business'`, `store_id: 'se:national-seven-eleven-b2b'`, and `out_of_scope_for_consumer_connector: true`. |

Reviewed examples:

- App page: documents The Corner Club, free coffee after registration, stamps/Treats, exclusive app deals, and app availability. Source: `https://7-eleven.se/ladda-ner-appen/`
- App terms: documents The Corner Club membership, 16+ rule, member discounts/offers in the app, App coupon QR redemption, Treats, stamp limits, VIP after 22 stamps in 3 months, and 21-day coupon validity. Source: `https://7-eleven.se/kontakt/behandling-av-personuppgifter/appar/`
- App FAQ: documents account creation for app offers, automatic stamps, 15 kr minimum qualifying purchase, max 4 stamps per day, 1 stamp per 30 minutes, 7th/11th stamp Treats, and Treat coupon redemption. Source: `https://7-eleven.se/ladda-ner-appen/faq/`
- Click and Collect terms: documents pickup ordering through `shop.7-eleven.se`, possible divergence from in-store prices, and discount coupons/codes in the service. Source: `https://7-eleven.se/anvandarvillkor/click-and-collect-tos/`
- In-store pages: document store food, fika, drinks, services, and that some assortment varies by store; they do not publish region/store price deltas, clearance terms, or counter-vs-packaged same-SKU prices. Sources: `https://7-eleven.se/i-butiken/`, `https://7-eleven.se/i-butiken/fika/`, `https://7-eleven.se/i-butiken/produkter-tjanster/`
- Business orders: the connector uses the linked B2B assortment PDF from `https://7-eleven.se/foretagsbestallningar/`.

Not codified because not verified from the listed sources:

- Exact online-vs-store price deltas for the same SKU.
- Regional or store-cluster price differences.
- Store-format price tiers.
- Paid subscription product prices.
- Daily end-of-day fresh-food clearance.
- Explicit multi-buy tiers.
- Service-counter versus packaged price splits.
- Consumer prices from the B2B assortment PDF.
