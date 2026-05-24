# Deploying country domains on Vercel

GroceryView uses country-prefixed routes as the canonical country segment:

| Domain | Country segment | Fallback path |
| --- | --- | --- |
| `groceryview.se` | Sweden | `groceryview.com/se` |
| `groceryview.no` | Norway | `groceryview.com/no` |
| `groceryview.is` | Iceland | `groceryview.com/is` |

`vercel.json` keeps `/api/*` routed to the API handler first, then rewrites host-based country domains to the matching segment. That means `https://groceryview.no/prices` resolves the same app route as `https://groceryview.com/no/prices` without requiring country-specific code.

When adding a new country domain, add it in Vercel, point DNS at the Vercel project, then add one host rewrite that maps the root domain to the corresponding `/<country>/:path*` segment.
