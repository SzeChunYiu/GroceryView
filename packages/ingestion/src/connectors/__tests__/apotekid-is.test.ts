import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  APOTEKID_IS_BASE_URL,
  fetchApotekidIsCatalogueStatus,
  parseApotekidIsCatalogueStatus,
  verifyApotekidIsCatalogueStatus
} from '../apotekid-is.js';

const RETRIEVED_AT = '2026-05-25T18:35:00.000Z';
const LYFJA_HOME = '<!doctype html><title>Lyfja | 41 apótek og útibú um land allt</title><main>Lyfja apótek</main>';

describe('Apótekið IS connector', () => {
  it('records the official apotekid.is redirect to Lyfja without fabricating prices', () => {
    const status = parseApotekidIsCatalogueStatus({
      sourceUrl: APOTEKID_IS_BASE_URL,
      finalUrl: 'https://www.lyfja.is/',
      html: LYFJA_HOME,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(status.chain, 'apotekid-is');
    assert.equal(status.country, 'IS');
    assert.equal(status.retailerType, 'pharmacy');
    assert.equal(status.status, 'verified_official_redirect_to_lyfja');
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.equal(status.redirectTargetUrl, 'https://www.lyfja.is/');
    assert.equal(status.retrievedAt, RETRIEVED_AT);
    assert.equal(status.provenance.parserVersion, 'apotekid-is-official-redirect-v1');
  });

  it('fetches the official domain with connector headers and follows the redirect target', async () => {
    const requested: Array<{ url: string; init?: RequestInit }> = [];
    const status = await fetchApotekidIsCatalogueStatus({
      retrievedAt: RETRIEVED_AT,
      fetchImpl: (async (url, init) => {
        requested.push({ url: String(url), init });
        const response = new Response(LYFJA_HOME, {
          status: 200,
          headers: { 'content-type': 'text/html' }
        });
        Object.defineProperty(response, 'url', { value: 'https://www.lyfja.is/', configurable: true });
        return response;
      }) as typeof fetch
    });

    assert.equal(status.redirectTargetUrl, 'https://www.lyfja.is/');
    assert.equal(requested[0]?.url, APOTEKID_IS_BASE_URL);
    assert.equal(JSON.stringify(requested[0]?.init?.headers).includes('apotekid-is-connector'), true);
    assert.equal(requested[0]?.init?.redirect, 'follow');
  });

  it('fails closed for non-Apótekið sources, missing redirect evidence, and blocked pages', () => {
    assert.throws(() => parseApotekidIsCatalogueStatus({
      sourceUrl: 'https://example.com/',
      finalUrl: 'https://www.lyfja.is/',
      html: LYFJA_HOME,
      retrievedAt: RETRIEVED_AT
    }), /only accepts apotekid\.is/);
    assert.throws(() => parseApotekidIsCatalogueStatus({
      sourceUrl: APOTEKID_IS_BASE_URL,
      finalUrl: 'https://example.com/',
      html: LYFJA_HOME,
      retrievedAt: RETRIEVED_AT
    }), /did not redirect/);
    assert.throws(() => parseApotekidIsCatalogueStatus({
      sourceUrl: APOTEKID_IS_BASE_URL,
      finalUrl: 'https://www.lyfja.is/',
      html: 'access denied',
      retrievedAt: RETRIEVED_AT
    }), /blocked\/login/);
  });

  it('exposes a static verified status for scheduling metadata', () => {
    const status = verifyApotekidIsCatalogueStatus(RETRIEVED_AT);

    assert.equal(status.sourceUrl, APOTEKID_IS_BASE_URL);
    assert.equal(status.redirectTargetUrl, 'https://www.lyfja.is/');
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
  });
});
