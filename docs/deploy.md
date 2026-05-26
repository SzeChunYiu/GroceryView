# Deployment Domains

GroceryView uses the first path segment as the country scope for localized Nordic routes:

| Production domain | Country segment | Canonical entry |
| --- | --- | --- |
| `groceryview.se` | `se` | `https://groceryview.se/se` |
| `groceryview.no` | `no` | `https://groceryview.no/no` |
| `groceryview.is` | `is` | `https://groceryview.is/is` |
| `groceryview.com/se` | `se` | `https://groceryview.com/se` |
| `groceryview.com/no` | `no` | `https://groceryview.com/no` |
| `groceryview.com/is` | `is` | `https://groceryview.com/is` |

`vercel.json` redirects each country-specific apex root to its matching segment. After the root redirect, in-app links should keep the country segment in the path instead of relying on host inference. API traffic remains under `/api/:path*` and is not country-rewritten by Vercel.

## Vercel Setup

Attach these production aliases to the same Vercel project:

- `groceryview.se`
- `groceryview.no`
- `groceryview.is`
- `groceryview.com`

The hosted app should treat `.com/{country}` as the portable fallback for previews, local smoke checks, and any market where a country ccTLD is not attached yet. Do not redirect `.com/se`, `.com/no`, or `.com/is` to ccTLDs; keeping the path-scoped form stable makes preview and incident checks deterministic.
