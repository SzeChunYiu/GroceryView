# PR rescue: unit-test failures

Use this checklist for PRs whose CI fails in a vitest or jest unit-test job.

1. Open the failing check log and copy the exact test file, test name, assertion, and stack frame.
2. Read the failing test before editing code. If the test describes intended behavior, fix the implementation with the smallest diff. If the product behavior changed intentionally, update only the stale expectation and keep the test meaningful.
3. Never delete, skip, or weaken a test only to silence CI. Keep coverage for the failing behavior, including edge cases that caused the failure.
4. Prefer one focused commit per rescued PR. Include the failing test name in the commit or PR note when it clarifies the fix.
5. Push the branch and let CI rerun. If a different unit test fails afterward, repeat the read-test-first loop instead of broad refactors.

Record each rescue with:

- PR number and failing job URL.
- Failing test file and assertion.
- Decision: code bug or stale test expectation.
- Files changed and why the diff is the minimum safe fix.
- CI rerun link or status after the push.
