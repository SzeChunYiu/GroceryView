# GroceryView developer privacy notes

This document is for engineers and operators. It complements the public `/privacy` page by describing where GroceryView stores shopper data and what retention assumptions code changes must preserve.

## Data we store

- **Preferences:** locale, dietary filters, favorite brands, nearby chains, notification quiet hours, saved-search options, and consent choices.
- **Watchlist and alerts:** watched product ids, target prices, alert channel preferences, notification history, and best-time-to-buy alert state.
- **Basket and list data:** shopping-list rows, checked state, shared-list tokens, basket comparison inputs, and optional household planning settings.
- **Account-linked workflow data:** receipt scan metadata, price reports, review assignments, and audit metadata needed to prove a human reviewed shopper-submitted evidence.

Do not add free-text fields that can collect sensitive personal data unless a ticket explicitly adds product requirements, validation, and retention rules.

## Storage locations

- **Postgres:** durable account data such as saved searches, watchlists, alert preferences, lists, receipts, price reports, review assignments, and audit/writeback records.
- **Cookies:** session, locale, and consent state. Cookies must not contain raw basket contents, receipts, access tokens, or price-report evidence.
- **localStorage/sessionStorage:** browser-local UX state such as checked shopping-list rows, draft filters, demo access tokens, and client-only preferences. Treat this as user-controlled cache; never rely on it as the only audit record.

## Retention expectations

- Keep account preferences, watchlists, and baskets until the user deletes them or closes the account.
- Keep operational audit records for price reports, reviewer actions, and notification sends long enough to investigate abuse, billing, and GDPR access/deletion requests.
- Expire anonymous browser-only state when the browser clears storage; do not server-sync it without explicit consent and account binding.
- Deletion flows must remove or anonymize account-bound preferences, watchlists, baskets, receipts, and reports unless a legal or fraud-prevention hold applies.

## GDPR alignment

- Data minimization: store only fields needed for price alerts, grocery planning, review integrity, billing, or safety.
- Purpose limitation: do not reuse watchlist, basket, or receipt data for ads or unrelated profiling without a separate consent path.
- Access and portability: account export code should include preferences, alerts, lists, baskets, receipt metadata, and review/report records.
- Erasure: deletion code must cover Postgres records and invalidate cookies; localStorage cleanup instructions should be exposed in the UI when browser state cannot be deleted server-side.
- Auditability: any new table containing user data needs an owner, retention note, and deletion/export handling before launch.

## Engineering checklist

Before shipping a feature that touches user data, confirm:

1. The data category above is updated if a new kind of user data is introduced.
2. Storage is intentional: Postgres for durable account state, cookies for small session/consent state, localStorage for disposable browser state.
3. Retention and deletion behavior are documented in code or operational docs.
4. Public copy does not promise stronger privacy guarantees than the implementation provides.
