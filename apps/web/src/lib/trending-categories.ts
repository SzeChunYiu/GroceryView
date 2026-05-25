import { categoryDealLeaders, categorySummaries, formatPct, homepageTrendingPriceChanges, seasonalProduceCalendar } from './verified-data';

export type TrendingCategory = {
  rank: number;
  slug: string;
  categoryLabel: string;
  href: string;
  score: number;
  priceMovementLabel: string;
  shopperSavesLabel: string;
  seasonalDemandLabel: string;
  evidenceLabel: string;
  topProductLabel?: string;
};

function categorySlugForLabel(label: string) {
  return categorySummaries.find((category) => category.label === label)?.slug;
}

function formatScore(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
}

export function buildTrendingCategories(limit = 8): TrendingCategory[] {
  const movementBySlug = new Map<string, { count: number; strongestMove: number; topProductLabel?: string }>();
  for (const item of homepageTrendingPriceChanges) {
    if (!item.categoryLabel) continue;
    const slug = categorySlugForLabel(item.categoryLabel);
    if (!slug) continue;
    const current = movementBySlug.get(slug) ?? { count: 0, strongestMove: 0 };
    const move = Math.abs(item.changePercent);
    movementBySlug.set(slug, {
      count: current.count + item.changeCount,
      strongestMove: Math.max(current.strongestMove, move),
      topProductLabel: current.topProductLabel ?? `${item.productName} ${item.changePercent < 0 ? 'down' : 'up'} ${formatPct(move)}`
    });
  }

  const savesBySlug = new Map<string, { count: number; bestSignal: string }>();
  for (const leader of categoryDealLeaders) {
    const current = savesBySlug.get(leader.categorySlug) ?? { count: 0, bestSignal: leader.signal };
    savesBySlug.set(leader.categorySlug, {
      count: current.count + 1,
      bestSignal: current.bestSignal
    });
  }

  const seasonalBySlug = new Map<string, { count: number; bestMonth: string }>();
  for (const row of seasonalProduceCalendar.topBestBuys) {
    const slug = categorySlugForLabel(row.categoryLabel);
    if (!slug) continue;
    const current = seasonalBySlug.get(slug) ?? { count: 0, bestMonth: row.bestBuyMonth };
    seasonalBySlug.set(slug, { count: current.count + 1, bestMonth: current.bestMonth });
  }

  return categorySummaries
    .map((category) => {
      const movement = movementBySlug.get(category.slug);
      const saves = savesBySlug.get(category.slug);
      const seasonal = seasonalBySlug.get(category.slug);
      const coverageScore = Math.min(20, (category.openPriceRows + category.chainRows) / 20);
      const movementScore = movement ? Math.min(35, movement.strongestMove + movement.count * 0.5) : 0;
      const savesScore = saves ? Math.min(30, saves.count * 6) : 0;
      const seasonalScore = seasonal ? Math.min(15, seasonal.count * 7.5) : 0;
      return {
        slug: category.slug,
        categoryLabel: category.label,
        href: `/categories/${category.slug}`,
        score: movementScore + savesScore + seasonalScore + coverageScore,
        priceMovementLabel: movement
          ? `${movement.count} recent observed price moves; strongest ${formatPct(movement.strongestMove)}`
          : 'No recent product price movement clears the discovery window',
        shopperSavesLabel: saves
          ? `${saves.count} verified deal leader${saves.count === 1 ? '' : 's'}; best signal ${saves.bestSignal}`
          : 'No source-confident deal leader yet',
        seasonalDemandLabel: seasonal
          ? `${seasonal.count} seasonal best-buy signal${seasonal.count === 1 ? '' : 's'} near ${seasonal.bestMonth}`
          : 'No seasonal best-buy row in the current calendar slice',
        evidenceLabel: `${category.openPriceRows} OpenPrices rows · ${category.chainRows} chain rows · score ${formatScore(movementScore + savesScore + seasonalScore + coverageScore)}`,
        topProductLabel: movement?.topProductLabel
      };
    })
    .filter((category) => category.score > 0)
    .sort((left, right) => right.score - left.score || left.categoryLabel.localeCompare(right.categoryLabel, 'sv'))
    .slice(0, limit)
    .map((category, index) => ({ ...category, rank: index + 1 }));
}
