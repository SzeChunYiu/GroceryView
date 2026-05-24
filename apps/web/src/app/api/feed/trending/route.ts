import {
  trendingPriceDropsFixture,
  type TrendingPriceDrop,
} from "../../../page-sections/trending";

export type TrendingFeedItem = {
  id: string;
  name: string;
  store: string;
  currentPrice: number;
  previousPrice: number;
  deltaPercent: number;
  confidence: number;
  urgency: TrendingPriceDrop["urgency"];
  urgencyLabel: string;
};

export function toTrendingFeedItem(item: TrendingPriceDrop): TrendingFeedItem {
  return {
    id: item.id,
    name: item.name,
    store: item.store,
    currentPrice: item.currentPrice,
    previousPrice: item.previousPrice,
    deltaPercent: item.deltaPercent,
    confidence: item.confidence,
    urgency: item.urgency,
    urgencyLabel: item.urgencyLabel,
  };
}

export function buildTrendingFeedPayload(items = trendingPriceDropsFixture) {
  return {
    items: items.map(toTrendingFeedItem),
  };
}

export async function GET() {
  return Response.json(buildTrendingFeedPayload());
}
