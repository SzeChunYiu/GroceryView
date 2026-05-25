'use client';

import { useState } from 'react';
import { FavoriteStorePicker } from '@/components/favorite-store-picker';

const dietOptions = ['organic', 'vegetarian', 'vegan', 'gluten-free', 'lactose-free'];
const algorithmOptions = ['watchlist_first', 'best_savings', 'best_unit_price'];
const countryOptions = ['se', 'no', 'dk', 'fi'];

type SaveState = 'idle' | 'blocked' | 'saving' | 'saved' | 'error';

type MyFlyerPreferencesProps = Readonly<{
  defaultCountry: string;
  defaultAlgorithm: string;
}>;

function readSession() {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return accessToken && userId ? { accessToken, userId } : null;
}

function splitStores(value: string) {
  return value.split(',').map((store) => store.trim()).filter(Boolean);
}

export function MyFlyerPreferences({ defaultCountry, defaultAlgorithm }: MyFlyerPreferencesProps) {
  const [country, setCountry] = useState(defaultCountry);
  const [algorithm, setAlgorithm] = useState(defaultAlgorithm);
  const [favoriteStores, setFavoriteStores] = useState('willys-odenplan, hemkop-city');
  const [homeLocation, setHomeLocation] = useState('Stockholm');
  const [householdSize, setHouseholdSize] = useState(2);
  const [dietFilters, setDietFilters] = useState<string[]>([]);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('Sign in to sync MyFlyer preferences to the account API.');

  function toggleDietFilter(filter: string) {
    setDietFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  }

  async function savePreferences() {
    const session = readSession();
    if (!session) {
      setState('blocked');
      setMessage('Sign in first. MyFlyer preferences are saved through the account API, not local-only storage.');
      return;
    }

    setState('saving');
    try {
      const response = await fetch('/api/my-flyer', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: session.userId,
          country,
          favorite_stores: splitStores(favoriteStores),
          home_location: homeLocation,
          household_size: householdSize,
          diet_filters: dietFilters,
          algorithm
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Unable to save MyFlyer preferences.');

      setState('saved');
      setMessage(`Saved ${body.preferences?.favorite_stores?.length ?? 0} favorite stores and ${body.preferences?.diet_filters?.length ?? 0} diet filters for ${body.userId ?? session.userId}.`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to save MyFlyer preferences.');
    }
  }

  return (
    <section className="my-flyer-screen-only mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5" data-print-hide>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">MyFlyer preferences</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Account-synced flyer controls</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Country, Favorite stores, home location, household size, diet filters, and algorithm choice are sent to the MyFlyer preference API with the signed-in bearer token. This form does not write localStorage-only preferences.
          </p>
        </div>
        <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" onClick={savePreferences} type="button">
          Save preferences
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-black text-slate-700">Country
          <select className="mt-1 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2" onChange={(event) => setCountry(event.target.value)} value={country}>
            {countryOptions.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="text-sm font-black text-slate-700">Home location
          <input className="mt-1 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2" onChange={(event) => setHomeLocation(event.target.value)} value={homeLocation} />
        </label>
        <label className="text-sm font-black text-slate-700">Household size
          <input className="mt-1 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2" min={1} max={12} onChange={(event) => setHouseholdSize(Number(event.target.value))} type="number" value={householdSize} />
        </label>
        <div className="md:col-span-2">
          <FavoriteStorePicker selectedStoreSlugs={splitStores(favoriteStores)} onChange={(stores) => setFavoriteStores(stores.join(', '))} />
        </div>
        <label className="text-sm font-black text-slate-700">Algorithm choice
          <select className="mt-1 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2" onChange={(event) => setAlgorithm(event.target.value)} value={algorithm}>
            {algorithmOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="MyFlyer account diet filters">
        {dietOptions.map((filter) => {
          const active = dietFilters.includes(filter);
          return (
            <button aria-pressed={active} className={`rounded-full border px-3 py-2 text-sm font-black ${active ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-emerald-200 bg-white text-emerald-900'}`} key={filter} onClick={() => toggleDietFilter(filter)} type="button">
              {filter}
            </button>
          );
        })}
      </div>

      <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-emerald-950" data-status={state} role="status">{message}</p>
    </section>
  );
}
