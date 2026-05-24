import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { buildDemoHouseholdCategorySignals, defaultHouseholdId, getHouseholdCategoryScore, rankLandingShortcuts } from '@/lib/personalization';
import { categorySummaries, formatPct, formatSek } from '@/lib/verified-data';

type LandingShortcut = {
  categorySlug: string;
  href: string;
  label: string;
  detail: string;
};

const landingShortcuts: LandingShortcut[] = categorySummaries.slice(0, 8).map((category) => ({
  categorySlug: category.slug,
  href: `/categories/${category.slug}`,
  label: category.label,
  detail: `${category.openPriceRows} OpenPrices rows · ${formatSek(category.medianPrice)} median · ${formatPct(category.strongestSpread)} max spread`,
}));

export default function IndexLandingPage() {
  const householdSignals = buildDemoHouseholdCategorySignals(categorySummaries);
  const personalizedShortcuts = rankLandingShortcuts(landingShortcuts, defaultHouseholdId, householdSignals);

  return (
    <PageShell>
      <Eyebrow>Personalized grocery index</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Landing shortcuts ranked by household purchase history</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Shortcuts for {defaultHouseholdId} are ordered with historical conversions weighted ahead of clicks, keeping category discovery focused on the household&apos;s proven shopping intent.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {personalizedShortcuts.map((shortcut) => (
          <Link href={shortcut.href} key={shortcut.categorySlug}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-emerald-700">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">History score {getHouseholdCategoryScore(shortcut.categorySlug, defaultHouseholdId, householdSignals)}</p>
              <h2 className="mt-2 text-2xl font-black">{shortcut.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{shortcut.detail}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
