import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMlynNoCoverageStatus,
  fetchMlynNoCoverageStatus,
  fetchMlynNoLocations,
  parseMlynNoRegistryCandidates,
  verifyMlynNoCoverageStatus
} from '../mlyn-no.js';

const BRREG_FIXTURE = {
  _embedded: {
    enheter: [
      {
        navn: 'MLYNEK BYGG',
        organisasjonsnummer: '930117951',
        naeringskode1: { kode: '41.000', beskrivelse: 'Oppføring av bygninger' },
        forretningsadresse: { kommune: 'OSLO', adresse: ['Nordlysveien 31'] }
      },
      {
        navn: 'MLYNARCZYK UNIFORMITY',
        organisasjonsnummer: '937451369',
        naeringskode1: { kode: '47.710', beskrivelse: 'Detaljhandel med klær' },
        forretningsadresse: { kommune: 'HOLMESTRAND', adresse: ['Fjordveien 59'] }
      }
    ]
  }
};

describe('Mlyn NO connector', () => {
  it('documents that Mlyn is not source-backed as a Norwegian grocery chain', () => {
    const candidates = parseMlynNoRegistryCandidates(BRREG_FIXTURE);
    const status = buildMlynNoCoverageStatus(candidates);

    assert.equal(candidates.length, 2);
    assert.equal(candidates.some((candidate) => candidate.groceryLike), false);
    assert.equal(status.status, 'not_source_backed_as_norway_grocery_chain');
    assert.equal(status.qualifiesForChainConnector, false);
    assert.equal(status.qualifiesForLocationConnector, false);
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.equal(status.locations.length, 0);
    assert.match(status.caveat, /No official registry evidence/);
  });

  it('flags grocery-like registry matches for manual review without emitting stores', () => {
    const candidates = parseMlynNoRegistryCandidates({
      _embedded: {
        enheter: [
          {
            navn: 'MLYN DAGLIGVARER',
            organisasjonsnummer: '999999999',
            naeringskode1: { kode: '47.110', beskrivelse: 'Butikkhandel med bredt vareutvalg med hovedvekt på nærings- og nytelsesmidler' },
            forretningsadresse: { kommune: 'OSLO', adresse: ['Testveien 1'] }
          }
        ]
      }
    });
    const status = buildMlynNoCoverageStatus(candidates);

    assert.equal(status.status, 'needs_manual_review_grocery_like_name_match');
    assert.equal(status.groceryLikeCandidateCount, 1);
    assert.equal(status.locations.length, 0);
  });

  it('fetches the registry coverage status with connector headers and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const status = await fetchMlynNoCoverageStatus({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(JSON.stringify(BRREG_FIXTURE), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    assert.equal(status.candidateCount, 2);
    assert.equal(JSON.stringify(headers[0]).includes('mlyn-no-connector'), true);
    await assert.rejects(
      () => fetchMlynNoCoverageStatus({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('exposes an empty location connector until multi-location evidence exists', async () => {
    assert.deepEqual(await fetchMlynNoLocations(), []);
    assert.deepEqual(verifyMlynNoCoverageStatus().locations, []);
  });
});
