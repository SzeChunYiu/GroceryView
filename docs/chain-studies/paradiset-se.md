# Paradiset SE pricing quirks study

Primary source required for this study: `paradiset.se`.

Study date: 2026-05-24.

## Primary-source availability

`paradiset.se` and `www.paradiset.se` did not resolve from the study environment on 2026-05-24. No current primary-source product listing, membership terms, store page, campaign page, or pricing page from `paradiset.se` was available to verify chain pricing quirks.

Because the ticket requires claims to be verifiable from the listed source only, no pricing quirk is codified for Paradiset SE in this pass.

## Required quirk coverage

1. Online vs in-store: not verifiable from `paradiset.se`; no `channel:'online'|'store'` rows are emitted.
2. Loyalty program: not verifiable from `paradiset.se`; no `is_member_price:true` rows are emitted.
3. Format / sub-brand: not verifiable from `paradiset.se`; no `format` field is emitted.
4. Region / store-cluster: not verifiable from `paradiset.se`; no store-region pricing tag is emitted.
5. Subscription / membership-required pricing: not verifiable from `paradiset.se`; no `is_subscription_price:true` rows are emitted.
6. App-only / coupon-required prices: not verifiable from `paradiset.se`; no `is_coupon_price:true` rows are emitted.
7. Time-of-day / close-to-close clearance: not verifiable from `paradiset.se`; no `is_clearance:true` rows are emitted.
8. Bulk / volume pricing tiers: not verifiable from `paradiset.se`; no `multi_buy` promotion rows are emitted.
9. Service-counter vs packaged: not verifiable from `paradiset.se`; no `channel:'counter'|'packaged'` rows are emitted.
10. B2B / wholesale split: not verifiable from `paradiset.se`; no consumer connector handling is emitted.

## Connector decision

`packages/ingestion/src/connectors/paradiset-se.ts` keeps Paradiset SE ingestion fail-closed when the primary source is unavailable and emits only plain price rows from explicit product JSON supplied to the connector. It does not infer or synthesize any quirk fields.
