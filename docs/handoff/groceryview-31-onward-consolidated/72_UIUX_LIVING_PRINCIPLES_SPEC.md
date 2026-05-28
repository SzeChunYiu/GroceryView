# 72 — UI/UX Living Principles Spec

## Goal

Make future UI changes follow the same design philosophy.

## Non-negotiable principles

```text
1. Human-centered / 以人為本
2. Plain meaning first
3. Evidence second
4. Progressive disclosure
5. No debug content on public pages
6. Every visible element has a purpose
7. Every chart has a question
8. Every card has a next action
9. Every page works on mobile
10. Every interaction is accessible
```

## Page spec requirement

Every new public page must define:

```text
user question
primary user job
above-the-fold content
primary CTA
secondary CTA
data required
empty state
evidence shown
ad slots
mobile behavior
accessibility notes
analytics events
```

## Component rule

Every component must define:

```text
purpose
props
visual states
loading state
empty state
error state
accessibility behavior
analytics events if interactive
```

## Copy rule

Every public heading should be understandable without knowing the database.

Bad:

```text
domain=fuel observation terminal
```

Good:

```text
Compare verified fuel prices by grade
```

## Preview rule

Use preview before full-page navigation when the user likely needs only quick facts.

```text
search result quick view
map marker detail
deal explanation
source evidence
```

## Claude Code task

Generate:

```text
docs/principles/uiux-design.md
docs/specs/page-spec-template.md
docs/specs/component-spec-template.md
apps/web/scripts/uiux-principles.test.mjs
```
