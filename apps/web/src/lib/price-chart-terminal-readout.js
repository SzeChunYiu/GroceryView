export function priceChartTerminalLatestPoint(window) {
  return window?.series?.[0]?.points?.at(-1);
}

export function formatPriceChartTerminalReadout(window) {
  const latestPoint = priceChartTerminalLatestPoint(window);
  if (!window || !latestPoint) return 'no point selected';
  return `${window.latestValueLabel} · ${latestPoint.time.slice(0, 10)}`;
}
