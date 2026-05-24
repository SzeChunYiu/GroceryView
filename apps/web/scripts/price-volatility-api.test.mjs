#!/usr/bin/env node
import assert from 'node:assert/strict';

const baseUrl = process.env.PRICE_VOLATILITY_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const endpoint = new URL('/api/pricing/volatility', baseUrl);

const first = await fetch(endpoint);
assert.equal(first.status, 200, 'initial volatility request should return 200');

const etag = first.headers.get('etag');
assert.ok(etag, 'initial volatility response should include an ETag');

const cacheControl = first.headers.get('cache-control');
assert.ok(cacheControl, 'initial volatility response should include Cache-Control');

const second = await fetch(endpoint, { headers: { 'If-None-Match': etag } });
assert.equal(second.status, 304, 'matching If-None-Match should return 304');
assert.equal(second.headers.get('etag'), etag, '304 response should keep the same ETag');
assert.equal(second.headers.get('cache-control'), cacheControl, '304 response should keep stable Cache-Control');

console.log(`price volatility conditional GET passed for ${endpoint}`);
