import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceChartTerminal, type PriceChartTerminalModel } from './price-chart-terminal';

const chart: PriceChartTerminalModel = {
  available: false,
  title: 'Keyboard test terminal',
  sourceLabel: 'test source',
  confidenceLabel: 'test confidence',
  caveat: 'No renderer is loaded for keyboard-only navigation tests.',
  defaultWindow: '1W',
  windows: ['1W', '1M', '3M', '1Y', 'ALL'].map((label) => ({
    label: label as PriceChartTerminalModel['defaultWindow'],
    rangeLabel: `${label} range`,
    pointCount: 0,
    markerCount: 0,
    latestValueLabel: 'Not reported',
    lowValueLabel: 'Not reported',
    highValueLabel: 'Not reported',
    series: []
  }))
};

function activeElementLabel() {
  return document.activeElement?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

afterEach(() => cleanup());

test('PriceChartTerminal exposes a logical tab and shift-tab order for every timeframe control', async () => {
  render(<PriceChartTerminal chart={chart} />);
  const user = userEvent.setup();

  for (const label of ['1W', '1M', '3M', '1Y', 'ALL']) {
    assert.ok(screen.getByRole('button', { name: label }), `${label} timeframe button is reachable by role`);
  }

  const forwardOrder: string[] = [];
  for (let index = 0; index < chart.windows.length; index += 1) {
    await user.tab();
    forwardOrder.push(activeElementLabel());
  }

  const reverseOrder: string[] = [];
  for (let index = 0; index < chart.windows.length; index += 1) {
    reverseOrder.push(activeElementLabel());
    await user.tab({ shift: true });
  }

  assert.deepEqual(forwardOrder, ['1W', '1M', '3M', '1Y', 'ALL']);
  assert.deepEqual(reverseOrder, ['ALL', '1Y', '3M', '1M', '1W']);
  assert.equal(
    `forward: ${forwardOrder.join(' -> ')}\nreverse: ${reverseOrder.join(' -> ')}`,
    'forward: 1W -> 1M -> 3M -> 1Y -> ALL\nreverse: ALL -> 1Y -> 3M -> 1M -> 1W'
  );
});
