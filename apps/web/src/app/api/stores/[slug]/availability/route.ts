import { NextResponse } from 'next/server';
import { findStore, storeAssortmentOverviewForStore } from '@/lib/verified-data';

const DAY_MS = 24 * 60 * 60 * 1000;

function sourceFreshnessDays(retrievedDate: string) {
  const retrievedAt = new Date(retrievedDate);
  if (Number.isNaN(retrievedAt.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - retrievedAt.getTime()) / DAY_MS));
}

function stockAvailabilityForStore(retrievedDate: string, branchItemCount: number) {
  if (branchItemCount === 0) {
    return {
      label: 'Stock unknown',
      confidence: 'low',
      freshnessDays: null,
      detail: 'No branch-specific product rows are matched yet.'
    };
  }

  const freshnessDays = sourceFreshnessDays(retrievedDate);
  if (freshnessDays === null) {
    return {
      label: 'Stock unknown',
      confidence: 'low',
      freshnessDays,
      detail: 'Source freshness is unavailable.'
    };
  }
  if (freshnessDays <= 14) {
    return {
      label: 'Likely in stock',
      confidence: 'high',
      freshnessDays,
      detail: 'Branch data is fresh enough to show high-confidence availability.'
    };
  }
  if (freshnessDays <= 45) {
    return {
      label: 'Check stock',
      confidence: 'medium',
      freshnessDays,
      detail: 'Branch data is recent but shoppers should confirm before travelling.'
    };
  }
  return {
    label: 'Stock stale',
    confidence: 'low',
    freshnessDays,
    detail: 'Branch data is stale, so availability is low confidence.'
  };
}

export async function GET(_request: Request, { params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const store = findStore(slug);
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const assortmentOverview = storeAssortmentOverviewForStore(store);
  const stockAvailability = stockAvailabilityForStore(store.retrievedDate, assortmentOverview.items.length);

  return NextResponse.json({
    store: {
      slug: store.slug,
      name: store.name,
      brand: store.brand
    },
    stockAvailability,
    products: assortmentOverview.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      priceLabel: item.priceLabel,
      validWindow: item.validWindow,
      stockAvailability
    }))
  });
}
