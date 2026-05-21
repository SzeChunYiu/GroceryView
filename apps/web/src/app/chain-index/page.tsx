import Link from 'next/link';
import { calculateBrandTierIndices, calculateChainPriceIndex } from '@groceryview/core';
import { buildBrandTierPriceObservations, buildChainPriceObservations } from '@/lib/chain-index-data';

export const dynamic = 'force-static';

// Tint a cell by how far its index sits from the market median (100).
function tint(index: number): string {
  const diff = Math.max(-25, Math.min(25, index - 100));
  if (diff <= 0) return `rgba(29, 134, 73, ${(-diff / 25) * 0.55 + 0.06})`; // green = cheaper
  return `rgba(217, 79, 61, ${(diff / 25) * 0.55 + 0.06})`; // red = pricier
}

function confidenceDot(confidence: 'high' | 'medium' | 'low'): string {
  return confidence === 'high' ? '#1D8649' : confidence === 'medium' ? '#F59E0B' : '#94a3b8';
}

export default function ChainIndexPage() {
  const summary = calculateChainPriceIndex(buildChainPriceObservations());
  const brandTierSummary = calculateBrandTierIndices(buildBrandTierPriceObservations());

  // Pick the categories covered by the most chains (then by market size) for the matrix.
  const coverageByCategory = new Map<string, number>();
  for (const chain of summary.chains) {
    for (const cell of chain.byCategory) {
      coverageByCategory.set(cell.category, (coverageByCategory.get(cell.category) ?? 0) + 1);
    }
  }
  const displayCategories = [...coverageByCategory.entries()]
    .filter(([, chains]) => chains >= 2)
    .sort((a, b) => b[1] - a[1] || (summary.marketReferenceByCategory[b[0]] ?? 0) - (summary.marketReferenceByCategory[a[0]] ?? 0))
    .slice(0, 12)
    .map(([category]) => category);

  const cell = (chainId: string, category: string) =>
    summary.chains.find((c) => c.chainId === chainId)?.byCategory.find((b) => b.category === category);

  const hasData = summary.chains.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/map" className="hover:text-market-mint">Map</Link>
          <Link href="/stores" className="hover:text-market-mint">Stores</Link>
          <Link href="/categories/coffee" className="hover:text-market-mint">Categories</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Chain price index</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          Which chain is actually cheaper?
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Each chain is scored on a <strong>100-centred index</strong> where <strong>100 = the market median</strong>{' '}
          for a category. Below 100 is cheaper than the market; above is pricier. Built from{' '}
          {summary.generatedFrom.toLocaleString()} real unit-price observations across {summary.chains.length} chains.
        </p>
      </header>

      {!hasData ? (
        <div className="rounded-lg border border-market-ink/10 bg-white p-6 text-market-ink/60">
          Not enough comparable price data yet — the index appears as the ingestion connectors fill in.
        </div>
      ) : (
        <>
          {/* Leaderboard */}
          <section className="mb-10 grid gap-3">
            {summary.chains.map((chain) => {
              const cheaper = chain.overallIndex < 100;
              return (
                <div key={chain.chainId} className="rounded-lg border border-market-ink/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: confidenceDot(chain.confidence) }}
                        title={`${chain.confidence} confidence`}
                      />
                      <span className="text-lg font-black">{chain.chainId}</span>
                      <span className="text-xs text-market-ink/45">
                        {chain.observations.toLocaleString()} obs · {chain.categoriesCovered} categories · {chain.confidence}
                      </span>
                    </div>
                    <span className={`text-2xl font-black ${cheaper ? 'text-market-mint' : 'text-market-tomato'}`}>
                      {chain.overallIndex.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-market-oat/50">
                    <div
                      className={cheaper ? 'h-full bg-market-mint' : 'h-full bg-market-tomato'}
                      style={{ width: `${Math.max(4, Math.min(100, chain.overallIndex / 1.5))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </section>



          {/* Brand tier index */}
          <section className="mb-10 rounded-lg border border-market-ink/10 bg-white p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-market-mint">Brand-tier index</div>
                <h2 className="text-2xl font-black">Private label versus national brands</h2>
              </div>
              <div className="text-sm font-bold text-market-mint">
                Private label savings: {brandTierSummary.privateLabelSavingsPercent.toFixed(1)}%
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {brandTierSummary.indices.map((tier) => {
                const cheaper = tier.value < 100;
                return (
                  <div key={tier.brandTier} className="rounded-lg border border-market-ink/10 bg-market-oat/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black">{tier.label}</div>
                        <div className="text-xs text-market-ink/50">
                          {tier.categoryCount} categories · {tier.movementPercent.toFixed(1)}% basket move
                        </div>
                      </div>
                      <div className={`text-2xl font-black ${cheaper ? 'text-market-mint' : 'text-market-tomato'}`}>
                        {tier.value.toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={cheaper ? 'h-full bg-market-mint' : 'h-full bg-market-tomato'}
                        style={{ width: `${Math.max(6, Math.min(100, tier.value / 1.4))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-market-ink/65 md:grid-cols-2">
              <div className="rounded-lg bg-market-mint/10 p-3">
                <div className="font-bold text-market-ink">Highest savings categories</div>
                <div>{brandTierSummary.highestSavingsCategories.join(' · ')}</div>
              </div>
              <div className="rounded-lg bg-market-tomato/10 p-3">
                <div className="font-bold text-market-ink">Premium gap</div>
                <div>{brandTierSummary.premiumGapPercent.toFixed(1)}% versus private-label basket average.</div>
              </div>
            </div>
          </section>

          {/* Category matrix */}
          <section className="overflow-x-auto rounded-lg border border-market-ink/10 bg-white">
            <div className="border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
              Category-wise index (chains × categories)
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className="sticky left-0 bg-white px-3 py-2 font-bold">Chain</th>
                  {displayCategories.map((c) => (
                    <th key={c} className="px-2 py-2 text-center text-xs font-semibold text-market-ink/55">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.chains.map((chain) => (
                  <tr key={chain.chainId} className="border-t border-market-ink/5">
                    <td className="sticky left-0 bg-white px-3 py-2 font-bold">{chain.chainId}</td>
                    {displayCategories.map((category) => {
                      const c = cell(chain.chainId, category);
                      if (!c) return <td key={category} className="px-2 py-2 text-center text-market-ink/20">·</td>;
                      return (
                        <td
                          key={category}
                          className="px-2 py-2 text-center font-semibold"
                          style={{ background: tint(c.index) }}
                          title={`${c.observations} obs · market ref ${c.marketReference} SEK · ${c.confidence}${c.estimated ? ' · estimated' : ''}`}
                        >
                          {c.estimated ? <span className="italic text-market-ink/60">~{c.index.toFixed(0)}</span> : c.index.toFixed(0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Methodology */}
          <section className="mt-6 rounded-lg border border-market-ink/10 bg-market-oat/20 p-4 text-sm leading-6 text-market-ink/65">
            <div className="mb-1 font-bold text-market-ink/80">How this stays comparable with incomplete data</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>Each chain is judged only on the categories it actually carries, against the <strong>market median for that category</strong> — no two chains need to stock the same products.</li>
              <li>Unit prices are normalised to a base unit (kg / l / piece), so pack sizes compare fairly.</li>
              <li>Thin cells are shrunk toward the market (100) so a single observation can&apos;t swing the score; cells marked <span className="italic">~</span> are <strong>estimated</strong> (low coverage).</li>
              <li>Categories aggregate with a market-size-weighted geometric mean. Dots show confidence (green/amber/grey).</li>
              <li>Source: real ingested unit prices (Coop, Willys, Hemköp direct feeds + Matpriskollen multi-store offers). Matched-basket refinement is layered on as connectors expand.</li>
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
