import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('./../page.tsx', import.meta.url), 'utf8');

const relativeTime = new Intl.RelativeTimeFormat('sv-SE', { numeric: 'auto' });
const sample = `Expires in ${relativeTime.format(2, 'day')}`;

if (sample !== 'Expires in om 2 dagar') {
  throw new Error(`Unexpected RelativeTimeFormat snapshot: ${sample}`);
}

if (!/formatDays\\(value: number\\) \\{[^}]*relativeTimeFormatter\\.format\\(Math\\.round\\(value\\), 'day'\\)/s.test(pageSource)) {
  throw new Error('Expiry deals formatDays helper no longer uses Swedish RelativeTimeFormat formatting');
}

if (!/Expires in \\{formatDays\\(item\\.hoursUntilExpiry \\/ 24\\)\\}/.test(pageSource)) {
  throw new Error('Expiry deals output text does not match expected label');
}
