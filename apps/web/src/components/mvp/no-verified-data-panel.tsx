import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandArtEmptyBackdrop } from '@/components/brand-art/brand-art-empty-backdrop';

export function NoVerifiedDataPanel({
  title = 'No verified data yet',
  message = 'We do not have enough verified observations to show this panel. GroceryView avoids showing estimated or fabricated prices.',
  action
}: Readonly<{
  title?: string;
  message?: string;
  action?: ReactNode;
}>) {
  return (
    <div className="relative" data-brand-art-empty-state>
      <BrandArtEmptyBackdrop />
      <section className="relative z-10 rounded-[1.75rem] border border-amber-200 bg-amber-50/95 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Fail-closed panel</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-amber-950">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {action ?? (
          <>
            <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-950 shadow-sm" href="/data-sources">
              Data sources
            </Link>
            <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-950 shadow-sm" href="/methodology">
              Methodology
            </Link>
          </>
        )}
      </div>
    </section>
    </div>
  );
}
