# 33 — Design Tokens and Theme

## Why tokens matter

Design tokens prevent the website from feeling random. Every card, button, chart, badge, and page should use the same semantic tokens.

## Token groups

```text
Color
Typography
Spacing
Radius
Shadow
Border
Z-index
Motion
Chart colors
Ad slots
```

## Semantic roles

```text
primary: main action
success: saving, price down, real deal
warning: medium confidence, caution, fair discount
danger: price up, low confidence, not really deal
info: source, pharmacy safety, help
neutral: text, borders, inactive
```

## Spacing scale

```text
4px  xs
8px  sm
12px md
16px base
24px lg
32px xl
48px 2xl
64px 3xl
96px page
```

## Radius scale

```text
8px  small controls
12px input/button
16px product cards
24px section cards
32px hero/dashboard panels
```

## Page background

Use warm layered background:

```css
body {
  background:
    radial-gradient(circle at 15% 0%, rgba(189, 235, 75, 0.16), transparent 28rem),
    radial-gradient(circle at 90% 12%, rgba(167, 243, 208, 0.18), transparent 26rem),
    var(--gv-bg);
}
```

Keep it subtle.

## Button styles

Primary:

```text
dark forest fill
white text
rounded pill
strong hover/focus
```

Secondary:

```text
white or pale green surface
forest text
border
```

Tertiary:

```text
text link with underline on hover
```

## Card styles

Product card:

```text
white surface
image area
price emphasis
evidence line
clear action
```

Dashboard card:

```text
white surface
data title
KPI/visual
summary
evidence
```

Evidence card:

```text
muted blue/green surface
small text
structured rows
```

Ad slot:

```text
neutral, separated, labelled Advertisement
```
