import { AccountMutationActions } from '@/components/account-mutation-actions';
import { AdDisclosureActions } from '@/components/ad-disclosure-actions';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { accountSavedShoppingContract } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/account');
}

export default function AccountPage() {
  return (
    <PageShell>
      <Eyebrow>Account shopping state</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Saved baskets & favorite stores</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView now surfaces the real account API contract for saved shopping state while keeping private rows available to signed-in shoppers only. The public static build describes the production contract and stays closed when authenticated account records are absent.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Account-bound contract</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">{accountSavedShoppingContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Favorite stores are managed through <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{accountSavedShoppingContract.favoriteStoresEndpoint}</code> and removals use <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{accountSavedShoppingContract.favoriteStoreDeleteEndpoint}</code>. Saved recurring baskets persist to <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">weekly_baskets</code> with line items in <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">basket_items</code> so basket, alert, and digest features share account-owned state.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {accountSavedShoppingContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {accountSavedShoppingContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {accountSavedShoppingContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <AccountMutationActions />
      <AdDisclosureActions />

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <Eyebrow>Favorite stores</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Account routes, not anonymous preferences</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The favorite stores surface is intentionally described as account-only: a production session supplies the userId, the selected store must come from verified GroceryView store records, and favorite stores can then drive watchlists, nearby comparisons, recurring digests, and basket trip-cost ranking.
          </p>
        </Card>
        <Card>
          <Eyebrow>Saved weekly baskets</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">weekly_baskets + basket_items</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Saved templates stay in weekly_baskets while each product quantity stays in basket_items. This keeps the account record auditable, lets the server recompute prices from verified product rows, and avoids showing private basket lines in the static public snapshot.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
