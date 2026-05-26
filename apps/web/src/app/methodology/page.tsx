import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { routeMetadata } from '@/lib/seo';

const methodologySections = [
  {
    id: 'deal-score',
    title: 'Deal Score',
    summary: 'Deal Score is a 0-100 ranking built from observed price evidence. Sponsored placement is ignored.',
    factors: [
      'Current city percentile: 40% of the score. Lower observed percentile raises the score.',
      'Known promotion-history percentile: 25%. Better-than-usual promotion history raises the score.',
      'Equivalent unit-price percentile: 20%. Comparable kr/kg, kr/l, or kr/st evidence is required.',
      'Discount depth: 10%. A deeper source-backed discount helps, but cannot rescue weak evidence alone.',
      'Source confidence: 5%. More reliable source rows raise confidence without overriding the price math.'
    ],
    hiddenWhen: [
      'No positive current price exists.',
      'Unit normalization is unresolved for the product or comparison set.',
      'The only available value is an estimated or manual row and the surface requires verified source evidence.'
    ]
  },
  {
    id: 'buy-wait',
    title: 'Buy / Wait',
    summary: 'Buy/Wait timing uses dated price history, current price versus observed average, and explicit flyer windows when available.',
    factors: [
      'Observed volatility is computed from recent high-low price movement.',
      'Current price is compared with the observed average and recent low.',
      'Flyer windows can support a wait recommendation only when their source and date range are visible.',
      'The recommendation is withheld when there are too few observations or no dated timing signal.'
    ],
    hiddenWhen: [
      'The history tape has fewer than the required observed price points.',
      'The current price is stale or missing.',
      'The only future signal is an unsupported forecast instead of a source-backed flyer window.'
    ]
  },
  {
    id: 'nutrition-per-krona',
    title: 'Nutrition Per Krona',
    summary: 'Nutrition value ranks package nutrition against visible price rows, most commonly grams of protein per 10 SEK.',
    factors: [
      'Protein value: protein grams per package divided by current visible price, multiplied by 10 SEK.',
      'Alternative goals can rank calories, fibre, or explicit label evidence such as vegan or Keyhole.',
      'Sugar and salt are shown as cautions; they do not become medical advice.',
      'Products without both price evidence and package nutrition evidence are excluded instead of estimated.'
    ],
    hiddenWhen: [
      'No package nutrition facts are available.',
      'The product lacks a current visible price row.',
      'A diet or label filter depends on inference from product names rather than explicit source evidence.'
    ]
  },
  {
    id: 'confidence-labels',
    title: 'Confidence Labels',
    summary: 'Confidence labels explain source coverage, sample size, freshness, and verification limits before a score is trusted.',
    factors: [
      'High confidence means the row has enough current source evidence for the visible claim.',
      'Medium confidence means the claim is usable but coverage, source count, or freshness is partial.',
      'Low confidence means the row is shown with caveats or blocked from stronger ranking claims.',
      'Freshness labels are shown next to source timestamps and can downgrade trust without changing the raw price.'
    ],
    hiddenWhen: [
      'Source coverage is empty.',
      'Freshness is unknown on a surface that requires current price evidence.',
      'Country, chain, or source scope is mixed in a way that would make the label misleading.'
    ]
  }
] as const;

export function generateMetadata() {
  return routeMetadata('/methodology');
}

export default function MethodologyPage() {
  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
      <Eyebrow>Trust methodology</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">How GroceryView scores and hides claims</h1>
      <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-700">
        These rules describe shopper-facing scores and labels. Scores are computed from visible source rows, and surfaces hide or downgrade claims when price, freshness, unit, nutrition, or source coverage is incomplete.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {methodologySections.map((section) => (
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm" href={`#${section.id}`} key={section.id}>
            {section.title}
          </Link>
        ))}
        <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/index-methodology">
          Chain index methodology
        </Link>
        <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/methodology-changelog">
          Changelog
        </Link>
        <Link className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" href="/confidence">
          Source confidence
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Methodology summaries">
        {methodologySections.map((section) => (
          <Card className="scroll-mt-24" key={section.id}>
            <article id={section.id}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Public rule</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{section.summary}</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-950">Score inputs</p>
                  <ul className="mt-2 grid gap-2 text-sm font-semibold leading-6 text-emerald-950">
                    {section.factors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-950">When the score is hidden or downgraded</p>
                  <ul className="mt-2 grid gap-2 text-sm font-semibold leading-6 text-amber-950">
                    {section.hiddenWhen.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </Card>
        ))}
      </section>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <Eyebrow>Trust boundary</Eyebrow>
        <h2 className="mt-2 text-2xl font-black text-violet-950">What GroceryView does not infer</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-violet-950">
          GroceryView does not infer medical advice, guaranteed stock, personal dietary suitability, permanent assortment, or live shelf availability from price rows. Missing inputs stay visible as blockers so users can inspect why a score is absent.
        </p>
      </Card>
    </PageShell>
  );
}
