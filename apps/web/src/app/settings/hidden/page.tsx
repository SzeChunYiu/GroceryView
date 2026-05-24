import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { HiddenSettingsActions } from '@/components/hidden-settings-actions';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/settings/hidden',
    title: 'Hidden products and stores | GroceryView',
    description: 'Search verified GroceryView product and store APIs, add chips, and save signed-in hidden preferences without raw id textareas.',
    noIndex: true
  });
}

export default function HiddenSettingsPage() {
  return (
    <PageShell>
      <Eyebrow>Account settings</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Hidden products and stores</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Search verified product and store APIs, add chips for anything you never want in signed-in comparisons, then save through the existing <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-900">/api/settings/hidden</code> contract.
      </p>

      <Card className="mt-6 overflow-hidden border-slate-200 bg-white">
        <div className="mb-6 rounded-[1.75rem] bg-slate-950 p-5 text-white">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Searchable preference pickers</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">No raw id textareas</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Product options come from <code className="rounded bg-white/10 px-1 py-0.5">/api/products</code>, store options come from <code className="rounded bg-white/10 px-1 py-0.5">/api/stores</code>, and every selected value is saved as the same hiddenProductIds / hiddenStoreIds payload the existing endpoint expects.
          </p>
        </div>
        <HiddenSettingsActions />
        <div className="mt-6">
          <Link className="inline-flex rounded-full border border-emerald-200 px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50" href="/settings">
            Account settings
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
