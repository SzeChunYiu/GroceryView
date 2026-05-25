import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CorrectionBody = {
  listing?: unknown;
  store?: unknown;
  observed_price?: unknown;
  photo?: unknown;
  reporterId?: unknown;
  staffReview?: unknown;
};

type QaFinding = {
  id: string;
  listing: string;
  store: string;
  observed_price: number;
  photo?: string;
  reporterId: string;
  status: 'qa_findings' | 'observation_updated';
  createdAt: string;
};

const qaFindings: QaFinding[] = [];
const observationUpdates = new Map<string, { listing: string; store: string; observed_price: number; confirmedBy: number; updatedAt: string }>();

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function correctionKey(listing: string, store: string, observedPrice: number) {
  return `${listing.toLowerCase()}::${store.toLowerCase()}::${observedPrice.toFixed(2)}`;
}

export async function GET() {
  return NextResponse.json({ qa_findings: qaFindings, observationUpdates: Array.from(observationUpdates.values()) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as CorrectionBody | null;
  const listing = normalizeText(body?.listing);
  const store = normalizeText(body?.store);
  const observedPrice = Number(body?.observed_price);
  const photo = normalizeText(body?.photo);
  const reporterId = normalizeText(body?.reporterId) || 'anonymous';
  const staffReview = body?.staffReview === true;

  if (!listing || !store || !Number.isFinite(observedPrice) || observedPrice <= 0) {
    return NextResponse.json({ error: 'listing, store, and positive observed_price are required.' }, { status: 400 });
  }

  const finding: QaFinding = {
    id: `qa-${Date.now()}-${qaFindings.length + 1}`,
    listing,
    store,
    observed_price: Math.round(observedPrice * 100) / 100,
    ...(photo ? { photo } : {}),
    reporterId,
    status: 'qa_findings',
    createdAt: new Date().toISOString()
  };
  qaFindings.unshift(finding);

  const key = correctionKey(finding.listing, finding.store, finding.observed_price);
  const uniqueConfirmers = new Set(
    qaFindings
      .filter((item) => correctionKey(item.listing, item.store, item.observed_price) === key)
      .map((item) => item.reporterId)
  );

  if (staffReview || uniqueConfirmers.size >= 3) {
    finding.status = 'observation_updated';
    observationUpdates.set(key, {
      listing: finding.listing,
      store: finding.store,
      observed_price: finding.observed_price,
      confirmedBy: uniqueConfirmers.size,
      updatedAt: finding.createdAt
    });
  }

  return NextResponse.json({
    correction: finding,
    queue: 'qa_findings',
    confirmationCount: uniqueConfirmers.size,
    observationUpdated: finding.status === 'observation_updated'
  }, { status: 201 });
}
