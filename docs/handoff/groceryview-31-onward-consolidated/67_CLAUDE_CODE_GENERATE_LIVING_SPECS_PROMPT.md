# 67 — Claude Code Prompt: Generate Living Project Specs

```text
You are working on GroceryView latest main.

Create a living principles/specification system so future versions follow the same data engineering, data analytics, and UI/UX standards.

Generate these files in the repo:

1. docs/principles/data-engineering.md
2. docs/principles/database-architecture.md
3. docs/principles/data-analytics.md
4. docs/principles/uiux-design.md
5. docs/principles/content-language.md
6. docs/principles/accessibility.md
7. docs/principles/ad-policy.md

8. docs/specs/page-spec-template.md
9. docs/specs/feature-spec-template.md
10. docs/specs/metric-definition-template.md
11. docs/specs/data-source-contract-template.md
12. docs/specs/pr-review-checklist.md

13. docs/analytics/metric-dictionary.md
14. docs/analytics/event-tracking-plan.md
15. docs/analytics/dashboard-roadmap.md

16. docs/data/source-run-contract.md
17. docs/data/quality-gates.md
18. docs/data/lineage-and-observability.md
19. docs/data/database-scaling-plan.md

Each file should be written as a practical engineering/design standard, not a vague essay.

Each spec must include:
- purpose
- principles
- required fields
- required tests
- examples
- anti-patterns
- owner/reviewer checklist
- what must be updated in future PRs

Add tests where possible to ensure the files exist and important phrases/contracts remain present.

The project should support:
- grocery
- pharmacy OTC
- fuel

Do not expose backstage debug content on public user pages.
Keep frontstage user content simple, human-centered, and evidence-backed.
```
