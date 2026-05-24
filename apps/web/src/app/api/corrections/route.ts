import { NextResponse, type NextRequest } from 'next/server';

type CorrectionStatus = 'pending_review' | 'confirmed' | 'rejected';

type QaFinding = {
  table: 'qa_findings';
  listing: string;
  store: string;
  observed_price: number;
  photo?: string;
  status: CorrectionStatus;
  reviewer_threshold: 3;
  should_update_observation: boolean;
};

function text(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const listing = text(formData.get('listing'));
  const store = text(formData.get('store'));
  const observedPrice = Number(text(formData.get('observed_price')));
  const photo = text(formData.get('photo'));
  const confirmations = Number(text(formData.get('confirmations')) || '1');
  const staffReviewed = text(formData.get('staff_review')) === 'true';

  if (!listing || !store || !Number.isFinite(observedPrice) || observedPrice < 0) {
    return NextResponse.json({ error: 'listing, store, and observed_price are required' }, { status: 400 });
  }

  const shouldUpdateObservation = confirmations >= 3 || staffReviewed;
  const finding: QaFinding = {
    table: 'qa_findings',
    listing,
    store,
    observed_price: observedPrice,
    ...(photo ? { photo } : {}),
    status: shouldUpdateObservation ? 'confirmed' : 'pending_review',
    reviewer_threshold: 3,
    should_update_observation: shouldUpdateObservation
  };

  return NextResponse.json({ finding });
}
