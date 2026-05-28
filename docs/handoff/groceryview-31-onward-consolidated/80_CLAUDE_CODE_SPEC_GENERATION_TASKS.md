# 80 — Claude Code Spec Generation Tasks

## Master prompt

```text
You are working on GroceryView.

Generate a living specification system for future versions.

Do not only update code. Create specs that make the project maintainable as:
- data engineering project
- data analytics project
- UI/UX product
- multi-domain price intelligence platform

Create the following:
1. Data engineering principles
2. Database architecture and scaling plan
3. Data quality and observability spec
4. Data analytics semantic layer spec
5. Metric dictionary
6. Event tracking plan
7. UI/UX living principles
8. Page spec template
9. Feature spec template
10. PR review checklist
11. Atomic gap registry
12. Versioning/roadmap process

Requirements:
- Each spec includes purpose, principles, examples, anti-patterns, required tests.
- Every future page must have a Page Spec.
- Every future feature must have a Feature Spec.
- Every future metric must have a Metric Definition.
- Every source must have a Data Source Contract.
- Every PR must use the PR checklist.
- Public pages must not show backstage/debug content.
- Admin pages can show technical details.
- Data must be idempotent, quality-gated, observable, and lineage-aware.
- UI must be human-centered, accessible, and evidence-backed.
```
