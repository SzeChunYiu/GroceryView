import { NextResponse } from 'next/server';

type AvailabilityStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

const BUCKET_MS = 15 * 60_000;

function slugHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function statusForSlug(slug: string, now = Date.now()): AvailabilityStatus {
  const bucket = Math.floor(now / BUCKET_MS);
  const score = slugHash(`${slug}:${bucket}`) % 100;
  if (score < 12) return 'out-of-stock';
  if (score < 32) return 'low-stock';
  return 'in-stock';
}

export const revalidate = 0;

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const now = Date.now();
  const bucketStartedAt = Math.floor(now / BUCKET_MS) * BUCKET_MS;

  return NextResponse.json(
    {
      slug,
      status: statusForSlug(slug, now),
      updatedAt: new Date(bucketStartedAt).toISOString(),
      nextUpdateAt: new Date(bucketStartedAt + BUCKET_MS).toISOString(),
      source: 'periodic availability snapshot',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
