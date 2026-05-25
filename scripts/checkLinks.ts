import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv, env, exit } from 'node:process';

const DEFAULT_BASE_URL = 'https://grocery-web-mu.vercel.app';
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_MANIFEST_ROUTES = 2_000;
const DEFAULT_MAX_SITEMAP_LINKS = 5_000;
const DEFAULT_CACHE_DIR = '.link-check-cache';

type RouteManifest = {
  pages?: Record<string, unknown>;
  dynamicRoutes?: Record<string, unknown> | string[];
  staticRoutes?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
  [key: string]: unknown;
};

export type LinkCheckGuardrails = {
  requestTimeoutMs: number;
  maxManifestRoutes: number;
  maxSitemapLinks: number;
  cacheDir: string;
};

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, received ${JSON.stringify(value)}.`);
  }
  return parsed;
}

export function readGuardrails(source: NodeJS.ProcessEnv = env): LinkCheckGuardrails {
  return {
    requestTimeoutMs: positiveInteger(source.LINK_CHECK_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS, 'LINK_CHECK_TIMEOUT_MS'),
    maxManifestRoutes: positiveInteger(source.LINK_CHECK_MAX_MANIFEST_ROUTES, DEFAULT_MAX_MANIFEST_ROUTES, 'LINK_CHECK_MAX_MANIFEST_ROUTES'),
    maxSitemapLinks: positiveInteger(source.LINK_CHECK_MAX_SITEMAP_LINKS, DEFAULT_MAX_SITEMAP_LINKS, 'LINK_CHECK_MAX_SITEMAP_LINKS'),
    cacheDir: source.LINK_CHECK_CACHE_DIR || DEFAULT_CACHE_DIR
  };
}

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

export function enforceRouteCap(routes: string[], cap: number, label: string, envName: string): string[] {
  if (routes.length > cap) {
    const sample = routes.slice(0, 8).join(', ');
    throw new Error(`${label} produced ${routes.length} routes, which exceeds ${envName}=${cap}. Sample: ${sample}`);
  }
  return routes;
}

function cachePathForUrl(url: string, cacheDir: string): string {
  const digest = createHash('sha256').update(url).digest('hex');
  return join(cacheDir, `${digest}.txt`);
}

export async function readTextInput(input: string, guardrails = readGuardrails()): Promise<string> {
  if (!/^https?:\/\//i.test(input)) {
    return readFileSync(input, 'utf8');
  }

  const cachePath = cachePathForUrl(input, guardrails.cacheDir);
  try {
    return readFileSync(cachePath, 'utf8');
  } catch {
    // Cache misses should fall through to the bounded network request.
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), guardrails.requestTimeoutMs);
  try {
    const response = await fetch(input, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request for ${input} failed with HTTP ${response.status}.`);
    }
    const text = await response.text();
    mkdirSync(guardrails.cacheDir, { recursive: true });
    writeFileSync(cachePath, text);
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request for ${input} timed out after ${guardrails.requestTimeoutMs}ms. Set LINK_CHECK_TIMEOUT_MS to adjust the CI limit.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runLinkCheck(manifestPath: string, sitemapPath: string, guardrails = readGuardrails()) {
  const manifestText = await readTextInput(manifestPath, guardrails);
  const manifestRoutes = enforceRouteCap(
    parseRouteManifestText(manifestText),
    guardrails.maxManifestRoutes,
    'Route manifest',
    'LINK_CHECK_MAX_MANIFEST_ROUTES'
  );
  const sitemapText = await readTextInput(sitemapPath, guardrails);
  const sitemapRoutes = enforceRouteCap(
    discoverSitemapLinks(sitemapText),
    guardrails.maxSitemapLinks,
    'Sitemap',
    'LINK_CHECK_MAX_SITEMAP_LINKS'
  );
  return { manifestRoutes, sitemapRoutes };
}

if (fileURLToPath(import.meta.url) === argv[1]) {
  const [manifestPath, sitemapPath] = argv.slice(2);
  if (!manifestPath || !sitemapPath) {
    console.error('Usage: node scripts/checkLinks.ts <route-manifest.json> <sitemap.xml>');
    exit(1);
  }
  runLinkCheck(manifestPath, sitemapPath)
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Link checker failed: ${message}`);
      exit(1);
    });
}
