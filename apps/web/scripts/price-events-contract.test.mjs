import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const terminalSource = readFileSync(join(__dirname, '../src/components/price-chart-terminal.tsx'), 'utf8');

assert.match(
  terminalSource,
  /'createChart' \| 'createSeriesMarkers'/,
  'price chart terminal should load the lightweight-charts marker helper'
);
assert.match(
  terminalSource,
  /createSeriesMarkers\(line,\s*series\.markers\.map\(\(marker\) => \(\{/s,
  'price chart terminal should map each series marker into chart marker primitives'
);
assert.match(terminalSource, /time: marker\.time\.slice\(0, 10\)/, 'chart markers should use the same day keys as price points');
assert.match(terminalSource, /color: marker\.color/, 'chart markers should preserve event colors');
assert.match(terminalSource, /text: marker\.text/, 'chart markers should preserve campaign\/member\/new-low labels');
