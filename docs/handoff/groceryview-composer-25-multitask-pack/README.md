# GroceryView Composer 2.5 Multitask Pack

This package is for the next implementation pass after merged PR #3765.

PR #3765 already implemented a lot:
- feature implementation registry
- preview component exports
- backstage admin routes
- ad policy/slots
- metrics package
- spec-to-code tests
- eight atomic gaps closed

This pack is not another abstract planning pack. It is a Composer-friendly execution pack that splits the remaining work into smaller, testable tasks.

Start with `00_COMPOSER_25_USE_GUIDE.md`, then use `01_MASTER_MULTITASK_PROMPT.md`.

For parallel Composer tasks, give each Composer run one task file only:
- `02_TASK_A_CLOSE_REGISTRIES_AND_TESTS.md`
- `03_TASK_B_WIRE_PREVIEW_COMPONENTS.md`
- `04_TASK_C_BACKSTAGE_REAL_REPORTS.md`
- `05_TASK_D_AD_SYSTEM_INTEGRATION.md`
- `06_TASK_E_DATA_ENGINEERING_REPORTS.md`
- `07_TASK_F_ANALYTICS_EVENTS.md`
- `08_TASK_G_FINAL_PUBLIC_COPY_UX_QA.md`

Use `tasks.json` as the machine-readable task plan.
