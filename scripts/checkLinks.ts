import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { argv, exit } from 'node:process';

const DEFAULT_BASE_URL = 'https://grocery-web-mu.vercel.app';

type RouteManifest = {
  pages?: Record<string, unknown>;
  dynamicRoutes?: Record<string, unknown> | string[];
  staticRoutes?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
  [key: string]: unknown;
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

if (fileURLToPath(import.meta.url) === argv[1]) {
  const [manifestPath, sitemapPath] = argv.slice(2);
  if (!manifestPath || !sitemapPath) {
    console.error('Usage: node scripts/checkLinks.ts <route-manifest.json> <sitemap.xml>');
    exit(1);
  }
  const manifestText = readFileSync(manifestPath, 'utf8');
  const manifestRoutes = parseRouteManifestText(manifestText);
  const sitemapText = readFileSync(sitemapPath, 'utf8');
  const sitemapRoutes = discoverSitemapLinks(sitemapText);
  console.log(JSON.stringify({ manifestRoutes, sitemapRoutes }));
}
