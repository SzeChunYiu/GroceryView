import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractCertifications, hasCertification } from '../index.js';

describe('extractCertifications', () => {
  it('extracts named organic and ethical trade certifications from product text', () => {
    const extraction = extractCertifications('Banan 5-6 st KRAV-märkt EU-Eko Fairtrade Klass 1');

    assert.equal(extraction.cert_level, 'multi');
    assert.deepEqual(extraction.cert_details.map((certification) => certification.code), ['krav', 'eu_eko', 'fairtrade']);
    assert.ok(extraction.cert_details.some((certification) => certification.matchedText === 'KRAV-märkt'));
  });

  it('extracts seafood certifications without matching ordinary words', () => {
    const extraction = extractCertifications('MSC Vildlax 4p och ASC räkor');

    assert.equal(extraction.cert_level, 'multi');
    assert.deepEqual(extraction.cert_details.map((certification) => certification.code), ['msc', 'asc']);
  });

  it('extracts Rainforest Alliance and no-antibiotics animal welfare claims', () => {
    const extraction = extractCertifications({
      title: 'Kaffe Rainforest Alliance',
      description: 'Kyckling utan antibiotika i samma kampanj'
    });

    assert.equal(extraction.cert_level, 'multi');
    assert.deepEqual(extraction.cert_details.map((certification) => certification.category), ['ethical_trade', 'animal_welfare']);
  });

  it('uses labels as extraction input and reports single certification level', () => {
    const extraction = extractCertifications({
      title: 'Ekologiska ägg',
      labels: ['eu_ecological']
    });

    assert.equal(extraction.cert_level, 'single');
    assert.equal(extraction.cert_details[0]?.code, 'eu_eko');
    assert.equal(hasCertification('Bryggkaffe Fairtrade', 'fairtrade'), true);
  });

  it('returns none when certification language is absent', () => {
    const extraction = extractCertifications('Svenska äpplen klass 1 lösvikt');

    assert.equal(extraction.cert_level, 'none');
    assert.deepEqual(extraction.cert_details, []);
  });
});
