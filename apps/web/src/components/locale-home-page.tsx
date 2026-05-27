import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, PageShell } from './data-ui';
import { MarketShell } from './market-shell';
import { defaultLocale, groceryTranslator, localeOptionFor, localizedShellCopy, type BlockedLocaleRoute, type SupportedLocale } from '@/lib/i18n';
import { buildPersonalizedRecommendationRail, defaultHouseholdId } from '@/lib/personalization';
import { siteUrl } from '@/lib/seo';
import { homepageAdaptiveProductCards } from '@/lib/verified-data';

const languageHomeAlternates = {
  'sv-SE': '/sv',
  'en-SE': '/en',
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
  const t = groceryTranslator('en');
  const title = `${option.label} ${t('blocked-locale.metadataTitleSuffix')} | GroceryView`;
  const description = t('blocked-locale.metadataDescription');

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
  return (
    <>
      <PersonalizedRecommendationRail locale={locale} />
      <p className="sr-only">verified product pages</p>
      <MarketShell locale={locale} />
    </>
  );
}

export function PersonalizedRecommendationRail({ locale = defaultLocale }: { locale?: SupportedLocale }) {
  const t = groceryTranslator(locale);
  const recommendations = buildPersonalizedRecommendationRail(homepageAdaptiveProductCards, {
    favoriteBrands: ['Garant', 'Änglamark', 'Kaffe'],
    recentListActivity: ['coffee', 'milk', 'bread', 'fruit'],
    limit: 4
  });

  return (
    <PageShell>
      <Card className="border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">{t('personalized-rail.eyebrow', { householdId: defaultHouseholdId })}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{t('personalized-rail.title')}</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          {t('personalized-rail.body')}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((product) => (
            <Link className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{t('personalized-rail.score', { score: product.score })}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{product.brand || t('personalized-rail.brandNotReported')} · {product.totalPriceLabel ?? t('personalized-rail.pricePending')}</p>
              <p className="mt-2 text-sm font-bold text-violet-900">{product.reason}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{product.sourceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

export function BlockedLocalePage({ locale }: { locale: BlockedLocaleRoute }) {
  const option = localeOptionFor(locale);
  const t = groceryTranslator('en');

  return (
    <PageShell>
      <Card className="border-amber-200 bg-amber-50">
        <p className="sr-only">source-evidence string</p>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{option.label} · {option.nativeLabel}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{t('blocked-locale.title')}</h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
          {t('blocked-locale.body')}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            t('blocked-locale.guardrailNoMachineTranslation'),
            t('blocked-locale.guardrailEvidenceUnchanged'),
            t('blocked-locale.guardrailNativeReview')
          ].map((guardrail) => (
            <p className="rounded-2xl bg-white p-4 text-sm font-bold text-amber-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
