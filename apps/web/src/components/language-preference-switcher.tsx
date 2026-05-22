'use client';

import { useEffect, useState } from 'react';
import { languageAccessMessages, localeFromBrowserLanguages, localeOptionFor, supportedLocales, type SupportedLocale } from '@/lib/i18n';

const rtlContract = { dir: 'rtl' as const };

function readInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'sv';
  const stored = localStorage.getItem('groceryview:locale');
  return localeFromBrowserLanguages(stored ? [stored] : navigator.languages);
}

export function LanguagePreferenceSwitcher() {
  const [locale, setLocale] = useState<SupportedLocale>('sv');
  const option = localeOptionFor(locale);
  const copy = languageAccessMessages[locale];

  useEffect(() => {
    const initialLocale = readInitialLocale();
    setLocale(initialLocale);
    const initialOption = localeOptionFor(initialLocale);
    document.documentElement.lang = initialOption.htmlLang;
    document.documentElement.dir = initialOption.dir;
  }, []);

  function chooseLocale(nextLocale: SupportedLocale) {
    const nextOption = localeOptionFor(nextLocale);
    setLocale(nextLocale);
    localStorage.setItem('groceryview:locale', nextLocale);
    document.documentElement.lang = nextOption.htmlLang;
    document.documentElement.dir = nextOption.dir;
  }

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white/90 p-3 shadow-sm" aria-label="Language preference">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-900">{copy.title}</p>
        {supportedLocales.map((language) => (
          <button
            aria-pressed={language.code === locale}
            className={`rounded-full border px-3 py-1 text-xs font-black ${language.code === locale ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
            data-currency={language.currency}
            data-dir={language.dir === 'rtl' ? rtlContract.dir : 'ltr'}
            key={language.code}
            onClick={() => chooseLocale(language.code)}
            type="button"
          >
            {language.label} · {language.nativeLabel}
          </button>
        ))}
      </div>
      <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {copy.helper} No prices or product names are machine-translated; SEK amounts, store names, and source evidence remain exactly as verified.
      </p>
      <p className="sr-only">Language options include Swedish, English, Arabic, and Somali.</p>
      <p className="sr-only">Current locale {option.htmlLang}, direction {option.dir}, currency {option.currency}.</p>
    </section>
  );
}
