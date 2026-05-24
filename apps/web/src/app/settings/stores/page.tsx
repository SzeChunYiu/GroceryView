import { StoreSelector, type StoreSelectorOption } from '@/components/StoreSelector';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { osmStores } from '@/lib/osm-stores';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/settings/stores');
}

const defaultPreferredStoreIds = [
  'ica-kvantum-liljeholmen-stockholm-1281441051',
  'willys-goteborg-gamlestaden-goteborg-3373434393',
  'lidl-angered-631922258'
];

function storeOptions(): StoreSelectorOption[] {
  return osmStores
    .filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng))
    .map((store) => ({
      id: store.slug,
      name: store.name,
      brand: store.brand || 'Other',
      district: store.district || store.city,
      address: store.address
    }))
    .sort((left, right) => {
      const leftLocation = `${left.district} ${left.name}`;
      const rightLocation = `${right.district} ${right.name}`;
      return leftLocation.localeCompare(rightLocation, 'sv');
    });
}

export default function SettingsStoresPage() {
  const stores = storeOptions();

  return (
    <PageShell>
      <Eyebrow>Account settings</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Preferred stores</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Select the stores you visit most often. GroceryView keeps the preference on this device and mirrors the same 1-5 store limit as the settings API contract.
      </p>

      <div className="mt-6">
        <StoreSelector
          apiEndpoint="/api/users/demo/settings/preferred-stores"
          initialPreferredStoreIds={defaultPreferredStoreIds}
          stores={stores}
        />
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Preference scope</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Comparison ordering only</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          Preferred stores change row order in supported comparison views and map lists. They do not create retailer accounts, checkout sessions, saved shopper locations, or synthetic prices.
        </p>
      </Card>
    </PageShell>
  );
}
