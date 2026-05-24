import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { argv, env, exit } from 'node:process';

const DEFAULT_BASE_URL = 'https://grocery-web-mu.vercel.app';
export const DEFAULT_LINK_CHECK_TIMEOUT_MS = 10_000;
export const DEFAULT_LINK_CHECK_MAX_PAGES = 50_000;

type RouteManifest = {
  pages?: Record<string, unknown>;
  dynamicRoutes?: Record<string, unknown> | string[];
  staticRoutes?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
  [key: string]: unknown;
};

export type LinkCheckerRuntimeOptions = {
  baseUrl?: string;
  requestTimeoutMs?: number;
  maxPages?: number;
};

export type LinkCheckerResult = {
  manifestRoutes: string[];
  sitemapRoutes: string[];
  missingFromSitemap: string[];
  sitemapOnlyRoutes: string[];
};

export function canonicalizeInternalLink(raw: string, baseUrl = DEFAULT_BASE_URL): string | null {
  if (!raw || raw.startsWith('javascript:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return null;
  const parsed = new URL(raw, baseUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.origin !== new URL(baseUrl).origin) return null;
  const normalizedPath = (parsed.pathname || '/').replace(/\/+$/, '') || '/';
  return normalizedPath;
}

export function parseRouteManifestText(manifestText: string): string[] {
  const manifest = JSON.parse(manifestText) as RouteManifest;
  const seen = new Set<string>();
  const collect = (value: unknown) => {
    if (typeof value === 'string' && value.startsWith('/')) seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.startsWith('/')) seen.add(item);
      }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of Object.keys(value as Record<string, unknown>)) {
        if (key.startsWith('/')) seen.add(key);
      }
    }
  };

  collect(manifest.pages);
  collect(manifest.staticRoutes);
  collect(manifest.dynamicRoutes);
  return [...seen].sort();
}

export function discoverSitemapLinks(xmlText: string, baseUrl = DEFAULT_BASE_URL): string[] {
  const seen = new Set<string>();
  const matcher = /<loc>([\s\S]*?)<\/loc>/gim;
  let match = matcher.exec(xmlText);
  while (match) {
    const raw = match[1]?.trim();
    if (raw) {
      const canonical = canonicalizeInternalLink(raw, baseUrl);
      if (canonical) seen.add(canonical);
    }
    match = matcher.exec(xmlText);
  }
  return [...seen].sort();
}

export function maxPageGuard(name: string, routes: readonly string[], maxPages = DEFAULT_LINK_CHECK_MAX_PAGES): void {
  if (!Number.isFinite(maxPages) || maxPages <= 0) throw new Error(`Invalid ${name} max page cap: ${maxPages}`);
  if (routes.length > maxPages) {
    const sample = routes.slice(0, 8).join(', ');
    throw new Error(`${name} discovered ${routes.length} routes, above CHECK_LINKS_MAX_PAGES=${maxPages}. Sample: ${sample}`);
  }
}

export function linkCheckerOptionsFromEnv(input: NodeJS.ProcessEnv = env): Required<LinkCheckerRuntimeOptions> {
  return {
    baseUrl: input.CHECK_LINKS_BASE_URL?.trim() || DEFAULT_BASE_URL,
    requestTimeoutMs: positiveInt(input.CHECK_LINKS_REQUEST_TIMEOUT_MS, DEFAULT_LINK_CHECK_TIMEOUT_MS),
    maxPages: positiveInt(input.CHECK_LINKS_MAX_PAGES, DEFAULT_LINK_CHECK_MAX_PAGES)
  };
}

export async function readLinkCheckerInput(location: string, options: LinkCheckerRuntimeOptions = {}): Promise<string> {
  if (/^https?:\/\//i.test(location)) {
    const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_LINK_CHECK_TIMEOUT_MS;
    const response = await fetch(location, {
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: { 'user-agent': 'GroceryView link checker/0.1' }
    });
    if (!response.ok) throw new Error(`Request failed for ${location}: ${response.status}`);
    return await response.text();
  }
  return readFileSync(location, 'utf8');
}

export function compareRoutes(manifestRoutes: readonly string[], sitemapRoutes: readonly string[]): Pick<LinkCheckerResult, 'missingFromSitemap' | 'sitemapOnlyRoutes'> {
  const sitemapSet = new Set(sitemapRoutes);
  const manifestSet = new Set(manifestRoutes);
  return {
    missingFromSitemap: manifestRoutes.filter((route) => !route.includes('[') && !sitemapSet.has(route)),
    sitemapOnlyRoutes: sitemapRoutes.filter((route) => !manifestSet.has(route) && !route.startsWith('/products/') && !route.startsWith('/categories/') && !route.startsWith('/stores/'))
  };
}

export async function runLinkChecker(manifestPath: string, sitemapPath: string, options: LinkCheckerRuntimeOptions = {}): Promise<LinkCheckerResult> {
  const runtime = { ...linkCheckerOptionsFromEnv(), ...options };
  const manifestText = await readLinkCheckerInput(manifestPath, runtime);
  const manifestRoutes = parseRouteManifestText(manifestText);
  maxPageGuard('route manifest', manifestRoutes, runtime.maxPages);

  const sitemapText = await readLinkCheckerInput(sitemapPath, runtime);
  const sitemapRoutes = discoverSitemapLinks(sitemapText, runtime.baseUrl);
  maxPageGuard('sitemap', sitemapRoutes, runtime.maxPages);

  return {
    manifestRoutes,
    sitemapRoutes,
    ...compareRoutes(manifestRoutes, sitemapRoutes)
  };
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function diagnosticError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

if (fileURLToPath(import.meta.url) === argv[1]) {
  const [manifestPath, sitemapPath] = argv.slice(2);
  if (!manifestPath || !sitemapPath) {
    console.error('Usage: node scripts/checkLinks.ts <route-manifest.json> <sitemap.xml-or-url>');
    exit(1);
  }

  runLinkChecker(manifestPath, sitemapPath)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      const message = diagnosticError(error);
      console.error(`::error title=Link checker failed::${message}`);
      console.error(JSON.stringify({ manifestPath, sitemapPath, ...linkCheckerOptionsFromEnv(), error: message }, null, 2));
      exit(1);
    });
}
