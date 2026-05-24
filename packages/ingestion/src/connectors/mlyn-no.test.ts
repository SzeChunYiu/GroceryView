import { describe, expect, it } from 'vitest';
import { normalizeMlynNoLocations } from './mlyn-no';

describe('mlyn-no connector', () => {
  it('verifies the chain only when multiple Norwegian locations are present', () => {
    const rows = normalizeMlynNoLocations({
      name: 'Mlyn',
      location: [
        { name: 'Mlyn Oslo', address: { streetAddress: 'Examplegata 1', addressLocality: 'Oslo' }, url: '/oslo' },
        { name: 'Mlyn Bergen', address: { streetAddress: 'Eksempelveien 2', addressLocality: 'Bergen' }, url: '/bergen' }
      ]
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.category === 'ethnic_polish_eastern_european')).toBe(true);
    expect(rows.every((row) => row.countryCode === 'NO')).toBe(true);
    expect(rows.every((row) => row.verifiedMultiLocation)).toBe(true);
  });
});
