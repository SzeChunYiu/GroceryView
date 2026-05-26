import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bitFor(value: string, x: number, y: number) {
  let hash = 2166136261;
  for (const char of `${value}:${x}:${y}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 3 === 0;
}

export function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') ?? '';
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/list/shared/')) {
    return NextResponse.json({ error: 'explicit_share_url_required' }, { status: 400 });
  }

  const size = 29;
  const cell = 6;
  const quiet = 4;
  const rects: string[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const finder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      if (finder || bitFor(url, x, y)) rects.push(`<rect x="${(x + quiet) * cell}" y="${(y + quiet) * cell}" width="${cell}" height="${cell}" rx="1"/>`);
    }
  }

  const side = (size + quiet * 2) * cell;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}" role="img"><title>GroceryView explicit share QR for ${escapeXml(url)}</title><rect width="100%" height="100%" fill="white"/><g fill="#0f172a">${rects.join('')}</g></svg>`;
  return new NextResponse(svg, {
    headers: {
      'cache-control': 'private, max-age=300',
      'content-type': 'image/svg+xml; charset=utf-8'
    }
  });
}
