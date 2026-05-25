# Goodstore SE pricing quirks

Study date: 2026-05-25. Sources were limited to `goodstore.se` pages.

## Source-backed findings

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs store | Goodstore presents an online shop with DHL-service-point delivery and also identifies a physical Stockholm shop at Åsögatan 116. The online delivery terms exclude chilled or fragile goods from DHL delivery. Product pages may also mark an item as store-only, e.g. Potatischips Olivolja 100g Trafo Eko is listed at 39,95 SEK and marked `Endast i butik`. | `channel` is `online` unless the page text contains a store-only marker, in which case it is `store`. Store-only rows do not receive online shipping fields. |
| Loyalty program | Goodfriends membership is sold in the Åsögatan 116 shop. Goodstore states that online members must request personal discount codes before purchase. The online discount is 3% below 1000 SEK and 10% above 1000 SEK, counted excluding shipping. The discount cannot be combined with other offers or gift cards. | Optional Goodfriends rows are emitted with `is_member_price`, `is_coupon_price`, `membershipProgram`, and `membershipDiscountPercent`. |
| Format / sub-brand | Goodstore describes itself as an independent store and gives one physical shop address: Åsögatan 116, 116 24 Stockholm. | Rows carry `format: single_store_webshop`, `store_id: goodstore-se-stockholm-asogatan-116`, and `region: stockholm`. |
| Region / store cluster | The published shop address is Stockholm; no other Goodstore store cluster was found in the reviewed pages. | Rows use the Stockholm region and the Åsögatan store id. |
| App / coupon prices | Goodfriends online benefits are applied with generated personal discount codes in checkout. | Goodfriends rows set `is_coupon_price: true`. |
| Bulk / volume | The homepage showed `Sweet Ps Jordnötter Choklad 150g - KÖP 2 SPARA 20KR!` at 49,95 SEK. | Product names matching `KÖP <n> SPARA <amount>KR` populate `multi_buy`. |

## Reviewed examples

- Home page: Goodstore says it has a Stockholm shop at Åsögatan 116, offers online shopping with DHL service-point delivery, charges 79,95 kr shipping, and shows free shipping above 999 kr. It also showed the Sweet Ps multi-buy promotion at 49,95 SEK. Source: https://www.goodstore.se/
- Terms page: Goodstore states a 300 kr minimum order excluding shipping, gives the Åsögatan 116 physical shop address, and lists DHL delivery at 79,95 SEK within Sweden. It also says chilled or fragile goods cannot use that delivery method. Source: https://www.goodstore.se/villkor-info.html
- Goodfriends page: Goodstore documents a 99 kr one-time membership, in-store registration at Åsögatan 116, online discount-code usage, 3% online discount under 1000 kr, and 10% online discount over 1000 kr excluding shipping. Source: https://www.goodstore.se/goodfriends.html
- Online-orderable product example: Ugnsrengöring 500ml Ecover was listed at 79,95 SEK with stock, immediate delivery, quantity controls, and a buy button. Source: https://www.goodstore.se/hushall/ugnsrengoring-500ml-ecover.html
- Store-only product example: Potatischips Olivolja 100g Trafo Eko was listed at 39,95 SEK, article 1003771, and marked `Endast i butik`; its comparable price was SEK 400. Source: https://www.goodstore.se/choklad-godis-bars-snacks/potatischips-olivolja-100g-trafo-eko.html

## No codified row changes from the reviewed pages

- Subscription prices: no subscription pricing example was found in the reviewed Goodstore pages.
- Clearance prices: the reviewed terms mention missing items can result from short dates, but no short-date or clearance price example was found.
- Counter vs packaged: the home page mentions a café, but no café/counter price row example was found.
- B2B / wholesale prices: Goodfriends membership terms say membership can be held by private individuals and not companies; no business or wholesale price row example was found.
