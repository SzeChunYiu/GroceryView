'use client';

import { useMemo, useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useList } from '@/hooks/useList';

type ItemDetailListShortcutProps = {
  productId: string;
  productName: string;
  quantity?: string;
};

export function ItemDetailListShortcut({ productId, productName, quantity }: ItemDetailListShortcutProps) {
  const { addProductItem, hasLoadedBrowserState } = useList();
  const [message, setMessage] = useState('Press L to add this item to your shopping list.');

  const shortcuts = useMemo(() => [{
    key: 'l',
    description: 'Add current item to shopping list',
    enabled: hasLoadedBrowserState,
    onKeyDown: () => {
      const result = addProductItem({
        detail: 'Added from item detail keyboard shortcut.',
        productId,
        name: productName,
        quantity: quantity || '1 item'
      });
      setMessage(result.added ? `Added ${productName} to your shopping list.` : `${productName} is already on your shopping list.`);
    }
  }], [addProductItem, hasLoadedBrowserState, productId, productName, quantity]);

  useKeyboardShortcuts(shortcuts);

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 text-sm font-bold text-slate-700 shadow-lg shadow-slate-900/10 sm:right-auto sm:w-[28rem]"
    >
      <span className="mr-2 rounded-md bg-emerald-100 px-2 py-1 font-black text-emerald-900">L</span>
      {message}
    </aside>
  );
}
