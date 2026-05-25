import { officialBenchmarkRegistry } from '../data/benchmarkRegistry.js';
import type { CountryCode, EssentialsVertical, OfficialBenchmarkCategory, OfficialBenchmarkSource } from '../types/benchmark.js';

export type BenchmarkCommodityLink = OfficialBenchmarkCategory & {
  groceryViewCommodityIds: string[];
};

export function getBenchmarksFor(country: CountryCode, vertical: EssentialsVertical): OfficialBenchmarkSource[] {
  return officialBenchmarkRegistry.filter(
    (source) => source.countries.includes(country) && source.verticals.includes(vertical)
  );
}

export function getBenchmarkCategories(
  source: OfficialBenchmarkSource,
  vertical?: EssentialsVertical
): OfficialBenchmarkCategory[] {
  return vertical ? source.categories.filter((category) => category.vertical === vertical) : [...source.categories];
}

export function linkBenchmarkToCommodity(
  category: OfficialBenchmarkCategory,
  commodityId: string
): BenchmarkCommodityLink {
  if (!commodityId.trim()) throw new Error('commodityId is required.');
  const commodityIds = new Set([...(category.groceryViewCommodityIds ?? []), commodityId.trim()]);
  return {
    ...category,
    groceryViewCommodityIds: [...commodityIds]
  };
}

export { officialBenchmarkCategories, officialBenchmarkRegistry } from '../data/benchmarkRegistry.js';
export type {
  BenchmarkFrequency,
  BenchmarkPriceLayer,
  BenchmarkStatus,
  CountryCode,
  EcoicopCode,
  EssentialsVertical,
  OfficialBenchmarkCategory,
  OfficialBenchmarkSource,
  OfficialIndexSourceId
} from '../types/benchmark.js';
