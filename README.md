## Heartbeat

- 2026-05-22

## Heartbeat2

- 2026-05-23

## Link-checker for contributor troubleshooting

`scripts/checkLinks.ts` is a lightweight utility you can run locally to validate markdown links before pushing docs-heavy changes.

### Required environment

- `CHECK_LINKS_FILE`: path to the markdown file to scan (defaults to `README.md`).
- `CHECK_LINKS_BASE_URL`: base URL used to resolve relative links (for example, `https://groceryview.example.com`).
- `CHECK_LINKS_TIMEOUT_SECONDS`: optional per-request timeout in seconds (defaults to `10`).
- `CHECK_LINKS_DRY_RUN`: set to `1` or `true` to print the links that would be checked without issuing network requests.

### Typical local use

```bash
CHECK_LINKS_FILE=README.md \
CHECK_LINKS_BASE_URL=https://groceryview.example.com \
node --loader tsx scripts/checkLinks.ts
```

```bash
# Dry-run mode for CI smoke/debug sessions
CHECK_LINKS_DRY_RUN=true \
CHECK_LINKS_FILE=README.md \
node --loader tsx scripts/checkLinks.ts
```

When the script exits non-zero, it prints the first failing link and status code so you can quickly reproduce and fix documentation or CI configuration issues.
