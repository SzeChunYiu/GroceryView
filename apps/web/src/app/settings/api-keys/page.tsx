import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const apiKeyRows = [
  { name: 'Price dashboard integration', prefix: 'gv_live', last4: '8f2a', scope: 'read:prices', status: 'Active' },
  { name: 'Revoked notebook key', prefix: 'gv_test', last4: '19dc', scope: 'read:prices', status: 'Revoked' }
];

export function generateMetadata() {
  return routeMetadata('/settings/api-keys');
}

export default function ApiKeysSettingsPage() {
  return (
    <PageShell>
      <Eyebrow>Developer access</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">API keys</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Generate and revoke signed-in API keys for programmatic GroceryView API access. Secrets are shown once, stored only as hashes, and revoked keys cannot be used again.
      </p>
      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">Create a new API key</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">POST /api/settings/api-keys with a signed-in bearer token. Copy the returned secret immediately; subsequent list calls only show prefix and last four characters.</p>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" action="/api/settings/api-keys" method="post">
          <label className="sr-only" htmlFor="api-key-name">Key name</label>
          <input className="rounded-2xl border border-emerald-200 px-4 py-3 font-semibold" id="api-key-name" name="name" placeholder="Automation name" />
          <button className="rounded-2xl bg-emerald-900 px-5 py-3 font-black text-white" type="submit">Generate key</button>
        </form>
      </Card>
      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Current keys</h2>
            <p className="mt-2 text-sm font-semibold text-slate-700">GET /api/settings/api-keys returns account-owned key metadata only, never raw secrets.</p>
          </div>
          <Link className="font-black text-emerald-800" href="/settings">Back to settings</Link>
        </div>
        <div className="mt-4 grid gap-3">
          {apiKeyRows.map((row) => (
            <div className="rounded-2xl border border-slate-200 p-4" key={`${row.prefix}-${row.last4}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-slate-950">{row.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{row.prefix}…{row.last4} · {row.scope} · {row.status}</p>
                </div>
                <form action={`/api/settings/api-keys/${row.prefix}-${row.last4}`} method="post">
                  <input name="_method" type="hidden" value="delete" />
                  <button className="rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-800" type="submit">Revoke</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
