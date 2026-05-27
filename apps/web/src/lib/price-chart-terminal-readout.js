export function priceChartTerminalLatestPoint(window) {
  return window?.series?.[0]?.points?.at(-1);
}

export function formatPriceChartTerminalReadout(window) {
  const latestPoint = priceChartTerminalLatestPoint(window);
  if (!window || !latestPoint) return 'no point selected';
  return `${window.latestValueLabel} · ${latestPoint.time.slice(0, 10)}`;
}

function explanationForMarker(marker) {
  if (marker.type === 'promotion' || marker.sourceType === 'flyer') {
    return 'A flyer or promotion marker was present on this observed point; no broader retailer cause is inferred.';
  }
  if (marker.type === 'member' || marker.sourceType === 'member') {
    return 'A member-price marker was present on this observed point; eligibility may require the retailer membership source.';
  }
  if (marker.type === 'price_change') {
    return 'A consecutive observed price move was detected and linked to this chart marker.';
  }
  if (marker.type === 'new_low') {
    return 'This point matched the lowest observed value in the current source series.';
  }
  if (marker.type === 'receipt_confirmed' || marker.sourceType === 'receipt') {
    return 'A receipt-backed observation confirmed this price point.';
  }
  if (marker.type === 'source_warning') {
    return 'The marker flags partial or lower-confidence source evidence for this point.';
  }
  return 'This note is generated from the marker metadata available for this observed price point.';
}

export function buildPriceChartTerminalMoveNotes(window, limit = 5) {
  if (!window?.series?.length) return [];
  return window.series
    .flatMap((series) => (series.markers ?? []).map((marker) => ({
      id: `${series.id}:${marker.time}:${marker.text}`,
      markerKey: `${series.id}:${marker.time.slice(0, 10)}`,
      markerLabel: marker.text,
      observedAt: marker.time,
      sourceLabel: `${series.storeName} · ${marker.sourceType ?? series.sourceType}`,
      provenanceLabel: marker.provenanceLabel ?? null,
      explanation: explanationForMarker(marker)
    })))
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt))
    .slice(0, Math.max(0, limit));
}
