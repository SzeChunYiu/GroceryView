import { createHash } from 'node:crypto';

// Server-only content hashing for ingestion payloads. Kept in its own module so
// the node:crypto import is not present in the package barrel (index.ts). Combined
// with "sideEffects": false in package.json this lets bundlers drop this module
// entirely from client bundles that only use other db exports, avoiding the
// webpack UnhandledSchemeError on the node:crypto scheme.
export function contentHashForPayload(payload: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}
