# Deployment notes

## Nordic country domains

Vercel should attach the production project to each Nordic hostname and let the host rewrite select the country segment:

| Hostname | Country segment | Fallback URL |
| --- | --- | --- |
| `groceryview.se` | `/se` | `https://groceryview.com/se` |
| `groceryview.no` | `/no` | `https://groceryview.com/no` |
| `groceryview.is` | `/is` | `https://groceryview.com/is` |

`vercel.json` keeps the `/api/:path*` serverless rewrite first, then maps each country domain to `/<country>/:path*`. That means `https://groceryview.no/products/milk` serves the same country-scoped route as `https://groceryview.com/no/products/milk` while API calls remain on `/api/*`.
