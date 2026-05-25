import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { findProduct, productUniverse } from '@/lib/verified-data';
import { itemOpenGraphModel, itemOpenGraphSize } from '@/lib/og';

export const alt = 'GroceryView item price social image';
export const size = itemOpenGraphSize;
export const contentType = 'image/png';

export function generateStaticParams() {
  return productUniverse.map((product) => ({ id: product.slug }));
}

export default async function Image({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();

  const model = itemOpenGraphModel(product, id);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f8fafc 54%, #d1fae5 100%)',
          color: '#0f172a',
          padding: 56,
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, background: '#047857', marginRight: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: 900 }}>GroceryView</div>
              <div style={{ display: 'flex', fontSize: 19, color: '#047857', fontWeight: 800 }}>Verified item price card</div>
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 22, color: '#065f46', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3 }}>
            {model.category}
          </div>
          <div style={{ display: 'flex', fontSize: 66, lineHeight: 1.02, fontWeight: 900, marginTop: 18 }}>
            {model.name}
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#334155', fontWeight: 800, marginTop: 16 }}>
            {model.brand}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
            <div style={{ display: 'flex', fontSize: 24, color: '#334155', fontWeight: 900 }}>{model.priceContext}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 8 }}>
              <div style={{ display: 'flex', fontSize: 92, lineHeight: 1, color: '#047857', fontWeight: 900 }}>{model.priceLabel}</div>
            </div>
            <div style={{ display: 'flex', fontSize: 22, color: '#475569', fontWeight: 800, marginTop: 14 }}>
              {model.evidenceLabel} · no synthetic prices
            </div>
          </div>
        </div>

        <div
          style={{
            width: 390,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 36,
            background: '#ffffff',
            border: '2px solid #bbf7d0',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
            padding: 24
          }}
        >
          {model.image ? (
            <img
              src={model.image}
              alt=""
              width={342}
              height={342}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#047857', fontWeight: 900 }}>
              <div style={{ display: 'flex', fontSize: 92 }}>GV</div>
              <div style={{ display: 'flex', fontSize: 24, marginTop: 16 }}>No item photo</div>
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
