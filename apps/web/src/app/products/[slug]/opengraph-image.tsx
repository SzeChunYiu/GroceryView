import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { chainPriceRows, findProduct, formatPct, formatSek, labelFromSlug, productUniverse } from '@/lib/verified-data';

export const alt = 'GroceryView verified product price social image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Product = NonNullable<ReturnType<typeof findProduct>>;

type PriceSignal = {
  priceLabel: string;
  sourceLabel: string;
  spreadLabel: string;
  caveat: string;
  rows: Array<{ label: string; value: string }>;
};

function brandFor(product: Product) {
  return 'lowestPrice' in product ? product.brand : product.brands || 'Brand not reported';
}

function priceSignalFor(product: Product) {
  if ('lowestPrice' in product) {
    const rows = chainPriceRows(product)
      .filter((row): row is ReturnType<typeof chainPriceRows>[number] & { price: number } => typeof row.price === 'number')
      .sort((left, right) => left.price - right.price);
    return {
      priceLabel: formatSek(product.lowestPrice),
      sourceLabel: `Verified price signal · ${product.lowestChain} lowest`,
      spreadLabel: `${formatPct(product.spreadPct)} cross-chain spread`,
      caveat: 'No synthetic prices: rendered from observed Willys/Hemköp public price rows only.',
      rows: rows.slice(0, 4).map((row) => ({ label: row.chain, value: formatSek(row.price) }))
    } satisfies PriceSignal;
  }

  const latestRows = [...product.observations]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4)
    .map((observation) => ({ label: observation.date, value: formatSek(observation.price) }));

  return {
    priceLabel: formatSek(product.priceMedian),
    sourceLabel: 'Verified price signal · OpenPrices median',
    spreadLabel: `${product.observationCount.toLocaleString('sv-SE')} observations · ${formatSek(product.priceMin)}–${formatSek(product.priceMax)}`,
    caveat: 'No synthetic prices: rendered from dated OpenPrices observations only.',
    rows: latestRows
  } satisfies PriceSignal;
}

export function generateStaticParams() {
  return productUniverse.map((product) => ({ slug: product.slug }));
}

export default async function Image({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const signal = priceSignalFor(product);
  const category = labelFromSlug(product.category);
  const brand = brandFor(product);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ecfdf5',
          color: '#0f172a',
          padding: '58px',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#047857', marginRight: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 30, fontWeight: 900 }}>GroceryView</div>
              <div style={{ fontSize: 18, color: '#047857', fontWeight: 800 }}>Swedish grocery price terminal</div>
            </div>
          </div>
          <div style={{ border: '2px solid #047857', borderRadius: 999, color: '#065f46', padding: '12px 18px', fontSize: 18, fontWeight: 900 }}>
            {category}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, marginTop: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 42 }}>
            <div style={{ fontSize: 22, color: '#065f46', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3 }}>
              {signal.sourceLabel}
            </div>
            <div style={{ fontSize: 62, lineHeight: 1.02, fontWeight: 900, marginTop: 18 }}>
              {product.name}
            </div>
            <div style={{ fontSize: 25, color: '#334155', fontWeight: 800, marginTop: 16 }}>
              {brand}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 34 }}>
              <div style={{ fontSize: 80, lineHeight: 1, color: '#047857', fontWeight: 900 }}>
                {signal.priceLabel}
              </div>
              <div style={{ marginLeft: 22, marginBottom: 10, fontSize: 24, color: '#334155', fontWeight: 900 }}>
                {signal.spreadLabel}
              </div>
            </div>
          </div>

          <div style={{ width: 340, display: 'flex', flexDirection: 'column', borderRadius: 30, background: '#ffffff', border: '2px solid #bbf7d0', padding: 26 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#047857', textTransform: 'uppercase', letterSpacing: 2 }}>
              Price evidence
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
              {signal.rows.length > 0 ? signal.rows.map((row) => (
                <div key={`${row.label}-${row.value}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1fae5', padding: '11px 0', fontSize: 23, fontWeight: 900 }}>
                  <span style={{ color: '#334155' }}>{row.label}</span>
                  <span style={{ color: '#047857' }}>{row.value}</span>
                </div>
              )) : (
                <div style={{ fontSize: 23, color: '#334155', fontWeight: 900 }}>No public rows available</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #bbf7d0', paddingTop: 22 }}>
          <div style={{ fontSize: 21, color: '#334155', fontWeight: 800 }}>{signal.caveat}</div>
          <div style={{ fontSize: 24, color: '#065f46', fontWeight: 900 }}>grocery-web-mu.vercel.app</div>
        </div>
      </div>
    ),
    size
  );
}
