'use client';

import { FormEvent, useState } from 'react';
import { dietaryPreferenceOnboardingContract, type DietaryPreferenceOption } from '@/lib/personalization';

type MutationStatus = 'idle' | 'blocked' | 'saving' | 'saved' | 'error';
type BrowserSession = { accessToken: string; userId: string };

const autoReorderTemplate = {
  templateId: 'public-weekly-basics-visible-prices',
  templateName: 'Public weekly basics',
  cadence: 'weekly',
  asOf: '2026-05-22T08:00:00.000Z'
} as const;

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function AccountMutationActions() {
  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [avoidedIngredients, setAvoidedIngredients] = useState<string[]>([]);
  const [certificationPreferences, setCertificationPreferences] = useState<string[]>([]);
  const [status, setStatus] = useState<MutationStatus>('idle');
  const [message, setMessage] = useState('No anonymous mutations. Sign in first to load account-bound actions.');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous mutations are sent to favorite stores or saved baskets.');
      return null;
    }
    setStatus('saving');
    return session;
  }

  async function handleResponse(response: Response, successMessage: string) {
    if (!response.ok) {
      setStatus('error');
      setMessage('Account mutation was rejected by the production API.');
      return;
    }
    setStatus('saved');
    setMessage(successMessage);
  }

  async function addFavoriteStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}/favorite-stores`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ storeId })
    });
    await handleResponse(response, `Favorite store ${storeId} saved for the signed-in account.`);
  }

  async function removeFavoriteStore() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}/favorite-stores/${encodeURIComponent(storeId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await handleResponse(response, `Favorite store ${storeId} removed from the signed-in account.`);
  }

  async function addBasketItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/basket/items?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ productId, quantity: Number(quantity) })
    });
    await handleResponse(response, `Saved ${quantity} x ${productId} to the signed-in basket.`);
  }

  async function compareSavedBasket() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/basket/compare?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await handleResponse(response, 'Compare saved basket request accepted for the signed-in account.');
  }

  async function planAutoReorder() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const { templateId, templateName, asOf } = autoReorderTemplate;
    const response = await fetch(`/api/basket/recurring-digest?userId=${encodeURIComponent(userId)}&templateId=${encodeURIComponent(templateId)}&templateName=${encodeURIComponent(templateName)}&cadence=weekly&asOf=${encodeURIComponent(asOf)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await handleResponse(response, 'Auto-reorder plan prepared for the signed-in account. No anonymous auto-reorder.');
  }

  function toggleValue(value: string, selected: string[], setSelected: (next: string[]) => void) {
    setSelected(selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value]);
  }

  async function saveDietaryPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`${dietaryPreferenceOnboardingContract.endpoint}?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        dietaryRestrictions,
        avoidedIngredients,
        certificationPreferences
      })
    });
    await handleResponse(response, 'Dietary onboarding preferences saved for the signed-in account.');
  }

  function DietaryPreferenceCheckboxGroup({
    label,
    name,
    options,
    selected,
    setSelected
  }: Readonly<{
    label: string;
    name: string;
    options: DietaryPreferenceOption[];
    selected: string[];
    setSelected: (next: string[]) => void;
  }>) {
    return (
      <fieldset className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
        <legend className="text-sm font-black text-slate-950">{label}</legend>
        <div className="mt-3 grid gap-2">
          {options.map((option) => (
            <label className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700" key={option.value}>
              <input
                checked={selected.includes(option.value)}
                className="mt-1 h-4 w-4 accent-lime-700"
                name={name}
                onChange={() => toggleValue(option.value, selected, setSelected)}
                type="checkbox"
                value={option.value}
              />
              <span>
                <span className="block font-black text-slate-950">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{option.helper}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm" aria-label="Account mutation controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Signed-in account actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Favorite stores and basket writes</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage token created by the production session exchange. They fail closed when no signed-in session is present, so the public build never performs anonymous account mutations.
        No anonymous auto-reorder is attempted; the reorder planner only reads the protected recurring basket digest for the signed-in account.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={addFavoriteStore}>
          <label className="text-sm font-black text-slate-950" htmlFor="favorite-store-id">Verified store id</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="favorite-store-id"
            onChange={(event) => setStoreId(event.target.value)}
            placeholder="storeId from GroceryView stores"
            value={storeId}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" disabled={!storeId.trim()} type="submit">Save favorite store</button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" disabled={!storeId.trim()} onClick={removeFavoriteStore} type="button">Remove favorite store</button>
          </div>
        </form>

        <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={addBasketItem}>
          <label className="text-sm font-black text-slate-950" htmlFor="basket-product-id">Product id</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="basket-product-id"
            onChange={(event) => setProductId(event.target.value)}
            placeholder="productId"
            value={productId}
          />
          <label className="mt-3 block text-sm font-black text-slate-950" htmlFor="basket-product-quantity">Quantity</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="basket-product-quantity"
            min="0.1"
            onChange={(event) => setQuantity(event.target.value)}
            step="0.1"
            type="number"
            value={quantity}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" disabled={!productId.trim() || Number(quantity) <= 0} type="submit">Save basket item</button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" onClick={compareSavedBasket} type="button">Compare saved basket</button>
            <button className="rounded-full border border-sky-300 px-4 py-2 text-sm font-black text-sky-900" onClick={planAutoReorder} type="button">Plan auto-reorder</button>
          </div>
        </form>
      </div>

      <form className="mt-4 rounded-2xl border border-lime-200 bg-white p-4" onSubmit={saveDietaryPreferences}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">Dietary preference onboarding</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Restrictions, avoided ingredients, and certifications</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Saves explicit account preferences to {dietaryPreferenceOnboardingContract.endpoint} so personalization defaults can respect health, religious, and lifestyle needs without inferring them from shopping history.
            </p>
          </div>
          <button className="rounded-full bg-lime-800 px-4 py-2 text-sm font-black text-white" type="submit">
            Save dietary preferences
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <DietaryPreferenceCheckboxGroup
            label="Dietary restrictions"
            name="dietaryRestrictions"
            options={dietaryPreferenceOnboardingContract.dietaryRestrictions}
            selected={dietaryRestrictions}
            setSelected={setDietaryRestrictions}
          />
          <DietaryPreferenceCheckboxGroup
            label="Avoided ingredients"
            name="avoidedIngredients"
            options={dietaryPreferenceOnboardingContract.avoidedIngredients}
            selected={avoidedIngredients}
            setSelected={setAvoidedIngredients}
          />
          <DietaryPreferenceCheckboxGroup
            label="Certification preferences"
            name="certificationPreferences"
            options={dietaryPreferenceOnboardingContract.certificationPreferences}
            selected={certificationPreferences}
            setSelected={setCertificationPreferences}
          />
        </div>
        <p className="mt-3 text-xs font-bold text-lime-950">No anonymous dietary profile is saved; signed-in shoppers can change these defaults before filters, alerts, or basket warnings use them.</p>
      </form>

      <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950" data-status={status}>{message}</p>
    </section>
  );
}
