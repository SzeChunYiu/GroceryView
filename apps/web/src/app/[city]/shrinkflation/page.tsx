import { detectShrinkflation, normalizePackageSize, type ShrinkflationObservation } from '@groceryview/core';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { unitPriceAlertDesk } from '@/lib/demo-data';

function parseSek(value: string) {
  const parsed = Number(value.replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0] ?? Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePackageSize(value: string): { packageSize: number; packageUnit: string } | null {
  const match = value.trim().toLowerCase().match(/(\d+(?:[,.]\d+)?)\s*(kg|g|l|ml|cl|dl|st|each|frp)/);
  if (!match) return null;
  return { packageSize: Number(match[1].replace(',', '.')), packageUnit: match[2] };
}

const observations: ShrinkflationObservation[] = unitPriceAlertDesk.flatMap((row) => {
  const parsedPackage = parsePackageSize(row.packageSize);
  const price = parseSek(row.shelfPrice);
  if (!parsedPackage || price == null) return [];
  return [{
    canonicalProductId: row.productSlug,
    productName: row.productName,
    observedAt: '2026-05-24T00:00:00.000Z',
    price,
    packageSize: parsedPackage.packageSize,
    packageUnit: parsedPackage.packageUnit,
    chainId: row.storeName.split(' ')[0],
    sourceLabel: `${row.storeName} unit-price alert desk`,
    sourceConfidence: 0.8
  }];
});

const shrinkflationSignals = detectShrinkflation(observations);
const trackedRows = observations.map((observation) => ({
  ...observation,
  normalizedPackageSize: normalizePackageSize(observation.packageSize, observation.packageUnit)
}));

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatPct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function generateStaticParams() {
  return [{ city: 'se' }, { city: 'sv' }];
}

export default function ShrinkflationPage() {
  return (
    <PageShell>
      <Eyebrow>Shrinkflation detector</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Pack-size drops with flat or higher shelf prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This country route runs the core shrinkflation detector against canonical product observations. A signal is emitted only when the same canonical product has a smaller comparable pack and the shelf price stayed flat or rose; single-snapshot rows stay in watch mode rather than being inflated into claims.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Confirmed signals</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{shrinkflationSignals.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Detected from comparable multi-date canonical rows only.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Tracked packs</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{trackedRows.length}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Visible unit-price alert products with parseable pack sizes.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Guardrail</p>
          <p className="mt-2 text-2xl font-black text-slate-950">No invented history</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Current-only rows are listed as coverage until a later observation arrives.</p>
        </Card>
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Current detector output</h2>
        {shrinkflationSignals.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {shrinkflationSignals.map((signal) => (
              <div className="rounded-2xl bg-white/85 p-4" key={`${signal.canonicalProductId}-${signal.current.observedAt}`}>
                <p className="text-lg font-black text-slate-950">{signal.productName}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Pack {signal.previous.normalizedPackageSize.label} → {signal.current.normalizedPackageSize.label}; shelf price {formatSek(signal.previous.price)} → {formatSek(signal.current.price)}.
                </p>
                <p className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">
                  {formatPct(signal.packageDecreasePercent)} pack size · {formatPct(signal.unitPriceChangePercent)} unit price
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-white/85 p-4 text-sm font-bold leading-6 text-amber-950">
            No confirmed shrinkflation signal is shown for the current visible snapshot because each canonical product has only one dated pack-size observation. The detector is active, but the UI refuses to fabricate previous package sizes.
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Observed pack-size watchlist</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {trackedRows.map((row) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.canonicalProductId}>
              <p className="font-black text-slate-950">{row.productName}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.sourceLabel}</p>
              <p className="mt-3 text-sm font-bold text-slate-700">Pack: {row.normalizedPackageSize?.label ?? `${row.packageSize}${row.packageUnit}`} · shelf {formatSek(row.price)}</p>
            </div>
          ))}
        </div>
      </Card>

      <SourceCoverage />
    </PageShell>
  );
}
