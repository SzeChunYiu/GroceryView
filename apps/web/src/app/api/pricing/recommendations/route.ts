import { NextResponse } from 'next/server';

import { pricedProducts } from '@/lib/openprices-products';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function meanFor(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function medianFor(values: number[]) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2 : sorted[midpoint]!;
}

function volatilityPercentFor(values: number[]) {
  if (values.length === 0) return 0;
  const mean = meanFor(values);
  if (mean <= 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return (Math.sqrt(variance) / mean) * 100;
}

function scoreBuyingWindow(product: (typeof pricedProducts)[number]) {
  const points = [...product.observations]
    .filter((observation) => Number.isFinite(observation.price) && Number.isFinite(Date.parse(`${observation.date}T00:00:00.000Z`)))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length < 3) {
    return null;
  }

  const latest = points.at(-1)!;
  const baseline = points[Math.max(0, points.length - 6)]!;
  const values = points.map((point) => point.price);
  const median = medianFor(values) ?? latest.price;
  const trendSlopePercent = baseline.price > 0 ? ((latest.price - baseline.price) / baseline.price) * 100 : 0;
  const volatilityPercent = volatilityPercentFor(values);
  const belowMedianPercent = median > 0 ? ((median - latest.price) / median) * 100 : 0;
  const score = Math.round(clamp(58 + belowMedianPercent * 2 - Math.max(trendSlopePercent, 0) * 1.2 - volatilityPercent * 0.9, 0, 100));
  const actionLabel = score >= 75 ? 'Buy now' : score >= 55 ? 'Watch closely' : 'Wait';
  const windowLabel = score >= 75 ? 'Likely best window: this week' : score >= 55 ? 'Likely window: next 1–2 weeks' : 'Wait for a better observed dip';

  return {
    productSlug: product.slug,
    productName: product.name,
    score,
    scoreLabel: score >= 75 ? 'strong buy window' : score >= 55 ? 'fair buy window' : 'weak buy window',
    actionLabel,
    windowLabel,
    trendSlopePercent,
    volatilityPercent,
    latestObservedAt: latest.date,
    observationCount: points.length
  };
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const recommendations = pricedProducts
    .filter((product) => !slug || product.slug === slug)
    .map(scoreBuyingWindow)
    .filter((recommendation): recommendation is NonNullable<typeof recommendation> => recommendation !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, slug ? 1 : 12);

  return NextResponse.json({ recommendations });
}
