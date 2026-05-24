# Friction-points aggregated report

Method: aggregate observed friction across personas and shopping tasks, then rank by frequency × severity. This report is the source for UX fix tickets; do not treat it as implementation by itself.

| Rank | Finding | Personas/tasks affected | Frequency | Severity | Score | P1 fix ticket seed |
| --- | --- | --- | ---: | ---: | ---: | --- |
| 1 | Price confidence and freshness are hard to compare before acting. | Budget shopper, deal hunter, family planner | 5 | 5 | 25 | Add clearer confidence/freshness summaries near price actions. |
| 2 | Navigation hides analytical routes on mobile. | Power shopper, market researcher | 4 | 4 | 16 | Ensure high-value routes appear in mobile and desktop nav. |
| 3 | Promotion eligibility is not consistently visible. | Member-price shopper, budget shopper | 4 | 4 | 16 | Standardize promo caveats and member-required labels. |
| 4 | Private/gated features can look empty instead of explaining required sign-in/data state. | Household planner, scanner user | 3 | 4 | 12 | Add action-oriented gated empty states. |
| 5 | Basket comparison requires too much manual product selection context. | Weekly basket planner | 3 | 3 | 9 | Add saved templates and clearer split-shop guidance. |
| 6 | Store coverage gaps are difficult to distinguish from true lack of deals. | Rural shopper, store mapper | 2 | 4 | 8 | Surface coverage caveats beside store-specific rankings. |

## Aggregated observations

- Frequency is counted across repeated persona/task mentions, not traffic analytics.
- Severity reflects risk of wrong purchase behavior, abandoned task, or loss of trust.
- P1 seeds above should become separate scoped tickets before implementation.
