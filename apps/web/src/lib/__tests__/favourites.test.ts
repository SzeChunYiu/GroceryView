import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FAVOURITES_STORAGE_KEY,
  readFavouriteProductEntries,
  saveFavouriteProductEntries,
  type FavouriteProductEntry
} from '../favourites.js';

const savedProduct: FavouriteProductEntry = {
  slug: 'oat-milk',
  name: 'Oat milk',
  imageUrl: null,
  savedAt: '2026-05-24T10:00:00.000Z'
};

test('favourite storage helpers no-op when localStorage is unavailable', () => {
  assert.deepEqual(readFavouriteProductEntries(null), []);
  assert.equal(saveFavouriteProductEntries([savedProduct], null), false);
});

test('favourite storage helpers no-op when private mode blocks localStorage', () => {
  const blockedStorage = {
    getItem() {
      throw new Error('localStorage is unavailable');
    },
    setItem() {
      throw new Error('localStorage is unavailable');
    }
  };

  assert.deepEqual(readFavouriteProductEntries(blockedStorage), []);
  assert.equal(saveFavouriteProductEntries([savedProduct], blockedStorage), false);
});

test('favourite storage helpers read and write browser storage when available', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };

  assert.equal(saveFavouriteProductEntries([savedProduct], storage), true);
  assert.deepEqual(readFavouriteProductEntries(storage), [savedProduct]);
  assert.equal(values.has(FAVOURITES_STORAGE_KEY), true);
});
