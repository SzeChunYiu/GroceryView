import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBrandedSwedishFuelStation, supportedFuelGradeIdsFromTags } from '../fuel-stations.js';

describe('Swedish fuel station model', () => {
  it('maps explicit OSM fuel grade tags to canonical fuel products', () => {
    assert.deepEqual(
      supportedFuelGradeIdsFromTags({
        'fuel:octane_95': 'yes',
        'fuel:octane_98': 'yes',
        'fuel:diesel': 'yes',
        'fuel:hvo100': 'yes',
        'fuel:e85': 'yes',
        'fuel:adblue': 'yes'
      }),
      ['fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85', 'fuel-adblue']
    );
  });

  it('keeps Swedish station operator, coordinates, and supported grades together', () => {
    const station = normalizeBrandedSwedishFuelStation({
      type: 'node',
      id: 32590383,
      lat: 58.1676715,
      lon: 13.5553124,
      tags: {
        amenity: 'fuel',
        brand: 'Circle K',
        operator: 'Circle K Sverige AB',
        name: 'Circle K Falkoping',
        'addr:street': 'Botvidsgatan',
        'addr:housenumber': '17',
        'addr:postcode': '521 47',
        'addr:city': 'Falkoping',
        'fuel:octane_95': 'yes',
        'fuel:diesel': 'yes',
        'fuel:adblue': 'yes'
      }
    }, '2026-05-23T13:47:42.778Z');

    assert.equal(station?.chain, 'Circle K');
    assert.equal(station?.operator, 'Circle K Sverige AB');
    assert.equal(station?.latitude, 58.1676715);
    assert.deepEqual(station?.supportedGradeIds, ['fuel-95-e10', 'fuel-diesel', 'fuel-adblue']);
  });
});
