# Willys pricing quirks study

Primary sources reviewed: Willys public site, Willys Plus/app pages, Willys store search/offline campaign APIs, and Willys Hemma store pages where exposed by the public store API.

## Findings codified in `packages/ingestion/src/connectors/willys.ts`

1. **Online and store prices are presented as the same Willys low-price model, but the API exposes separate surfaces.** Willys says customers can shop cheaply online and in store, and the public product API exposes `online` availability while campaign offers come from an offline/store campaign endpoint. Connector impact: base product rows now emit `channel: 'online'` when the product API marks the item online, while weekly campaign rows emit `channel: 'store'`.
   Sources: https://www.willys.se/artikel/ehandelsguide and `https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL`.

2. **Willys Plus is the loyalty price layer.** Willys Plus/app pages describe member offers and personal deals in the app. The Axfood campaign payload also labels loyalty promotions with `campaignType: 'LOYALTY'`. Connector impact: promotion rows with Willys Plus/Plus/LOYALTY signals emit `is_member_price: true`.
   Sources: https://www.willys.se/plus and Willys offline campaign API.

3. **Willys and Willys Hemma are distinct formats.** The public store API exposes store names; stores whose official name contains `Willys Hemma` are distinct from standard Willys stores. Connector impact: all-store product and campaign rows now emit `format: 'willys_hemma'` for Willys Hemma store names, otherwise `format: 'willys'`.
   Source: https://www.willys.se/axfood/rest/store

4. **Store/city is the only verified region tag in the reviewed public data.** The store API exposes store id and city. The reviewed sources do not publish a separate regional price table by Stockholm/Norrland or urban/rural clusters. Connector impact: all-store rows surface a normalized city `region` tag derived from the same store record as `storeId`; no synthetic regional price rows are created.
   Source: https://www.willys.se/axfood/rest/store

5. **Coupon/app-only prices require explicit coupon signals.** Willys Plus and app material describe app/personal offers, and campaign payloads can carry condition/reward copy. Connector impact: rows only emit `is_coupon_price: true` when public campaign text contains coupon/kupong/rabattkod/kod wording.
   Sources: https://www.willys.se/plus and Willys offline campaign API.

6. **Multi-buy tiers are explicit campaign text, not inferred.** Willys campaign labels can contain wording such as `3 för 79 kr`. Connector impact: weekly campaign rows parse explicit `N för X kr` text into `multi_buy: { quantity, price }`.
   Source: Willys offline campaign API.

## Quirks not codified

- **Subscription/member-required pricing beyond Willys Plus:** No reviewed primary source published a paid subscription that unlocks Willys prices. Connector rows set `is_subscription_price: false`.
- **Daily close-to-close clearance:** No reviewed primary source published an evening or close-to-close Willys clearance pricing rule. Connector rows set `is_clearance: false`.
- **Service-counter vs packaged:** The reviewed public Willys sources do not publish separate cheese/charcuterie counter prices versus packaged prices. No `counter` channel is emitted.
- **B2B/wholesale split:** The reviewed Willys sources are consumer shopping and campaign sources. No restaurant/café wholesale price list was found in scope, so no B2B rows are emitted.
