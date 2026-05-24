'use client';

import { useMemo, useState } from 'react';
import type { BulkImportedListItemInput, BulkImportResult } from '@/hooks/useList';

type BulkImportDialogProps = {
  onImportItems: (items: BulkImportedListItemInput[]) => BulkImportResult;
};

type ProductCatalogMatch = {
  category: string;
  keywords: string[];
  productName: string;
  productSlug: string;
};

export const productCatalogMatches: ProductCatalogMatch[] = [
  {
    category: 'breakfast',
    keywords: ['oats', 'oatmeal', 'havregryn', 'porridge'],
    productName: 'Havregryn Extra Fylliga',
    productSlug: 'havregryn-extra-fylliga-101758934-st'
  },
  {
    category: 'pantry',
    keywords: ['pasta', 'makaroner', 'macaroni'],
    productName: 'Makaroner Pasta',
    productSlug: 'makaroner-pasta-101302991-st'
  },
  {
    category: 'pantry',
    keywords: ['honey', 'honung', 'svensk honung'],
    productName: 'Svensk Honung',
    productSlug: 'svensk-honung-101550069-st'
  },
  {
    category: 'coffee',
    keywords: ['coffee', 'kaffe', 'bryggkaffe'],
    productName: 'Kaffe',
    productSlug: 'kaffe'
  },
  {
    category: 'dairy',
    keywords: ['milk', 'mjölk', 'fil'],
    productName: 'Mjölk',
    productSlug: 'mjolk'
  },
  {
    category: 'produce',
    keywords: ['fruit', 'frukt', 'apple', 'äpple', 'banana', 'banan'],
    productName: 'Fresh fruit',
    productSlug: 'fresh-fruit'
  },
  {
    category: 'frozen',
    keywords: ['frozen vegetables', 'frysta grönsaker', 'vegetables', 'grönsaker'],
    productName: 'Frozen vegetables',
    productSlug: 'frozen-vegetables'
  }
];

function normalize(value: string) {
  return value.toLocaleLowerCase('sv-SE').normalize('NFKD').replace(/\p{Diacritic}/gu, '');
}

function slugify(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
}

export function parseBulkImportLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ xX]\])\s*/, '').trim())
    .filter(Boolean);
}

export function matchBulkImportLineToCatalog(line: string): ProductCatalogMatch | null {
  const normalizedLine = normalize(line);
  return productCatalogMatches.find((candidate) => {
    const normalizedName = normalize(candidate.productName);
    return normalizedName.includes(normalizedLine)
      || normalizedLine.includes(normalizedName)
      || candidate.keywords.some((keyword) => normalizedLine.includes(normalize(keyword)));
  }) ?? null;
}

function itemForLine(line: string, index: number): BulkImportedListItemInput {
  const match = matchBulkImportLineToCatalog(line);
  return {
    id: `bulk-clipboard-${index}-${match?.productSlug ?? slugify(line)}`,
    importSource: 'bulk-clipboard',
    matchedProductName: match?.productName,
    matchedProductSlug: match?.productSlug,
    name: line,
    quantity: '1 item',
    detail: match
      ? `Matched product catalog: ${match.productName} (${match.category})`
      : 'No catalog match yet — kept as plain text'
  };
}

export function BulkImportDialog({ onImportItems }: Readonly<BulkImportDialogProps>) {
  const [plainText, setPlainText] = useState('');
  const [clipboardStatus, setClipboardStatus] = useState('Paste a list manually or read from the clipboard.');
  const [lastImportSummary, setLastImportSummary] = useState('');
  const lines = useMemo(() => parseBulkImportLines(plainText), [plainText]);
  const importItems = useMemo(() => lines.map(itemForLine), [lines]);
  const matchedCount = importItems.filter((item) => item.matchedProductSlug).length;
  const unmatchedLines = useMemo(() => (
    lines.filter((line) => matchBulkImportLineToCatalog(line) === null)
  ), [lines]);

  async function pasteFromClipboard() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setPlainText(clipboardText);
      setClipboardStatus('Clipboard text loaded. Review matches before importing.');
    } catch {
      setClipboardStatus('Clipboard read was blocked. Paste the list into the text area instead.');
    }
  }

  function importList() {
    if (importItems.length === 0) return;
    const result = onImportItems(importItems);
    setLastImportSummary(`Imported ${result.addedCount} new line(s), ${matchedCount} matched to the product catalog. ${result.snapshotMessage}`);
    setPlainText('');
  }

  return (
    <section aria-labelledby="bulk-import-title" className="mt-6 rounded-[1.75rem] border border-sky-200 bg-sky-50/90 p-5 shadow-sm" role="dialog">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Bulk import</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950" id="bulk-import-title">Paste a shopping list</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Paste plain text with one item per line. GroceryView matches each line against a product catalog subset and keeps unmatched lines as editable list rows.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-black text-sky-900 transition hover:border-sky-700"
          onClick={pasteFromClipboard}
          type="button"
        >
          Read clipboard
        </button>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-black text-slate-700">Plain-text list, one item per line</span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-2xl border border-sky-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-sky-700"
          onChange={(event) => setPlainText(event.target.value)}
          placeholder={'coffee\\noats\\nfruit'}
          value={plainText}
        />
      </label>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="rounded-2xl bg-white/80 p-4 text-sm font-semibold text-slate-700">
          <p className="font-black text-slate-950">{clipboardStatus}</p>
          <p className="mt-1">{lines.length} parsed line(s) · {matchedCount} catalog match(es) · {unmatchedLines.length} unmatched line(s).</p>
          {unmatchedLines.length > 0 ? (
            <p className="mt-2 rounded-xl bg-amber-50 p-3 text-amber-950">unmatchedLines: {unmatchedLines.join(', ')}</p>
          ) : null}
          {lastImportSummary ? <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-emerald-950">{lastImportSummary}</p> : null}
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={importItems.length === 0}
          onClick={importList}
          type="button"
        >
          Import matched items
        </button>
      </div>

      {importItems.length > 0 ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {importItems.map((item) => (
            <div className="rounded-2xl border border-sky-100 bg-white p-3 text-sm font-semibold text-slate-700" key={item.id}>
              <p className="font-black text-slate-950">{item.name}</p>
              <p className="mt-1">{item.detail}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">matchedProductSlug: {item.matchedProductSlug ?? 'none'}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
