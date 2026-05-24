import { readFileSync } from 'node:fs';

type LinkCheckConfig = {
  sourceFile: string;
  baseUrl?: string;
  dryRun: boolean;
  timeoutMs: number;
};

type LinkCheckResult = {
  href: string;
  normalizedHref: string;
  status: number | null;
  ok: boolean;
};

const config: LinkCheckConfig = {
  sourceFile: process.env.CHECK_LINKS_FILE ?? 'README.md',
  baseUrl: process.env.CHECK_LINKS_BASE_URL,
  dryRun: process.env.CHECK_LINKS_DRY_RUN === 'true' || process.env.CHECK_LINKS_DRY_RUN === '1',
  timeoutMs: Number(process.env.CHECK_LINKS_TIMEOUT_SECONDS ?? '10') * 1000
};

function parseMarkdownLinks(content: string): string[] {
  const matcher = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  const links = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(content)) !== null) {
    links.add(match[1]);
  }
  return [...links];
}

function normalizeHref(href: string, baseUrl: string | undefined): string | null {
  if (/^https?:\/\//i.test(href)) return href;
  if (!baseUrl) return null;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

async function checkLink(url: string, config: LinkCheckConfig): Promise<LinkCheckResult> {
  const normalizedHref = normalizeHref(url, config.baseUrl) ?? url;
  if (config.dryRun) return { href: url, normalizedHref, status: null, ok: true };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(normalizedHref, { signal: controller.signal, redirect: 'manual' });
    clearTimeout(timeout);
    return {
      href: url,
      normalizedHref,
      status: response.status,
      ok: response.ok || (response.status >= 300 && response.status < 400)
    };
  } catch {
    clearTimeout(timeout);
    return { href: url, normalizedHref, status: null, ok: false };
  }
}

async function run() {
  const content = readFileSync(config.sourceFile, 'utf8');
  const rawLinks = parseMarkdownLinks(content);
  const webLinks = rawLinks.filter((href) => /^https?:\/\//i.test(href) || Boolean(config.baseUrl));

  if (webLinks.length === 0) {
    console.log(`No links found in ${config.sourceFile}.`);
    return;
  }

  if (config.dryRun) {
    console.log(`Dry-run link check for ${config.sourceFile}; no network calls.`);
  }

  const results = await Promise.all(webLinks.map((href) => checkLink(href, config)));

  const failing = results.filter((result) => !result.ok);

  if (config.dryRun) {
    for (const result of results) {
      console.log(`[DRY RUN] ${result.href} -> ${result.normalizedHref}`);
    }
    console.log(`Dry-run completed for ${results.length} link(s).`);
    return;
  }

  for (const result of results) {
    if (result.ok) {
      console.log(`OK ${result.status?.toString() ?? ''} ${result.normalizedHref}`);
    } else {
      console.error(`FAIL ${result.href} -> ${result.normalizedHref}`);
    }
  }

  if (failing.length > 0) {
    throw new Error(`checkLinks failed: ${failing.length} broken link(s).`);
  }

  console.log(`checkLinks passed for ${results.length} link(s).`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
