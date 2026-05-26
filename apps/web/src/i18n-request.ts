import { getRequestConfig } from 'next-intl/server';
import enMessages from '../messages/en.json';
import svMessages from '../messages/sv.json';
import { defaultLocale, normalizeLocale, type SupportedLocale } from './lib/i18n-routing';

const messagesByLocale = {
  sv: svMessages,
  en: enMessages
} satisfies Record<SupportedLocale, typeof svMessages>;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = normalizeLocale(await requestLocale) ?? defaultLocale;
  return {
    locale,
    messages: messagesByLocale[locale]
  };
});
