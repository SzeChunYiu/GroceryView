import { benchmarkRegistry } from '../data/benchmarkRegistry.js';
import type { CountryCode, EssentialsVertical, OfficialBenchmarkCategory, OfficialBenchmarkSource } from '../types/benchmark.js';

export function getBenchmarksFor(country: CountryCode, vertical: EssentialsVertical): OfficialBenchmarkSource[] {
  return benchmarkRegistry.filter((source) => source.countries.includes(country) && source.verticals.includes(vertical));
}

export function getBenchmarkCategories(source: OfficialBenchmarkSource, vertical?: EssentialsVertical): OfficialBenchmarkCategory[] {
  return vertical ? source.categories.filter((category) => category.vertical === vertical) : source.categories;
}

export function linkBenchmarkToCommodity(category: OfficialBenchmarkCategory, commodityId: string): OfficialBenchmarkCategory {
  const commodityIds = new Set([...(category.groceryViewCommodityIds ?? []), commodityId]);
  return { ...category, groceryViewCommodityIds: [...commodityIds].sort() };
}

export { benchmarkRegistry };
