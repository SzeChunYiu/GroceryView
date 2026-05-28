# 05 — Task D: Ad System Integration

## Task
Ad policy and slots exist. Integrate safe ad slots into public pages without harming UX.

## Scope
```text
apps/web/src/lib/ad-policy.ts
apps/web/src/lib/ad-slots.ts
apps/web/src/components/design-system/ad-slot.tsx
apps/web/src/app/search/page.tsx
apps/web/src/components/mvp/mvp-home-page.tsx
apps/web/src/app/market/page.tsx
apps/web/src/app/deals/page.tsx
apps/web/src/app/browse/page.tsx
apps/web/scripts/ad-slot-contracts.test.mjs
docs/roadmap/feature-implementation-registry.md
```

## Do
Ensure `AdSlot` renders:
- label exactly `Advertisement`
- reserved height
- neutral style
- aria-label

Add safe slots:
- Home after hero or after first content block
- Search after 12 results only
- Market right rail/bottom only
- Browse after categories
- Deals bottom only

## Do not
Do not add AdSense credentials. Do not show ads on /admin, /account, /privacy, /auth, sensitive pharmacy routes. Do not label ads anything except Advertisement.

## Tests
```bash
npm run test -w @groceryview/web -- apps/web/scripts/ad-slot-contracts.test.mjs
```
