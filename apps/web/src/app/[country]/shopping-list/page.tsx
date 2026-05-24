'use client';

import { useMemo, useState } from 'react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type ShoppingListPageProps = {
  params: { country: string };
};

const listItems = [
  { id: 'oats', name: 'Oats', qty: '1 kg', cheapestStore: 'Willys', price: 18, distanceMinutes: 6, promotion: 'Member price', secondStore: 'ICA', secondPrice: 23 },
  { id: 'coffee', name: 'Coffee', qty: '450 g', cheapestStore: 'ICA', price: 49, distanceMinutes: 9, promotion: '2 for deal nearby', secondStore: 'Willys', secondPrice: 58 },
  { id: 'milk', name: 'Milk', qty: '1 l', cheapestStore: 'Coop', price: 15, distanceMinutes: 5, promotion: 'Local campaign', secondStore: 'ICA', secondPrice: 17 },
  { id: 'pasta', name: 'Pasta', qty: '500 g', cheapestStore: 'Willys', price: 12, distanceMinutes: 6, promotion: 'Shelf low', secondStore: 'Coop', secondPrice: 16 }
];

function currencyForCountry(country: string) {
  if (country === 'no') return 'NOK';
  if (country === 'dk') return 'DKK';
  if (country === 'fi') return 'EUR';
  return 'SEK';
}

export default function SmartShoppingListPage({ params }: ShoppingListPageProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const country = params.country.toLowerCase();
  const currency = currencyForCountry(country);
  const formatter = useMemo(() => new Intl.NumberFormat('sv-SE', { currency, maximumFractionDigits: 0, style: 'currency' }), [currency]);
  const totalSavings = listItems.reduce((sum, item) => sum + Math.max(0, item.secondPrice - item.price), 0);
  const visitOrder = ['Willys', 'ICA'];
  const twoStopSavesEnough = totalSavings > 25;

  return (
    <PageShell>
      <Eyebrow>Smart shopping list</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Cheapest source for every item</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Prices combine current store offers, route distance, and promotions so each item shows the practical cheapest source right now.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <h2 className="text-2xl font-black text-slate-950">Route recommendation</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          {twoStopSavesEnough
            ? `Visit ${visitOrder.join(' then ')}. The second stop saves ${formatter.format(totalSavings)} after the route threshold.`
            : 'Use one nearby store; a second stop does not clear the savings threshold.'}
        </p>
      </Card>

      <div className="mt-6 grid gap-3">
        {listItems.map((item) => {
          const checked = checkedItems.includes(item.id);
          return (
            <Card className={checked ? 'opacity-60' : ''} key={item.id}>
              <label className="flex gap-3">
                <input
                  checked={checked}
                  className="mt-1 h-5 w-5"
                  onChange={() => setCheckedItems((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}
                  type="checkbox"
                />
                <span className="flex-1">
                  <span className="block text-xl font-black text-slate-950">{item.name} · {item.qty}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-600">Cheapest now: {item.cheapestStore} at {formatter.format(item.price)} · {item.distanceMinutes} min away · {item.promotion}</span>
                  <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900">Alternative {item.secondStore}: {formatter.format(item.secondPrice)}</span>
                </span>
              </label>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
