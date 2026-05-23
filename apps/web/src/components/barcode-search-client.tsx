'use client';

import { useState } from 'react';
import { FormEvent } from 'react';
import Link from 'next/link';
import { Card } from '@/components/data-ui';
import { searchProductsByEan, validateEanInput } from '@/lib/search-api';

export function BarcodeSearchClient() {
  const [eanInput, setEanInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [message, setMessage] = useState('Enter a barcode and load exact-matching verified products.');
  const [products, setProducts] = useState<Array<{ slug?: string; name?: string; brand?: string; chain?: string }>>([]);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ean = formData.get('ean');
    const value = typeof ean === 'string' ? ean : '';
    const validation = validateEanInput(value);

    if (validation) {
      setStatus('error');
      setMessage(validation);
      setProducts([]);
      return;
    }

    setStatus('loading');
    setMessage('Checking exact barcode matches in verified product rows...');
    try {
      const result = await searchProductsByEan(value);
      setProducts(result.products);
      if (result.products.length === 0) {
        setStatus('empty');
        setMessage('No verified products exactly match this barcode.');
        return;
      }
      setStatus('ready');
      setMessage(`Found ${result.products.length} product${result.products.length === 1 ? '' : 's'} for this barcode.`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Barcode search failed. Please try again.');
      setProducts([]);
    }
  }

  return (
    <Card className="border-violet-200 bg-violet-50/80">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Barcode helper</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Find exact barcode matches</h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Use this helper for barcode scan inputs. It validates malformed / missing values in the UI first, then fetches <code>/api/search?ean=</code> and only shows exact matches.
      </p>
      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitSearch}>
        <label className="sr-only" htmlFor="ean-input">
          Barcode value
        </label>
        <input
          className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
          id="ean-input"
          name="ean"
          onChange={(event) => setEanInput(event.target.value)}
          placeholder="0735000123456"
          value={eanInput}
        />
        <button
          className="rounded-full bg-indigo-800 px-4 py-3 text-sm font-black text-white disabled:bg-slate-400"
          disabled={status === 'loading' || !eanInput.trim()}
          type="submit"
        >
          {status === 'loading' ? 'Searching…' : 'Search barcode'}
        </button>
      </form>
      <p className="mt-3 text-sm font-black" data-status={status}>
        {message}
      </p>
      {products.length > 0 ? (
        <div className="mt-4 space-y-3">
          {products.map((product) => {
            const title = product.name?.trim() || 'Unknown product';
            const subtitle = [product.brand, product.chain].filter(Boolean).join(' · ') || 'No brand metadata';
            const target = product.slug ? `/products/${product.slug}` : null;

            return (
              <div className="rounded-2xl bg-white p-3" key={`${product.barcode || product.code || title}-${product.chain ?? 'product'}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Barcode match</p>
                <p className="mt-1 text-sm font-black text-slate-950">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
                {target ? (
                  <Link className="mt-3 inline-block rounded-full bg-violet-900 px-3 py-2 text-xs font-black text-white" href={target}>
                    Open product
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
