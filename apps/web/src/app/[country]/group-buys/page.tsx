import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const bulkTierPromos = [
  { id: 'coffee-case', title: 'Coffee case split', product: 'Bryggkaffe 12-pack', threshold: 12, pledged: 8, pickupPoint: 'Willys Odenplan', paymentSplit: 'pro rata by packs' },
  { id: 'diaper-box', title: 'Diaper box team-up', product: 'Diapers size 4 bulk box', threshold: 4, pledged: 3, pickupPoint: 'ICA Kvantum', paymentSplit: 'equal per box' }
];

export default function GroupBuysPage() {
  return (
    <PageShell>
      <Eyebrow>Bulk discount unlock</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Group-buy coordinator</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Coordinate household and friend purchases when a verified bulk-tier promotion requires more units than one shopper needs.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {bulkTierPromos.map((promo) => {
          const remaining = Math.max(0, promo.threshold - promo.pledged);
          return (
            <Card key={promo.id}>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">{promo.product}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{promo.title}</h2>
              <p className="mt-3 text-sm font-semibold text-slate-700">{promo.pledged}/{promo.threshold} units pledged · {remaining} to unlock</p>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                <p className="rounded-2xl bg-slate-50 p-3">Shared list: households add pledged units before checkout.</p>
                <p className="rounded-2xl bg-slate-50 p-3">Pickup point: {promo.pickupPoint}</p>
                <p className="rounded-2xl bg-slate-50 p-3">Payment split: {promo.paymentSplit}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
