# GroceryView Developer Privacy Notes

This document is the developer-facing privacy implementation guide for
GroceryView. It is intentionally different from the public `/privacy` page: the
public page explains user-facing rights and controls, while this file tells
engineers what data the product stores, where it is stored, how long it should
live, and which GDPR constraints must be preserved when adding features.

## Scope and data classes

GroceryView stores grocery-planning data only when it is needed for price
comparison, alerts, account controls, or operational evidence. Treat the rows
below as account data whenever they are tied to a user id, session, household,
device, or share token.

| Data class | Examples | Primary code paths | Privacy notes |
| --- | --- | --- | --- |
| Preferences | preferred currency, preferred stores, notification channels, language preference | `apps/api/src/settings/settings.service.ts`, `apps/web/src/components/language-preference-switcher.tsx` | Account preferences are saved in Postgres when authenticated; local/browser preferences must remain non-sensitive. |
| Watchlist and favourites | watched product ids, target prices, deal-score thresholds, favorite-store-only flags, allowed price types | `apps/api/src/watchlists/watchlists.service.ts`, `apps/api/src/favorites/favorites.service.ts`, `apps/web/src/app/watchlist/page.tsx` | User intent and shopping habits; never expose across accounts. |
| Basket and shopping list | saved basket rows, weekly baskets, local list items, imported clipboard rows, checked state | `apps/api/src/baskets/baskets.controller.ts`, `apps/web/src/hooks/useList.ts` | Basket contents can reveal household habits; signed share links must be scoped and expiring. |
| Alerts and notifications | price alerts, notification channels, webhook deliveries, digest requests | `apps/api/src/watchlists/watchlists.service.ts`, `apps/web/src/app/api/alerts`, `apps/web/src/app/api/digest/route.ts` | Keep enough delivery metadata for debugging, but avoid storing message bodies longer than needed. |
| Household and budget planning | household ids, basket items, watchlist items, weekly/monthly budget summaries | `apps/api/src/households`, `apps/api/src/settings/data-export.ts` | Treat as account data; do not include household rows in anonymous analytics. |
| Receipt/scanner imports | uploaded receipt/scanner identifiers, extracted line items, import-review decisions | `apps/web/src/app/scanner/page.tsx`, scanner/import API surfaces | Potentially sensitive. Store only for matching/review/audit, encrypt at rest where image storage exists, and delete/anonymize promptly. |
| Analytics and operational events | item-card impressions, performance checks, non-identifying source coverage | `apps/web/src/lib/analytics.ts`, `docs/ingestion/*` | Prefer aggregate or anonymous events. Do not join behavioural analytics to account rows unless the feature has a user-visible reason and export/delete coverage. |

## Storage locations

### PostgreSQL

Postgres is the durable store for authenticated/server-side account data when
`DATABASE_URL` is configured. Current API code reads or writes rows such as
`user_preferences`, `watchlist_items`, saved basket/weekly basket tables,
products, latest prices, and privacy export/deletion-plan data.

Implementation rules:

- Always key account data by authenticated user id or an explicit demo user id.
- Enforce ownership in SQL predicates before returning watchlist, favourite,
  basket, alert, household, or preference rows.
- Keep privacy export and account deletion plans in sync with every new
  account-bound table.
- Do not write anonymous browser identifiers into account tables unless the user
  has created or signed into an account and the merge is explicit.

### Cookies

Cookies are used for request context such as locale/session signals. API code may
read cookies to resolve product-name locale, and authenticated routes rely on the
session/auth layer outside this document.

Implementation rules:

- Mark session cookies `HttpOnly`, `Secure`, and `SameSite=Lax` or stricter in
  production.
- Avoid placing basket contents, watchlist contents, receipt details, or access
  tokens in client-readable cookies.
- Cookie values that affect privacy rights must be reflected in export/delete
  workflows or be short-lived enough to be operationally irrelevant.

### `localStorage`

`apps/web/src/hooks/useList.ts` stores anonymous shopping-list checked state and
bulk-imported local items under `groceryview:shopping-list:checked:v1`. This is
browser-local convenience state, not server-side account data, until the user
chooses to share, import, or persist it.

Implementation rules:

- Keep localStorage schemas versioned and narrowly scoped.
- Do not store secrets, bearer tokens, raw receipt images, payment data, or full
  account exports in localStorage.
- Provide a clear migration path before changing localStorage keys that may
  contain user-entered basket items.
- Treat share-link payloads as disclosed by the user; sign them, expire them,
  and avoid embedding more detail than the recipient needs.

### Generated/static data

Generated catalogue files under `apps/web/src/lib/generated` and ingested source
fixtures under `apps/web/src/lib/ingested` are product/store/price evidence, not
user data. They may include retailer metadata and operational timestamps, but
must not contain account ids, emails, private baskets, watchlists, receipt rows,
or session identifiers.

## Retention policy

| Data | Default retention | Deletion/anonymization trigger |
| --- | --- | --- |
| Account profile/preferences | Until account deletion or explicit preference reset | Account deletion request or user update. |
| Watchlists/favourites/alerts | Until removed by user or account deletion | Product removal, alert deletion, account deletion. |
| Saved baskets/weekly baskets/household plans | Until removed, superseded, or account deletion | User deletion, household removal, account deletion. |
| Anonymous localStorage list state | Until browser storage is cleared or schema migration deletes it | User clears browser data; app may reset obsolete keys. |
| Signed shopping-list share payloads | Short-lived; use the embedded expiry timestamp | Expiry, user revocation, or key rotation. |
| Receipt/scanner source artifacts | Minimum time needed for matching, review, and legally required audit | Successful extraction plus audit window, user deletion, or account deletion. |
| Notification/webhook delivery logs | Debug window only, then aggregate or delete | Delivery success/failure investigation completes. |
| Aggregated price/catalogue observations | Product-data retention, not user-data retention | Normal data quality retention policies. |

When a feature needs longer retention, document the reason in the feature PR and
include it in export/delete coverage before shipping.

## GDPR alignment

GroceryView development must preserve these GDPR-oriented behaviours:

- **Lawful purpose and minimization:** collect only data needed for grocery price
  comparison, alerts, account controls, receipts/scanning, or required audit.
- **Transparency:** any new account-bound data class must be reflected in the
  public `/privacy` copy and this developer guide.
- **Access/export:** `buildPrivacyExport` and the `/users/demo/privacy/export` /
  settings export surfaces must include every account-bound class that can be
  persisted.
- **Deletion:** account deletion plans must cover preferences, watchlists,
  baskets, household records, alerts, receipt/scanner records, notification
  state, and subscription/account rows before destructive deletion is enabled.
- **Rectification:** user-editable preferences, watchlists, baskets, alerts, and
  households must have update/delete paths or a documented support workflow.
- **Security:** use least-privilege server routes, authenticated ownership
  checks, encrypted transport, secret-managed database credentials, and no
  private data in logs.
- **Processor boundaries:** third-party services for email, push, billing,
  analytics, OCR, or hosting may receive only the fields needed for that
  integration and must be represented in the production data map.

## Developer checklist for new features

Before merging a feature that stores or transmits user-linked data, verify:

1. The data class is listed above or this document is updated.
2. The storage location is explicit: Postgres, cookie, localStorage, generated
   static file, or third-party processor.
3. Retention and deletion behaviour are implemented or tracked as a blocking
   follow-up.
4. Privacy export includes the data, or the PR explains why it is anonymous,
   transient, or strictly operational.
5. Account deletion removes or anonymizes the data.
6. Logs, analytics, screenshots, fixtures, and generated files do not contain
   live private rows.
7. The public `/privacy` page remains accurate for user-facing rights, while
   this file remains accurate for implementation details.

## Relationship to `/privacy`

`apps/web/src/app/privacy/page.tsx` is the public product page. It should stay
short, user-readable, localized where possible, and focused on rights and
controls.

`docs/PRIVACY.md` is for engineers and reviewers. It may name tables, source
files, environment variables, internal flows, and implementation constraints.
If a change touches both user-facing promises and storage mechanics, update both
files in the same PR.
