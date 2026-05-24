'use client';

import { useEffect, useState } from 'react';
import {
  FAVOURITES_STORAGE_KEY,
  FAVOURITES_UPDATED_EVENT,
  isFavouriteProduct,
  parseFavouriteProductEntries,
  serializeFavouriteProductEntries,
  toggleFavouriteProduct,
  type FavouriteProductInput
} from '@/lib/favourites';

export function FavouriteProductToggle({
  product,
  className = ''
}: Readonly<{
  product: FavouriteProductInput;
  className?: string;
}>) {
  const [isFavourite, setIsFavourite] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      try {
        const entries = parseFavouriteProductEntries(localStorage.getItem(FAVOURITES_STORAGE_KEY));
        setIsFavourite(isFavouriteProduct(entries, product.slug));
      } catch {
        setIsFavourite(false);
      } finally {
        setIsReady(true);
      }
    }

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    };
  }, [product.slug]);

  function handleToggle() {
    try {
      const current = parseFavouriteProductEntries(localStorage.getItem(FAVOURITES_STORAGE_KEY));
      const next = toggleFavouriteProduct(current, product);
      localStorage.setItem(FAVOURITES_STORAGE_KEY, serializeFavouriteProductEntries(next.entries));
      setIsFavourite(next.isFavourite);
      window.dispatchEvent(new CustomEvent(FAVOURITES_UPDATED_EVENT, { detail: { slug: product.slug, isFavourite: next.isFavourite } }));
    } catch {
      setIsFavourite(false);
      setIsReady(true);
    }
  }

  const label = isFavourite ? `Remove ${product.name} from favourite products` : `Save ${product.name} as favourite product`;

  return (
    <button
      aria-label={label}
      aria-pressed={isFavourite}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black shadow-sm transition focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${isFavourite ? 'border-rose-200 bg-rose-600 text-white' : 'border-rose-100 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50'} ${className}`}
      data-favourite-ready={isReady}
      data-favourite-slug={product.slug}
      onClick={handleToggle}
      type="button"
    >
      <span aria-hidden="true">{isFavourite ? '♥' : '♡'}</span>
      <span>{isFavourite ? 'Saved' : 'Favourite'}</span>
    </button>
  );
}
