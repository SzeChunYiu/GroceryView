# 62 — Desktop / Mobile Preview Behavior

## Desktop

Preferred:

```text
hover: lightweight hint only
click: open preview drawer/card
secondary click: open full page
```

Desktop patterns:

```text
Search product quick view → side drawer
Market category row → side drawer or route
Map marker → right detail panel
Evidence → disclosure/drawer
```

## Mobile

Preferred:

```text
tap card → open bottom sheet preview
button in bottom sheet → open full page
```

Mobile patterns:

```text
Search result tap → product bottom sheet
Map pin tap → bottom sheet
Deal tap → bottom sheet
Category tap → either navigate or quick sheet depending page
```

## Avoid

```text
tiny hover-only popovers
modals for normal previews
full-page navigation for every small fact
nested drawers
drawer inside modal
accordion inside accordion
```

## State preservation

When user opens preview:

```text
keep filters
keep scroll position
keep map position
allow close and continue
```

When user opens full page:

```text
provide breadcrumb/back-to-results link
```

## URL strategy

For shareable previews:

```text
/search?productPreview=[slug]
/map?store=[slug]
/market?categoryPreview=meat
```

But full pages remain canonical:

```text
/products/[slug]
/stores/[slug]
/market/[category]
```
