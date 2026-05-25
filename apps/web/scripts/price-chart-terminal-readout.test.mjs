import assert from 'node:assert/strict';

import {
  formatPriceChartTerminalReadout,
  priceChartTerminalLatestPoint
} from '../src/lib/price-chart-terminal-readout.js';

const windowWithPoints = {
  label: '1M',
  rangeLabel: 'last month',
  pointCount: 2,
  markerCount: 0,
  latestValueLabel: '$4.29',
  lowValueLabel: '$3.99',
  highValueLabel: '$4.29',
  series: [
    {
      id: 'store-1',
      storeName: 'Corner Market',
      sourceType: 'receipt',
      lineStyle: 'solid',
      markers: [],
      points: [
        { time: '2026-05-01T12:00:00.000Z', value: 3.99, confidence: 0.92 },
        { time: '2026-05-20T12:00:00.000Z', value: 4.29, confidence: 0.95 }
      ]
    }
  ]
};

assert.equal(priceChartTerminalLatestPoint(windowWithPoints), windowWithPoints.series[0].points[1]);
assert.equal(formatPriceChartTerminalReadout(windowWithPoints), '$4.29 · 2026-05-20');

assert.equal(formatPriceChartTerminalReadout({ ...windowWithPoints, series: [] }), 'no point selected');
assert.equal(
  formatPriceChartTerminalReadout({
    ...windowWithPoints,
    pointCount: 0,
    series: [{ ...windowWithPoints.series[0], points: [] }]
  }),
  'no point selected'
);
