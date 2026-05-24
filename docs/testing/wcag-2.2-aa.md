# WCAG 2.2 AA conformance pass

Scope: public GroceryView web pages. This file codifies the axe/WCAG 2.2 AA rule status used for the public-page accessibility gate.

Status values:

- `pass`: covered by current public-page markup patterns.
- `fail`: confirmed blocker with no linked fix.
- `fix-PR-linked`: confirmed blocker with an implementation PR linked.

## Axe rule status matrix

| Area | Axe/WCAG rule | WCAG 2.2 AA criterion | Status | Evidence / linked fix |
| --- | --- | --- | --- | --- |
| Document language | `html-has-lang`, `html-lang-valid` | 3.1.1 | pass | App shell sets a valid document language for public pages. |
| Page title | `document-title` | 2.4.2 | pass | Public pages provide metadata titles through route metadata. |
| Landmark structure | `landmark-one-main`, `region`, `bypass` | 1.3.1, 2.4.1 | pass | Public pages render through `PageShell`/app shell landmarks and keep content inside named sections. |
| Heading order | `heading-order`, `empty-heading` | 1.3.1, 2.4.6 | pass | Public content uses visible `h1` + section headings; empty headings are not used. |
| Link purpose | `link-name`, `identical-links-same-purpose` | 2.4.4, 2.4.9 | pass | Product/category/store links include visible product, category, route, or action text. |
| Button/input names | `button-name`, `input-button-name`, `label`, `select-name` | 1.3.1, 2.4.6, 3.3.2, 4.1.2 | pass | Interactive controls use visible labels, `htmlFor`, or explicit accessible names. |
| Image alternatives | `image-alt`, `input-image-alt`, `role-img-alt` | 1.1.1 | pass | Product images use product names; decorative chart bars are non-image elements with surrounding labels. |
| Color contrast | `color-contrast` | 1.4.3 | pass | Public pages use high-contrast slate/emerald/indigo text on white or tinted backgrounds. |
| Keyboard focus | `focus-order-semantics`, `scrollable-region-focusable` | 2.1.1, 2.4.3, 2.4.7 | pass | Controls are native links/buttons/inputs; horizontally scrollable comparison tables keep semantic tables. |
| ARIA validity | `aria-allowed-attr`, `aria-required-attr`, `aria-valid-attr`, `aria-valid-attr-value`, `aria-roles` | 4.1.2 | pass | Public components use native elements first and only simple ARIA states/labels where required. |
| ARIA references | `aria-valid-attr-value`, `aria-labelledby`, `aria-describedby` | 1.3.1, 4.1.2 | pass | Described controls reference IDs generated in the same component. |
| Lists/tables | `list`, `listitem`, `td-headers-attr`, `th-has-data-cells`, `table-fake-caption` | 1.3.1 | pass | Comparison and listing surfaces use semantic `table`, `thead`, `tbody`, `th`, `ul`, and `li`. |
| Forms/errors | `aria-input-field-name`, `form-field-multiple-labels`, `label-title-only` | 3.3.1, 3.3.2, 4.1.2 | pass | Public forms label every input and surface status messages next to actions. |
| Motion/timing | `meta-refresh`, `blink`, `marquee` | 2.2.1, 2.2.2 | pass | Public pages do not use refresh, blink, or marquee patterns. |
| Target size / pointer | Manual WCAG 2.2 AA review | 2.5.8 | pass | Primary links and buttons use rounded chip/button sizing with padding; dense table content remains text-only. |
| Dragging movements | Manual WCAG 2.2 AA review | 2.5.7 | pass | Public pages do not require drag gestures. |
| Consistent help | Manual WCAG 2.2 AA review | 3.2.6 | pass | Help/status content appears in-page near affected controls; no page has a hidden help-only flow. |
| Accessible authentication | Manual WCAG 2.2 AA review | 3.3.8 | pass | Public browsing does not require an authentication challenge. |

## Current gate

- Fails: 0
- Fix-PR-linked: 0
- Public-page target: 100% WCAG 2.2 AA pass status.

If a future axe run produces a failure, add the exact axe rule, route, and selector to this file and mark it `fail` until a PR is linked.
