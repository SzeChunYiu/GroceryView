import { NextResponse } from 'next/server';

export const revalidate = 3600;
export const runtime = 'nodejs';

function safeSegment(value: string | null) {
  const fallback = 'se';
  const segment = (value || fallback).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64);
  return segment || fallback;
}

function originFromRequest(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (forwardedHost) {
    return `${forwardedProto || url.protocol.replace(':', '')}://${forwardedHost}`;
  }
  return url.origin;
}

async function renderPdfWithHeadlessBrowser(targetUrl: string) {
  const importer = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
  const puppeteer = await importer('puppeteer-core');
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_EXECUTABLE_PATH ||
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

  if (!executablePath) {
    throw new Error('No headless Chromium executable configured');
  }

  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30_000 });
    await page.emulateMediaType('print');
    return Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
      })
    );
  } finally {
    await browser.close();
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = safeSegment(url.searchParams.get('city'));
  const flyerUrl = `${originFromRequest(request)}/${city}/my-flyer?pdf=1`;

  try {
    const pdf = await renderPdfWithHeadlessBrowser(flyerUrl);
    return new NextResponse(pdf, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Disposition': `attachment; filename="groceryview-${city}-my-flyer.pdf"`,
        'Content-Type': 'application/pdf'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Headless PDF render failed';
    return NextResponse.json(
      {
        error: 'PDF renderer unavailable',
        message,
        printUrl: flyerUrl
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
        }
      }
    );
  }
}
