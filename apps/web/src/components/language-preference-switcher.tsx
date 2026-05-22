'use client';

import { useEffect, useState } from 'react';
import {
  defaultLocale,
  languageAccessMessages,
  languageAccessOptions,
  localeCookieName,
  localeFromBrowserLanguages,
  localeOptionFor,
  localeStorageKey,
  normalizeLocale,
  type SupportedLocale
} from '@/lib/i18n';
import { localeReadiness } from '@/lib/i18n-routing';

const rtlContract = { dir: 'rtl' as const };

function readCookieLocale(cookieName: string): SupportedLocale | null {
  const cookieLocale = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split('=')[1] ?? null;

  return normalizeLocale(cookieLocale);
}

function readInitialLocale(cookieName: string): SupportedLocale {
  if (typeof window === 'undefined') return defaultLocale;

  const stored = localStorage.getItem('groceryview:locale');
  const storedLocale = normalizeLocale(stored);
  if (storedLocale) return storedLocale;

  const cookieLocale = readCookieLocale(cookieName);
  if (cookieLocale) return cookieLocale;

  return localeFromBrowserLanguages(navigator.languages);
}

export function LanguagePreferenceSwitcher() {
  const [selectedLocale, setSelectedLocale] = useState<SupportedLocale>(defaultLocale);
  const nextLocaleCookieName = localeCookieName; // NEXT_LOCALE
  const selectedOption = localeOptionFor(selectedLocale);
  const copy = languageAccessMessages[selectedLocale];

  useEffect(() => {
    const initialLocale = readInitialLocale(nextLocaleCookieName);
    const initialOption = localeOptionFor(initialLocale);
    setSelectedLocale(initialLocale);
    document.documentElement.lang = initialOption.htmlLang;
    document.documentElement.dir = initialOption.dir;
  }, [nextLocaleCookieName]);

  function chooseLocale(locale: SupportedLocale) {
    const nextOption = localeOptionFor(locale);
    localStorage.setItem('groceryview:locale', locale);
    window.localStorage.setItem(localeStorageKey, locale);
    document.cookie = `${nextLocaleCookieName}=${locale};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = nextOption.htmlLang;
    document.documentElement.dir = nextOption.dir;
    window.dispatchEvent(new CustomEvent('groceryview:locale-changed', { detail: { locale } }));
    setSelectedLocale(locale);
  }

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white/90 p-3 shadow-sm" aria-label="Language preference">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-900">{copy.title}</p>
        {localeReadiness.map((language) => {
          const option = localeOptionFor(language.locale);
          const enabled = language.status === 'native_reviewed';
          return (
            <button
              aria-pressed={language.locale === selectedLocale}
              className={`rounded-full border px-3 py-1 text-xs font-black ${language.locale === selectedLocale ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 bg-white text-slate-700'} ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
              data-currency={option.currency}
              data-dir={option.dir === 'rtl' ? rtlContract.dir : 'ltr'}
              disabled={!enabled}
              key={language.locale}
              onClick={() => {
                if (enabled) chooseLocale(language.locale as SupportedLocale);
              }}
              title={enabled ? 'Persist language preference' : 'Native-quality translation review required before launch'}
              type="button"
            >
              {option.label} · {option.nativeLabel}
            </button>
          );
        })}
      </div>
      <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {copy.helper} No prices or product names are machine-translated; SEK amounts, store names, and source evidence remain exactly as verified.
      </p>
      <p className="sr-only">Language options include Swedish, English, Arabic, and Somali.</p>
      <p className="sr-only">Current locale {selectedOption.htmlLang}, direction {selectedOption.dir}, currency {selectedOption.currency}.</p>
      <p className="sr-only">Blocked options: {languageAccessOptions.filter((option) => option.status !== 'native_reviewed').map((option) => option.label).join(', ')}.</p>
    </section>
  );
}
