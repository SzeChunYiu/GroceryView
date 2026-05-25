import ProductsPage from '../products/page';
import { BestTimeForecastPanel } from '@/components/price-intelligence-card';
import { buildBestTimeToBuyAlert, buildBestTimeToBuyForecastPanel } from '@/lib/price-intelligence';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/items');
}

const itemForecastPanel = buildBestTimeToBuyForecastPanel([
  buildBestTimeToBuyAlert({
    productId: 'zoegas-skane-450g',
    productName: 'Zoégas Skåne 450g',
    currentPrice: 69.9,
    currentStoreName: 'Coop',
    now: '2026-05-25T10:00:00.000Z',
    priceHistory: [
      { observedAt: '2026-05-04T08:00:00.000Z', price: 79.9 },
      { observedAt: '2026-05-11T08:00:00.000Z', price: 74.9 },
      { observedAt: '2026-05-18T08:00:00.000Z', price: 72.9 },
      { observedAt: '2026-05-25T08:00:00.000Z', price: 69.9 }
    ],
    upcomingFlyerWindows: [{ storeName: 'Coop', categoryLabel: 'coffee', startsAt: '2026-05-29T06:00:00.000Z', endsAt: '2026-06-04T21:59:59.000Z', expectedDiscountPct: 8 }]
  }),
  buildBestTimeToBuyAlert({
    productId: 'arla-mellanmjolk-1l',
    productName: 'Arla Mellanmjölk 1L',
    currentPrice: 17.9,
    currentStoreName: 'Willys',
    now: '2026-05-25T10:00:00.000Z',
    priceHistory: [
      { observedAt: '2026-05-04T08:00:00.000Z', price: 18.9 },
      { observedAt: '2026-05-11T08:00:00.000Z', price: 18.4 },
      { observedAt: '2026-05-18T08:00:00.000Z', price: 17.9 },
      { observedAt: '2026-05-25T08:00:00.000Z', price: 17.9 }
    ],
    upcomingFlyerWindows: []
  })
]);

export default async function ItemsPage(props: Parameters<typeof ProductsPage>[0]) {
  return (
    <>
      <BestTimeForecastPanel {...itemForecastPanel} />
      <ProductsPage {...props} />
    </>
  );
}
