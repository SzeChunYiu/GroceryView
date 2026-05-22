import { createTranslator } from 'next-intl';
import enMessages from '../../messages/en.json';
import svMessages from '../../messages/sv.json';
import {
  defaultLocale as routingDefaultLocale,
  localeCookieName,
  localeReadiness,
  localeStorageKey,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage,
  supportedLocales,
  type SupportedLocale
} from './i18n-routing';

type GroceryMessages = typeof svMessages;
export type LanguageAccessLocale = SupportedLocale | 'ar' | 'so';

export type LocaleOption = {
  code: LanguageAccessLocale;
  label: string;
  nativeLabel: string;
  htmlLang: string;
  dir: 'ltr' | 'rtl';
  currency: 'SEK';
  status: 'native_reviewed' | 'blocked_native_review_required';
};

export const defaultLocale = 'sv' as SupportedLocale;

const messagesByLocale: Record<SupportedLocale, GroceryMessages> = {
  sv: svMessages,
  en: enMessages
};

export const languageAccessOptions: LocaleOption[] = [
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', htmlLang: 'sv-SE', dir: 'ltr', currency: 'SEK', status: 'native_reviewed' },
  { code: 'en', label: 'English', nativeLabel: 'English', htmlLang: 'en-SE', dir: 'ltr', currency: 'SEK', status: 'native_reviewed' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', htmlLang: 'ar-SE', dir: 'rtl', currency: 'SEK', status: 'blocked_native_review_required' },
  { code: 'so', label: 'Somali', nativeLabel: 'Soomaali', htmlLang: 'so-SE', dir: 'ltr', currency: 'SEK', status: 'blocked_native_review_required' }
];

export const languageAccessMessages: Record<SupportedLocale, { title: string; helper: string }> = {
  sv: {
    title: 'Språk',
    helper: 'Priser, produktnamn och källbevis visas oförändrat i svenska kronor.'
  },
  en: {
    title: 'Language',
    helper: 'Prices, product names, and source evidence stay unchanged in Swedish kronor.'
  }
};

if (defaultLocale !== routingDefaultLocale) {
  throw new Error('i18n default locale must match routing default locale');
}

export {
  localeCookieName,
  localeReadiness,
  localeStorageKey,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage,
  supportedLocales,
  type SupportedLocale
};

export function groceryTranslator(locale: string | null | undefined = defaultLocale) {
  const resolvedLocale = normalizeLocale(locale) ?? defaultLocale;
  return createTranslator({
    locale: resolvedLocale,
    messages: messagesByLocale[resolvedLocale]
  });
}

export function localeFromBrowserLanguages(languages: readonly string[] | undefined): SupportedLocale {
  for (const language of languages ?? []) {
    const normalized = normalizeLocale(language);
    if (normalized) return normalized;
  }
  return defaultLocale;
}

export function localeOptionFor(code: LanguageAccessLocale): LocaleOption {
  return languageAccessOptions.find((locale) => locale.code === code) ?? languageAccessOptions[0]!;
}

export const localizedShellCopy = supportedLocales.map((locale) => {
  const t = groceryTranslator(locale);
  return {
    locale,
    nav: {
      overview: t('nav.overview'),
      products: t('nav.products'),
      compare: t('nav.compare'),
      mealCost: t('nav.mealCost'),
      savings: t('nav.savings'),
      chain: t('nav.chain'),
      stores: t('nav.stores'),
      openPrices: t('nav.openPrices'),
      map: t('nav.map'),
      categories: t('nav.categories')
    },
    hero: {
      eyebrow: t('home.eyebrow'),
      headline: t('home.headline'),
      body: t('home.body')
    },
    language: {
      label: t('language.label'),
      persisted: t('language.persisted'),
      guardrail: t('language.guardrail')
    },
    evidence: 'next-intl createTranslator messages with native-reviewed sv/en copy'
  };
});

export const localeTranslationGuardrails = [
  'Swedish and English shell copy is reviewed and stored in messages/{locale}.json.',
  'Prices, product names, source labels, and retailer evidence remain unchanged across languages.',
  'Arabic and Somali remain blocked until native-quality translations are reviewed; no MT copy is shipped.'
];
