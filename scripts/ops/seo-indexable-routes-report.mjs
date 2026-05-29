import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const pageFor = (route) => route === '/' ? 'apps/web/src/app/page.tsx' : `apps/web/src/app${route}/page.tsx`;
const requiredIndexRoutes = ['/', '/market', '/browse', '/deals', '/map', '/fuel', '/fuel/stations', '/pharmacy', '/pharmacy/otc', '/data-sources', '/methodology', '/guides'];
const requiredDynamicRoutes = ['/market/[category]', '/browse/[category]', '/products/[slug]', '/stores/[slug]', '/fuel/stations/[stationId]', '/pharmacy/[product]', '/guides/[slug]'];
const noindexRoutes = ['/admin/seo', '/account', '/settings', '/login', '/watchlist'];
const missing = [...requiredIndexRoutes, ...requiredDynamicRoutes].filter((route) => !existsSync(join(root, pageFor(route))));
const seo = readFileSync(join(root, 'apps/web/src/lib/seo.ts'), 'utf8');
const robots = readFileSync(join(root, 'apps/web/src/app/robots.ts'), 'utf8');
const noindexCovered = noindexRoutes.filter((route) => route.startsWith('/admin') ? robots.includes("'/admin'") : robots.includes(`'${route}'`) || seo.includes(`'${route}'`));
const report = {
  status: missing.length === 0 && noindexCovered.length === noindexRoutes.length ? 'ok' : 'blocked',
  indexableRouteCount: requiredIndexRoutes.length + requiredDynamicRoutes.length,
  requiredIndexRoutes,
  requiredDynamicRoutes,
  noindexRouteCount: noindexRoutes.length,
  noindexRoutes,
  missing,
  noindexCovered
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'ok') process.exit(1);
