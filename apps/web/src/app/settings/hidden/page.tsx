import Link from 'next/link';
import { HiddenSettingsActions, type HiddenPreferenceOption } from '@/components/hidden-settings-actions';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { productUniverse, storeUniverse } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/settings');
}

function productDescription(product: (typeof productUniverse)[number]) {
  return 'lowestPrice' in product
    ? `${product.brand} - ${product.subline}`
    : `${product.brands || 'Brand not reported'} - ${product.quantity || 'Quantity not reported'}`;
}

const initialProductOptions: HiddenPreferenceOption[] = productUniverse.slice(0, 18).map((product) => ({
  id: product.slug,
  label: product.name,
  description: productDescription(product)
}));

const initialStoreOptions: HiddenPreferenceOption[] = storeUniverse.slice(0, 18).map((store) => ({
  id: store.slug,
  label: store.name,
  description: [store.brand, store.city || store.district || 'Sweden'].filter(Boolean).join(' - ')
}));

export default function HiddenSettingsPage() {
  return (
    <PageShell>
      <Eyebrow>Settings</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Hidden products and stores</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Hide products or stores from personalized recommendations with searchable pickers instead of raw id textareas.
      </p>
      <HiddenSettingsActions
        initialHiddenProductIds={[]}
        initialHiddenStoreIds={[]}
        initialProductOptions={initialProductOptions}
        initialStoreOptions={initialStoreOptions}
      />
      <Card className="mt-6 border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-black text-slate-950">Save contract</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          The form saves <code className="rounded bg-white px-1 py-0.5">hiddenProductIds</code> and <code className="rounded bg-white px-1 py-0.5">hiddenStoreIds</code> to <code className="rounded bg-white px-1 py-0.5">/api/settings/hidden</code>.
        </p>
        <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/settings">
          Back to settings
        </Link>
      </Card>
    </PageShell>
  );
}
