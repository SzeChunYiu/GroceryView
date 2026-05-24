# Vercel deployment and Nordic domains

The production Vercel project serves one GroceryView build and attaches each country domain to the same project. Domain routing is configured in Vercel; no additional rewrite is required in `vercel.json` while the application keeps country selection in the URL path.

## Country domain mapping

| Market | Primary domain | Path fallback | Country segment |
| --- | --- | --- | --- |
| Sweden | `groceryview.se` | `groceryview.com/se` | `se` |
| Norway | `groceryview.no` | `groceryview.com/no` | `no` |
| Iceland | `groceryview.is` | `groceryview.com/is` | `is` |

## Vercel setup

1. Add `groceryview.se`, `groceryview.no`, and `groceryview.is` to the same Vercel project as production aliases.
2. Point each apex domain at Vercel DNS (or add the Vercel-provided A/CNAME records if DNS is managed elsewhere).
3. Keep `groceryview.com/se`, `groceryview.com/no`, and `groceryview.com/is` available as explicit path fallbacks for shared links and markets that have not yet moved to country TLDs.
4. Leave the existing API rewrite in `vercel.json`; it only maps `/api/:path*` to the serverless API handler and does not affect country-domain routing.

If future app routes need host-based country inference, add Vercel host rewrites for each domain in `vercel.json` and map them to the matching country segment before the catch-all API rewrite.
