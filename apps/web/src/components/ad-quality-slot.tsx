import { adPlacementFor, adQualityChecks } from '@/lib/ad-quality-controls';

export function AdQualitySlot({ placementId = 'home-below-market-shell' }: Readonly<{ placementId?: string }>) {
  const placement = adPlacementFor(placementId);

  return (
    <aside
      aria-label={`${placement.label} consent-safe ad quality controls`}
      className="mx-auto mt-6 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
      data-ad-consent-mode={placement.consentMode}
      data-ad-placement={placement.id}
      data-reserved-height={placement.reservedHeight}
      style={{ minHeight: placement.reservedHeight }}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Consent-safe ad slot</p>
      <h2 className="mt-2 text-xl font-black text-slate-950">Allowed placement with non-personalized fallback</h2>
      <p className="mt-2 font-semibold">
        This ad slot is allowed only where it cannot obscure {placement.mustNotObscure.join(', ')}. It reserves layout space before ad content loads and defaults to non-personalized mode until consent permits otherwise.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {adQualityChecks.map((check) => (
          <div className="rounded-xl bg-slate-50 p-3" key={check.id}>
            <p className="font-black text-slate-950">{check.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5">{check.evidence}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
