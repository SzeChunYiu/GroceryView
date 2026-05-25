import type { Metadata } from 'next';
import { Card, PageShell } from './data-ui';
import { MarketShell } from './market-shell';
import { localeOptionFor, localizedShellCopy, type BlockedLocaleRoute, type SupportedLocale } from '@/lib/i18n';
import { siteUrl } from '@/lib/seo';

const languageHomeAlternates = {
  'sv-SE': '/sv',
  'en-SE': '/en',
  'nb-NO': '/nb',
  'x-default': '/'
};

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function localeHomeMetadata(locale: SupportedLocale): Metadata {
  const option = localeOptionFor(locale);
  const copy = localizedShellCopy.find((entry) => entry.locale === locale) ?? localizedShellCopy[0];
  const title = `${copy.hero.eyebrow} | GroceryView`;
  const description = copy.hero.body;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages: languageHomeAlternates
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${locale}`),
      siteName: 'GroceryView',
      locale: option.htmlLang.replace('-', '_'),
      type: 'website'
    }
  };
}

export function blockedLocaleMetadata(locale: BlockedLocaleRoute): Metadata {
  const option = localeOptionFor(locale);
  const title = `${option.label} translation review required | GroceryView`;
  const description = 'Native-quality translation review required before this language route can show GroceryView copy. No machine-translated prices or source labels are shipped.';

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages: languageHomeAlternates
    },
    robots: { index: false, follow: true }
  };
}

export function LocaleHomePage({ locale }: { locale: SupportedLocale }) {
  return <MarketShell />;
}

export function BlockedLocalePage({ locale }: { locale: BlockedLocaleRoute }) {
  const option = localeOptionFor(locale);

  return (
    <PageShell>
      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{option.label} · {option.nativeLabel}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Native-quality translation review required</h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
          GroceryView routes Swedish, English, and Norwegian Bokmål public copy today. Arabic and Somali remain visible as expansion routes, but they stay blocked until native reviewers approve every navigation, policy, and source-evidence string.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            'No machine-translated prices',
            'SEK amounts and source evidence stay unchanged',
            'Native-quality translations must pass review before launch'
          ].map((guardrail) => (
            <p className="rounded-2xl bg-white p-4 text-sm font-bold text-amber-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
