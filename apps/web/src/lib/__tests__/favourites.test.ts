import { describe, expect, it } from 'vitest';

import { loadFavouriteProductEntries, saveFavouriteProductEntries } from '../favourites';

describe('favourites storage helpers', () => {
  it('no-ops when localStorage is unavailable', () => {
    expect(loadFavouriteProductEntries(null)).toEqual([]);
    expect(() => saveFavouriteProductEntries([], null)).not.toThrow();
  });
});
