import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';

type ExpiryDealRowItem = {
  id: string;
  productId: string;
  productName: string;
  storeName: string;
  category: string;
  source: string;
  currentPrice: number;
  savings: number;
  markdownPercent: number;
  radarScore: number;
  hoursUntilExpiry: number;
  urgency: string;
  verification: 'verified' | 'needs_confirmation';
  photoCount: number;
  verificationCount: number;
};

type ExpiryDealRowProps = {
  item: ExpiryDealRowItem;
};

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatHours(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
}

function confidenceFor(item: ExpiryDealRowItem) {
  if (item.verification === 'verified') {
    return {
      level: 'high' as const,
      label: item.photoCount > 0 ? 'photo verified' : 'multi-report verified',
      sampleSize: item.verificationCount + item.photoCount
    };
  }

  return {
    level: 'low' as const,
    label: 'needs confirmation',
    sampleSize: item.verificationCount + item.photoCount
  };
}

export function ExpiryDealRow({ item }: ExpiryDealRowProps) {
  const confidence = confidenceFor(item);

  return (
    <Link className="block rounded-lg border border-emerald-100 bg-white p-4 shadow-sm hover:border-emerald-700" href={`/products/${item.productId}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{item.storeName} - {item.category}</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{item.productName}</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{item.source}</p>
          <div className="mt-3">
            <ConfidenceBadge {...confidence} />
          </div>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
          <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Now</span>{formatSek(item.currentPrice)}</p>
          <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Save</span>{formatSek(item.savings)}</p>
          <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Markdown</span>{item.markdownPercent}%</p>
          <p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs uppercase text-slate-500">Score</span>{item.radarScore}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 md:grid-cols-3">
        <p className="rounded-lg bg-slate-50 p-3">Expires in {formatHours(item.hoursUntilExpiry)} hours</p>
        <p className="rounded-lg bg-slate-50 p-3">{item.urgency.replace('_', ' ')}</p>
        <p className="rounded-lg bg-slate-50 p-3">{item.verification.replace('_', ' ')}</p>
      </div>
    </Link>
  );
}
