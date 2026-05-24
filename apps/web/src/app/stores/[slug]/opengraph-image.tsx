import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { findStore, storeOpeningHoursLabel, storeUniverse } from '@/lib/verified-data';

export const alt = 'GroceryView verified store record social image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return storeUniverse.slice(0, 80).map((store) => ({ slug: store.slug }));
}

export default async function Image({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const store = findStore(slug);
  if (!store) notFound();

  const place = [store.district, store.city].filter(Boolean).join(', ') || 'Location from OSM';
  const openingHours = storeOpeningHoursLabel(store);
  const coordinates = `${store.lat}, ${store.lng}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          color: '#0f172a',
          padding: '58px',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, background: '#0f766e', marginRight: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 30, fontWeight: 900 }}>GroceryView</div>
              <div style={{ fontSize: 18, color: '#0f766e', fontWeight: 800 }}>Verified Swedish store directory</div>
            </div>
          </div>
          <div style={{ border: '2px solid #0f766e', borderRadius: 999, color: '#115e59', padding: '12px 18px', fontSize: 18, fontWeight: 900 }}>
            {store.brand}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, marginTop: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 46 }}>
            <div style={{ fontSize: 22, color: '#115e59', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3 }}>
              OpenStreetMap store record
            </div>
            <div style={{ fontSize: 66, lineHeight: 1.02, fontWeight: 900, marginTop: 18 }}>
              {store.name}
            </div>
            <div style={{ fontSize: 27, color: '#334155', fontWeight: 800, marginTop: 18 }}>
              {place}
            </div>
            <div style={{ display: 'flex', marginTop: 36 }}>
              <div style={{ borderRadius: 24, background: '#ccfbf1', padding: '18px 22px', marginRight: 16 }}>
                <div style={{ fontSize: 16, color: '#115e59', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Format</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 5 }}>{store.format}</div>
              </div>
              <div style={{ borderRadius: 24, background: '#e2e8f0', padding: '18px 22px' }}>
                <div style={{ fontSize: 16, color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Hours</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 5 }}>{openingHours}</div>
              </div>
            </div>
          </div>

          <div style={{ width: 350, display: 'flex', flexDirection: 'column', borderRadius: 30, background: '#ffffff', border: '2px solid #99f6e4', padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f766e', textTransform: 'uppercase', letterSpacing: 2 }}>
              Location evidence
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22, fontSize: 24, fontWeight: 900, color: '#334155' }}>
              <div style={{ borderBottom: '1px solid #ccfbf1', paddingBottom: 16 }}>
                <div style={{ fontSize: 16, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Address</div>
                <div style={{ marginTop: 7 }}>{store.address || 'Not reported by OSM'}</div>
              </div>
              <div style={{ borderBottom: '1px solid #ccfbf1', padding: '16px 0' }}>
                <div style={{ fontSize: 16, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Coordinates</div>
                <div style={{ marginTop: 7 }}>{coordinates}</div>
              </div>
              <div style={{ paddingTop: 16 }}>
                <div style={{ fontSize: 16, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Source</div>
                <div style={{ marginTop: 7 }}>{store.source}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #99f6e4', paddingTop: 22 }}>
          <div style={{ fontSize: 21, color: '#334155', fontWeight: 800 }}>No synthetic prices: store pages use verified OSM location fields only.</div>
          <div style={{ fontSize: 24, color: '#115e59', fontWeight: 900 }}>grocery-web-mu.vercel.app</div>
        </div>
      </div>
    ),
    size
  );
}
