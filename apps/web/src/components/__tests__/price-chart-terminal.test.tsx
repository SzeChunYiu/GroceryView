import assert from 'node:assert/strict';
import test from 'node:test';

import { getRenderableChartSeries, type PriceChartTerminalSeries } from '../price-chart-terminal';

function makeSeries(points: PriceChartTerminalSeries['points']): PriceChartTerminalSeries {
  return {
    id: 'series-1',
    storeName: 'Test store',
    sourceType: 'verified',
    lineStyle: 'solid',
    points,
    markers: []
  };
}

test('omits empty point series before rendering chart data', () => {
  assert.deepEqual(getRenderableChartSeries([makeSeries([])]), []);
});

test('keeps series that have chart points', () => {
  const populatedSeries = makeSeries([{ time: '2026-05-24T00:00:00.000Z', value: 42, confidence: 1 }]);

  assert.deepEqual(getRenderableChartSeries([makeSeries([]), populatedSeries]), [populatedSeries]);
});
