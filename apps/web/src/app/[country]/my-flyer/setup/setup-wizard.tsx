'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronRight, SkipForward } from 'lucide-react';
import { ALGORITHM_OPTIONS, type AlgorithmChoice, USER_PREFERENCES_STORAGE_KEY, normalizeAlgorithmChoice } from '@/components/algorithm-picker';
import { FavoriteStorePicker } from '@/components/favorite-store-picker';

const countryOptions = [
  { value: 'se', label: 'Sweden' },
  { value: 'no', label: 'Norway' },
  { value: 'dk', label: 'Denmark' },
  { value: 'fi', label: 'Finland' }
] as const;

const routeCountryAliases: Record<string, string> = {
  stockholm: 'se',
  sweden: 'se',
  sverige: 'se',
  norway: 'no',
  norge: 'no',
  denmark: 'dk',
  danmark: 'dk',
  finland: 'fi',
  suomi: 'fi'
};

type SetupStep = 'country' | 'stores' | 'algorithm' | 'done';

type MyFlyerSetupWizardProps = Readonly<{
  routeCountry: string;
}>;

type Session = Readonly<{
  accessToken: string;
  userId: string;
}>;

type PersistSetupOverrides = Readonly<{
  country?: string;
  favoriteStores?: string[];
  algorithm?: AlgorithmChoice;
}>;

function normalizedCountry(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const aliasedValue = routeCountryAliases[normalizedValue] ?? normalizedValue;
  return countryOptions.some((option) => option.value === aliasedValue) ? aliasedValue : 'se';
}

function readSession(): Session | null {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return accessToken && userId ? { accessToken, userId } : null;
}

function readStoredPreferences() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function MyFlyerSetupWizard({ routeCountry }: MyFlyerSetupWizardProps) {
  const defaultCountry = useMemo(() => normalizedCountry(routeCountry), [routeCountry]);
  const [step, setStep] = useState<SetupStep>('country');
  const [country, setCountry] = useState(defaultCountry);
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [algorithm, setAlgorithm] = useState<AlgorithmChoice>('watchlist_first');
  const [message, setMessage] = useState('Step 1 of 3');
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'local' | 'error'>('idle');

  const stepIndex = step === 'country' ? 1 : step === 'stores' ? 2 : step === 'algorithm' ? 3 : 3;

  async function persistSetup(skippedStep?: SetupStep, overrides: PersistSetupOverrides = {}) {
    const now = new Date().toISOString();
    const selectedCountry = overrides.country ?? country;
    const selectedFavoriteStores = overrides.favoriteStores ?? favoriteStores;
    const selectedAlgorithm = overrides.algorithm ?? algorithm;
    const nextPreferences = {
      ...readStoredPreferences(),
      country: selectedCountry,
      favorite_stores: selectedFavoriteStores,
      algorithm_choice: normalizeAlgorithmChoice(selectedAlgorithm),
      my_flyer_onboarding_completed: true,
      my_flyer_onboarding_skipped: Boolean(skippedStep),
      my_flyer_onboarding_skipped_step: skippedStep ?? null,
      updated_at: now
    };

    window.localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
    window.dispatchEvent(new CustomEvent('groceryview:user-preferences-changed', {
      detail: {
        country: selectedCountry,
        favorite_stores: selectedFavoriteStores,
        algorithm_choice: normalizeAlgorithmChoice(selectedAlgorithm),
        storageKey: USER_PREFERENCES_STORAGE_KEY
      }
    }));

    const session = readSession();
    if (!session) {
      setSyncState('local');
      setMessage('Setup saved to user_preferences in this browser.');
      setStep('done');
      return;
    }

    setSyncState('saving');
    try {
      const response = await fetch('/api/my-flyer', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: session.userId,
          country: selectedCountry,
          favorite_stores: selectedFavoriteStores,
          home_location: 'Stockholm',
          household_size: 2,
          diet_filters: [],
          algorithm: normalizeAlgorithmChoice(selectedAlgorithm)
        })
      });

      if (!response.ok) throw new Error('Unable to sync MyFlyer setup.');
      setSyncState('saved');
      setMessage('Setup saved to user_preferences and synced to MyFlyer.');
    } catch {
      setSyncState('error');
      setMessage('Setup saved locally. Account sync can be retried from MyFlyer preferences.');
    }

    setStep('done');
  }

  function continueFromCurrentStep() {
    if (step === 'country') {
      setStep('stores');
      setMessage('Step 2 of 3');
      return;
    }

    if (step === 'stores') {
      setStep('algorithm');
      setMessage('Step 3 of 3');
      return;
    }

    void persistSetup();
  }

  function skipCurrentStep() {
    if (step === 'country') {
      setCountry(defaultCountry);
      setStep('stores');
      setMessage('Country skipped. Step 2 of 3');
      return;
    }

    if (step === 'stores') {
      setFavoriteStores([]);
      setStep('algorithm');
      setMessage('Favorite stores skipped. Step 3 of 3');
      return;
    }

    void persistSetup('algorithm');
  }

  function skipAllSetup() {
    setCountry(defaultCountry);
    setFavoriteStores([]);
    setAlgorithm('watchlist_first');
    void persistSetup(step, {
      country: defaultCountry,
      favoriteStores: [],
      algorithm: 'watchlist_first'
    });
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a className="text-sm font-black uppercase tracking-[0.18em] text-orange-700" href={`/${routeCountry}/my-flyer`}>
            MyFlyer
          </a>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">First-time setup</h1>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800"
          onClick={skipAllSetup}
          type="button"
        >
          <SkipForward aria-hidden="true" size={16} />
          Skip setup
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="MyFlyer setup progress">
        {['Pick country', 'Favorite stores', 'Algorithm'].map((label, index) => {
          const active = stepIndex === index + 1 && step !== 'done';
          const complete = step === 'done' || stepIndex > index + 1;
          return (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${active ? 'border-orange-800 bg-orange-800 text-white' : complete ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-stone-300 bg-white text-slate-500'}`}
              key={label}
            >
              {label}
            </span>
          );
        })}
      </div>

      <div className="border border-stone-300 bg-[#fffdf7] p-5 shadow-sm sm:p-6">
        {step === 'country' ? (
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">Step 1</p>
            <h2 className="mt-2 text-2xl font-black">Pick country</h2>
            <label className="mt-5 block max-w-sm text-sm font-black text-slate-700">
              Country
              <select
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-3 py-3"
                onChange={(event) => setCountry(event.target.value)}
                value={country}
              >
                {countryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        ) : null}

        {step === 'stores' ? (
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">Step 2</p>
            <h2 className="mt-2 text-2xl font-black">Pick favorite stores</h2>
            <div className="mt-5">
              <FavoriteStorePicker selectedStoreSlugs={favoriteStores} onChange={setFavoriteStores} />
            </div>
          </div>
        ) : null}

        {step === 'algorithm' ? (
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">Step 3</p>
            <h2 className="mt-2 text-2xl font-black">Pick algorithm</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="MyFlyer setup algorithm">
              {ALGORITHM_OPTIONS.filter((option) => option.value !== 'balanced').map((option) => {
                const active = algorithm === option.value;
                return (
                  <button
                    aria-checked={active}
                    className={`rounded-2xl border p-3 text-left ${active ? 'border-orange-800 bg-orange-800 text-white' : 'border-stone-300 bg-white text-slate-800'}`}
                    key={option.value}
                    onClick={() => setAlgorithm(option.value)}
                    role="radio"
                    type="button"
                  >
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className={`mt-1 block text-xs font-semibold ${active ? 'text-orange-50' : 'text-slate-500'}`}>{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 'done' ? (
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Setup complete</p>
            <h2 className="mt-2 text-2xl font-black">MyFlyer is ready</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="border border-stone-300 bg-white p-4">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Country</dt>
                <dd className="mt-1 text-lg font-black">{country.toUpperCase()}</dd>
              </div>
              <div className="border border-stone-300 bg-white p-4">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Stores</dt>
                <dd className="mt-1 text-lg font-black">{favoriteStores.length}</dd>
              </div>
              <div className="border border-stone-300 bg-white p-4">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Algorithm</dt>
                <dd className="mt-1 text-lg font-black">{algorithm}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-6 text-sm font-bold text-slate-600" data-sync-state={syncState} role="status">{message}</p>
          {step !== 'done' ? (
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
                onClick={skipCurrentStep}
                type="button"
              >
                <SkipForward aria-hidden="true" size={16} />
                Skip step
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
                onClick={continueFromCurrentStep}
                type="button"
              >
                {step === 'algorithm' ? <Check aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
                {step === 'algorithm' ? 'Finish setup' : 'Continue'}
              </button>
            </div>
          ) : (
            <a className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={`/${routeCountry}/my-flyer`}>
              Open MyFlyer
              <ChevronRight aria-hidden="true" size={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
