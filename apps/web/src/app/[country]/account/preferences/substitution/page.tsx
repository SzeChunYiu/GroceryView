'use client';

import { useEffect, useState } from 'react';

type Willingness = 'strict' | 'narrow' | 'broad';

type CategoryQuestion = {
  key: string;
  label: string;
  example: string;
  defaultValue: Willingness;
};

const storageKey = 'user_preferences.substitution_willingness';
const questions: CategoryQuestion[] = [
  { key: 'produce', label: 'Produce', example: 'apples', defaultValue: 'broad' },
  { key: 'meat', label: 'Meat', example: 'chicken breast', defaultValue: 'narrow' },
  { key: 'dairy', label: 'Dairy', example: 'milk', defaultValue: 'narrow' },
  { key: 'branded_packaged', label: 'Branded packaged', example: 'your usual cereal', defaultValue: 'strict' }
];

const choiceLabels: Record<Willingness, string> = {
  strict: 'Strict: only this exact item',
  narrow: 'Narrow: only this sub-class',
  broad: 'Broad: any sub-class we recommend'
};

function defaults() {
  return Object.fromEntries(questions.map((question) => [question.key, question.defaultValue])) as Record<string, Willingness>;
}

export default function SubstitutionPreferencesPage() {
  const [values, setValues] = useState<Record<string, Willingness>>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as Record<string, Willingness> | null;
      if (parsed) setValues({ ...defaults(), ...parsed });
    } catch {
      setValues(defaults());
    }
  }, []);

  function update(category: string, value: Willingness) {
    const next = { ...values, [category]: value };
    setValues(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(true);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Substitution onboarding</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">How flexible should recommendations be?</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
        Answers persist to <code className="rounded bg-slate-100 px-1">user_preferences.substitution_willingness</code> so substitution suggestions can avoid unwanted swaps.
      </p>
      <div className="mt-6 space-y-4">
        {questions.map((question) => (
          <fieldset className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" key={question.key}>
            <legend className="text-xl font-black text-slate-950">For {question.example}, would you accept any variety we recommend?</legend>
            <p className="mt-1 text-sm font-semibold text-slate-600">{question.label} default: {choiceLabels[question.defaultValue]}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(Object.keys(choiceLabels) as Willingness[]).map((choice) => (
                <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800" key={choice}>
                  <input
                    checked={values[question.key] === choice}
                    className="mr-2 accent-emerald-700"
                    name={question.key}
                    onChange={() => update(question.key, choice)}
                    type="radio"
                  />
                  {choiceLabels[choice]}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {saved ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-900">Saved substitution willingness preferences locally.</p> : null}
    </main>
  );
}
