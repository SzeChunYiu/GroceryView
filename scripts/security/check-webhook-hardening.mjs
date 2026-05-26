#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import process from 'node:process';

export const webhookHardeningSurfaces = [
  { id: 'billing', route: '/api/billing/subscription-events', signatureHeader: 'x-groceryview-billing-signature' },
  { id: 'notifications', route: '/api/notifications/suppression-events', signatureHeader: 'x-groceryview-signature' },
  { id: 'ingestion', route: '/api/webhooks/price-change', signatureHeader: 'x-groceryview-signature' },
  { id: 'partner', route: 'future partner integrations', signatureHeader: 'x-groceryview-signature' }
];

const requiredReplayControls = [
  'x-groceryview-timestamp',
  'x-groceryview-idempotency-key',
  'duplicate_event',
  'old_timestamp',
  'bad_signature'
];

export function checkWebhookHardeningSource(source) {
  const missingControls = requiredReplayControls.filter((control) => !source.includes(control));
  const missingSurfaces = webhookHardeningSurfaces.filter((surface) => !source.includes(surface.id));

  return {
    status: missingControls.length === 0 && missingSurfaces.length === 0 ? 'passed' : 'failed',
    checkedAt: new Date().toISOString(),
    surfaces: webhookHardeningSurfaces,
    requiredReplayControls,
    missingControls,
    missingSurfaces: missingSurfaces.map((surface) => surface.id)
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const sourcePath = process.argv[2] ?? 'packages/server/src/lib/webhookReplayProtection.ts';
  const result = checkWebhookHardeningSource(readFileSync(sourcePath, 'utf8'));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== 'passed') process.exitCode = 1;
}
