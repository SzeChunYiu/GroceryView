export type PriceEventMarker = {
  type?: string;
  time: string;
};

export type PriceEventPoint = {
  time: string;
  value: number;
};

export type PriceEventSeries = {
  sourceType: string;
  points: PriceEventPoint[];
  markers: PriceEventMarker[];
};

export type ShelfOccupancyDropContext = {
  status: 'temporary_clearance' | 'stable_campaign' | 'observed_drop' | 'no_recent_drop';
  label: string;
  detail: string;
  purchaseTiming: string;
};

function sortedPoints(points: PriceEventPoint[]) {
  return [...points]
    .filter((point) => Number.isFinite(point.value))
    .sort((left, right) => Date.parse(left.time) - Date.parse(right.time));
}

function hasCampaignMarker(series: PriceEventSeries, latestTime: string) {
  return series.markers.some((marker) =>
    marker.time === latestTime && (marker.type === 'promotion' || marker.type === 'member')
  );
}

function daysBetween(left: string, right: string) {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  if (Number.isNaN(leftMs) || Number.isNaN(rightMs)) return Number.POSITIVE_INFINITY;
  return Math.abs(rightMs - leftMs) / (24 * 60 * 60 * 1000);
}

function nearPrice(left: number, right: number) {
  if (right === 0) return left === 0;
  return Math.abs(left - right) / right <= 0.03;
}

export function shelfOccupancyContextForDrop(series: PriceEventSeries[]): ShelfOccupancyDropContext {
  const candidates = series
    .flatMap((entry) => {
      const points = sortedPoints(entry.points);
      return points
        .slice(1)
        .map((point, index) => {
          const previous = points[index]!;
          if (point.value >= previous.value) return null;
          return { entry, latest: point, previous, points };
        });
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => Date.parse(right.latest.time) - Date.parse(left.latest.time));

  const latestDrop = candidates[0];
  if (!latestDrop) {
    return {
      status: 'no_recent_drop',
      label: 'No fresh drop',
      detail: 'The latest visible observation did not move below the prior price.',
      purchaseTiming: 'Wait for a confirmed drop before treating this as a buy signal.'
    };
  }

  const dropPercent = ((latestDrop.previous.value - latestDrop.latest.value) / latestDrop.previous.value) * 100;
  const repeatedLow = latestDrop.points
    .some((point) =>
      point.time !== latestDrop.latest.time &&
      daysBetween(point.time, latestDrop.latest.time) <= 14 &&
      nearPrice(point.value, latestDrop.latest.value)
    );
  const campaignSource = latestDrop.entry.sourceType === 'flyer' ||
    latestDrop.entry.sourceType === 'member' ||
    hasCampaignMarker(latestDrop.entry, latestDrop.latest.time);
  const shelfOnlySource = latestDrop.entry.sourceType === 'shelf' ||
    latestDrop.entry.sourceType === 'shelf_photo' ||
    latestDrop.entry.sourceType === 'receipt';

  if (campaignSource || repeatedLow) {
    return {
      status: 'stable_campaign',
      label: 'Stable campaign price',
      detail: repeatedLow
        ? 'The latest lower price repeats within the visible window, which is more consistent with a campaign than a one-off shelf clearance.'
        : 'The latest lower price is backed by campaign or member-price evidence.',
      purchaseTiming: 'Reasonable to compare baskets and buy during the campaign window.'
    };
  }

  if (shelfOnlySource || dropPercent >= 15) {
    return {
      status: 'temporary_clearance',
      label: 'Temporary store clearance',
      detail: `The latest drop is a one-observation ${dropPercent.toFixed(0)}% move without repeated campaign evidence.`,
      purchaseTiming: 'Buy only if the local shelf still shows the price; do not assume it will hold.'
    };
  }

  return {
    status: 'observed_drop',
    label: 'Observed drop',
    detail: `The latest visible price is ${dropPercent.toFixed(0)}% below the prior observation, but campaign stability is not yet proven.`,
    purchaseTiming: 'Check the store or wait for another observation before stocking up.'
  };
}
