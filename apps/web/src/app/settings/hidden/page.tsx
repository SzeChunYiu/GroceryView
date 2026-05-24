import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { HiddenSettingsActions } from '@/components/hidden-settings-actions';

export default function HiddenSettingsPage() {
  return (
    <PageShell>
      <Eyebrow>Account settings</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Hidden items and stores</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Hide product ids or store ids you never shop so signed-in comparisons, basket results, product search, and store lists do not include them.
      </p>

      <Card className="mt-6 border-emerald-200 bg-white">
        <HiddenSettingsActions />
        <div className="mt-5">
          <Link className="inline-flex rounded-full border border-emerald-200 px-4 py-2 text-sm font-black text-emerald-900" href="/settings">
            Account settings
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
