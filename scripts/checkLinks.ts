#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE_URL = new URL(process.env.CHECK_LINKS_BASE_URL ?? 'http://127.0.0.1:3000');
const MAX_VISITS = Number(process.env.CHECK_LINKS_MAX_VISITS ?? 5000);
const SERVER_WAIT_MS = Number(process.env.CHECK_LINKS_SERVER_WAIT_MS ?? 120000);
const MAX_FETCH_FAILURES = Number(process.env.CHECK_LINKS_MAX_FETCH_FAILURES ?? 3);
const CHECK_ROUTES_MANIFEST = process.env.CHECK_LINKS_SKIP_MANIFEST !== '1';
const CHECK_SITEMAP = process.env.CHECK_LINKS_SKIP_SITEMAP !== '1';
const MAX_REQUESTS_PER_ROUTE = Number(process.env.CHECK_LINKS_MAX_REQUESTS_PER_ROUTE ?? 2);

const ROOT_DIR = new URL('.', import.meta.url);
const WEB_OUTPUT_DIR = new URL('./apps/web/.next/', ROOT_DIR);
const ROUTES_MANIFEST_PATH = new URL('routes-manifest.json', WEB_OUTPUT_DIR);
const SITEMAP_PATH = '/sitemap.xml';

const LINK_ATTR_RE = /<(?:a|area|base)\b[^>]*\s(?:href|action)=\"([^\"\']+)\"[^>]*>/gi;
const SINGLE_QUOTE_LINK_ATTR_RE = /<(?:a|area|base)\b[^>]*\s(?:href|action)='([^'\"]+)'[^>]*>/gi;
const XML_LOC_RE = /<loc>([^<]+)<\/loc>/gi;

const FILE_EXTENSIONS_TO_IGNORE = new Set([
  '.css',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.map',
  '.png',
  '.svg',
  '.txt',
  '.xml',
  '.webmanifest'
]);

function canonicalizePath(rawPath: string): string {
  if (!rawPath || rawPath === '/') return '/';

  const [pathName, ...queryParts] = rawPath.split('?');
  const query = queryParts.length > 0 ? `?${queryParts.join('?')}` : '';
  const normalized = pathName.endsWith('/') && pathName.length > 1 ? pathName.slice(0, -1) : pathName;
  const withQuery = `${normalized}${query}`;
  return withQuery || '/';
}

function isInternalUrl(url: URL): boolean {
  return url.origin === BASE_URL.origin;
}

function isIgnoredPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === '/') return false;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/static/')) return true;
  return false;
}

function isAllowedExtension(pathname: string): boolean {
  return ![...FILE_EXTENSIONS_TO_IGNORE].some((ext) => pathname.toLowerCase().endsWith(ext));
}

function cleanHref(href: string, base = BASE_URL): string | null {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null;
  }

  const normalized = href.trim();
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized, base);
    if (!isInternalUrl(parsed)) return null;
    if (parsed.pathname.startsWith('/api/')) return null;
    if (!isAllowedExtension(parsed.pathname)) return null;
    if (isIgnoredPath(parsed.pathname)) return null;

    const pathname = canonicalizePath(parsed.pathname);
    return `${pathname}${parsed.search}${parsed.hash ? `#${parsed.hash.slice(1)}` : ''}`;
  } catch {
    return null;
  }
}

function collectStaticRoutesFromManifest(): string[] {
  if (!CHECK_ROUTES_MANIFEST) return [];
  if (!existsSync(ROUTES_MANIFEST_PATH)) return [];

  const content = JSON.parse(readFileSync(ROUTES_MANIFEST_PATH, 'utf8')) as {
    staticRoutes?: Record<string, unknown> | string[];
    dynamicRoutes?: Array<{ page: string; }>; 
    dataRoutes?: Array<{ page: string; }>; 
  };

  const routes = new Set<string>();

  const pushRoute = (value: unknown) => {
    if (typeof value !== 'string') return;
    const cleaned = cleanHref(value);
    if (!cleaned) return;
    routes.add(cleaned.split('#')[0]);
  };

  const pushEntry = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || entry === null) return;
    const object = entry as Record<string, unknown>;
    if (typeof object.page === 'string') pushRoute(object.page);
    if (typeof object.route === 'string') pushRoute(object.route);
  };

  if (Array.isArray(content.staticRoutes)) {
    content.staticRoutes.forEach(pushRoute);
  } else if (content.staticRoutes && typeof content.staticRoutes === 'object') {
    Object.keys(content.staticRoutes as Record<string, unknown>).forEach((route) => pushRoute(route));
  }

  if (Array.isArray(content.dynamicRoutes)) {
    content.dynamicRoutes.forEach(pushEntry);
  }

  if (Array.isArray(content.dataRoutes)) {
    content.dataRoutes.forEach(pushEntry);
  }

  return [...routes].filter((route) => {
    const pathname = route.split('?')[0];
    return pathname === '/' || !pathname.includes('[');
  });
}

function parseHtmlForInternalLinks(html: string): string[] {
  const matches: string[] = [];

  for (const regex of [LINK_ATTR_RE, SINGLE_QUOTE_LINK_ATTR_RE]) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      if (!match[1]) continue;
      const path = cleanHref(match[1]);
      if (path) matches.push(path);
    }
  }

  return matches;
}

function parseSitemapXml(xml: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = XML_LOC_RE.exec(xml)) !== null) {
    const value = match[1]?.trim();
    if (!value) continue;

    const path = cleanHref(value, BASE_URL);
    if (path) {
      matches.push(path.split('#')[0]);
    }
  }

  return matches;
}

async function fetchWithRetry(url: string, retries = MAX_FETCH_FAILURES): Promise<Response> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;
      await sleep(500);
      attempt += 1;
    }
  }

  throw lastError;
}

async function collectSeedRoutes(): Promise<Set<string>> {
  const seeds = new Set<string>(['/']);
  collectStaticRoutesFromManifest().forEach((route) => seeds.add(route));

  if (!CHECK_SITEMAP) {
    return seeds;
  }

  const sitemapUrl = new URL(SITEMAP_PATH, BASE_URL).toString();
  const response = await fetchWithRetry(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap ${sitemapUrl} (${response.status})`);
  }

  const xml = await response.text();
  parseSitemapXml(xml).forEach((route) => seeds.add(route));

  return seeds;
}

async function main() {
  const server =
    process.env.CHECK_LINKS_SKIP_SERVER === '1'
      ? null
      : spawn('npm', ['run', 'start', '-w', '@groceryview/web', '--', '--hostname', '127.0.0.1', '--port', `${BASE_URL.port || 3000}`], {
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, PORT: `${BASE_URL.port || 3000}` }
        });

  const stopServer = async () => {
    if (!server) return;
    server.kill('SIGTERM');
    await sleep(500);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  };

  const queue: string[] = [];
  const visited = new Set<string>();
  const currentlyChecking = new Set<string>();
  const brokenLinks: { href: string; status: number; from: string; }[] = [];

  try {
    if (server) {
      let ready = false;
      const deadline = Date.now() + SERVER_WAIT_MS;
      while (Date.now() < deadline) {
        try {
          const response = await fetchWithRetry(new URL('/', BASE_URL).toString(), 0);
          if (response.status < 500) {
            ready = true;
            break;
          }
        } catch {
          await sleep(500);
        }
      }

      if (!ready) {
        throw new Error(`Unable to start web server at ${BASE_URL} within ${SERVER_WAIT_MS}ms`);
      }
    }

    const seedRoutes = await collectSeedRoutes();
    seedRoutes.forEach((route) => queue.push(route));

    while (queue.length > 0) {
      if (visited.size >= MAX_VISITS) {
        throw new Error(`Reached link check limit of ${MAX_VISITS} routes; increase CHECK_LINKS_MAX_VISITS if this is expected.`);
      }

      const route = queue.shift();
      if (!route) break;
      if (visited.has(route) || currentlyChecking.has(route)) continue;

      const fullUrl = new URL(route, BASE_URL).toString();
      currentlyChecking.add(route);

      try {
        const response = await fetchWithRetry(fullUrl);

        if (!response.ok) {
          brokenLinks.push({
            href: route,
            status: response.status,
            from: route
          });
          continue;
        }

        visited.add(route);

        const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
        if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
          const body = await response.text();
          const found = parseHtmlForInternalLinks(body);
          found
            .map((href) => href.split('#')[0])
            .forEach((href) => {
              if (visited.has(href) || currentlyChecking.has(href)) return;
              if (queue.filter((entry) => entry === href).length >= MAX_REQUESTS_PER_ROUTE) {
                return;
              }
              queue.push(href);
            });
        }
      } finally {
        currentlyChecking.delete(route);
      }
    }

    if (brokenLinks.length > 0) {
      const summary = brokenLinks.map((entry) => `  - ${entry.href} (HTTP ${entry.status})`).join('\n');
      throw new Error(`Broken internal links found:\n${summary}`);
    }

    const routeCount = visited.size;
    console.log(`Checked ${routeCount} internal routes; no broken links found.`);
  } finally {
    await stopServer();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
