import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractCertifications } from '../lib/extractors/cert.js';

describe('extractCertifications', () => {
  it('parses Swedish and international certification labels', () => {
    const result = extractCertifications('KRAV-märkt EU-Eko Fairtrade MSC ASC Rainforest Alliance utan antibiotika');
    assert.equal(result.cert_level, 'multi');
    assert.deepEqual(result.cert_details.map((detail) => detail.code).sort(), [
      'antibiotic_free',
      'asc',
      'eu_eko',
      'fairtrade',
      'krav',
      'msc',
      'rainforest_alliance'
    ].sort());
  });

  it('keeps multi-cert products distinct without duplicate details', () => {
    const result = extractCertifications(['KRAV tomater', 'krav certifierad', 'Fairtrade']);
    assert.equal(result.cert_level, 'multi');
    assert.deepEqual(result.cert_details.map((detail) => detail.code).sort(), ['fairtrade', 'krav']);
  });

  it('returns none when no certification signal is present', () => {
    assert.deepEqual(extractCertifications('vanliga svenska äpplen'), { cert_level: 'none', cert_details: [] });
  });
});
