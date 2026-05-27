import { NextResponse, type NextRequest } from 'next/server';
import { planCommunityReportAbuseControls, planHumanReviewQueue } from '@groceryview/core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CrowdPriceReportBody = {
  reporterId?: unknown;
  productId?: unknown;
  commodityAlias?: unknown;
  storeId?: unknown;
  storeName?: unknown;
  observedAt?: unknown;
  reportedPrice?: unknown;
  currency?: unknown;
  photoEvidence?: unknown;
  reporterActivity?: unknown;
  comparablePrices?: unknown;
};

type PhotoEvidence = {
  contentType: string;
  byteLength: number;
};

type ReporterActivityBody = {
  reportsLast24Hours?: unknown;
  pendingReports?: unknown;
  acceptedReportsLast30Days?: unknown;
  rejectedReportsLast30Days?: unknown;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}

function nonNegativeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function photoEvidence(value: unknown): PhotoEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const contentType = text(record.contentType);
  const byteLength = nonNegativeInteger(record.byteLength);
  if (!contentType.startsWith('image/') || byteLength <= 0) return null;
  return { contentType, byteLength };
}

function comparablePrices(value: unknown) {
  return Array.isArray(value)
    ? value.map(positiveNumber).filter((price): price is number => price !== null)
    : [];
}

function median(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100
    : sorted[middle];
}

function outlierCheck(reportedPrice: number, comparables: readonly number[]) {
  if (comparables.length < 2) {
    return { status: 'insufficient_comparables', requiresManualReview: true, reason: 'Fewer than two verified comparable prices were supplied.' };
  }
  const baseline = median(comparables);
  const deltaPercent = Math.round(Math.abs((reportedPrice - baseline) / baseline) * 1000) / 10;
  return {
    status: deltaPercent > 50 ? 'outlier' : 'within_range',
    requiresManualReview: deltaPercent > 50,
    reason: `Reported price differs from verified comparable median by ${deltaPercent}%.`
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as CrowdPriceReportBody | null;
  const accountUserId = text(request.headers.get('x-groceryview-user-id'));
  const reporterId = text(body?.reporterId);
  const productId = text(body?.productId);
  const commodityAlias = text(body?.commodityAlias);
  const storeId = text(body?.storeId);
  const storeName = text(body?.storeName);
  const observedAt = text(body?.observedAt);
  const reportedPrice = positiveNumber(body?.reportedPrice);
  const currency = text(body?.currency) || 'SEK';
  const photo = photoEvidence(body?.photoEvidence);

  if (!accountUserId || !reporterId || accountUserId !== reporterId) {
    return NextResponse.json({ error: 'Account-bound reporterId and x-groceryview-user-id are required.' }, { status: 401 });
  }

  if ((!productId && !commodityAlias) || !storeId || !observedAt || reportedPrice === null || currency !== 'SEK' || !photo) {
    return NextResponse.json({
      error: 'productId or commodityAlias, storeId, observedAt, SEK reportedPrice, and image photoEvidence are required.'
    }, { status: 400 });
  }

  const reporterActivity = body?.reporterActivity && typeof body.reporterActivity === 'object'
    ? body.reporterActivity as ReporterActivityBody
    : {};
  const abuseControl = planCommunityReportAbuseControls({
    reporters: [{
      reporterId,
      reportsLast24Hours: nonNegativeInteger(reporterActivity.reportsLast24Hours) + 1,
      pendingReports: nonNegativeInteger(reporterActivity.pendingReports),
      acceptedReportsLast30Days: nonNegativeInteger(reporterActivity.acceptedReportsLast30Days),
      rejectedReportsLast30Days: nonNegativeInteger(reporterActivity.rejectedReportsLast30Days)
    }]
  })[0];
  const priceOutlierCheck = outlierCheck(reportedPrice, comparablePrices(body?.comparablePrices));
  const confidenceScore = abuseControl.action === 'allow' && !priceOutlierCheck.requiresManualReview ? 0.82 : 0.42;
  const reportId = `community-price-${reporterId}-${Date.parse(observedAt) || Date.now()}`;
  const reviewQueue = planHumanReviewQueue({
    productMatches: [],
    communityReports: [{
      id: reportId,
      productId: productId || `commodity:${commodityAlias}`,
      reporterId,
      reportType: 'wrong_price',
      confidenceScore,
      createdAt: new Date().toISOString()
    }]
  });

  return NextResponse.json({
    report: {
      id: reportId,
      reporterId,
      productId: productId || null,
      commodityAlias: commodityAlias || null,
      storeId,
      storeName: storeName || storeId,
      observedAt,
      reportedPrice,
      currency,
      photoEvidence: photo
    },
    status: 'queued_for_human_review',
    publicDisplay: false,
    canImproveCoverageAfterReview: true,
    abuseControl,
    outlierCheck: priceOutlierCheck,
    reviewQueue,
    reviewWritebacks: ['accept_community_report', 'dismiss_community_report']
  }, { status: 202 });
}
