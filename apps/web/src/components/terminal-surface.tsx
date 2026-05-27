import Link from 'next/link';
import type { ReactNode } from 'react';

export type TerminalCoverageState = 'ready' | 'loading' | 'empty' | 'partial' | 'stale' | 'error' | 'blocked';
export type TerminalConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type TerminalVerdictTone = 'positive' | 'neutral' | 'caution' | 'blocked';

/**
 * Shared state copy for terminal widgets that render verified grocery data.
 * Use `detail` to name the missing, stale, or blocked source class instead of
 * hiding coverage gaps behind a generic empty card.
 */
export type TerminalStateMessage = {
  state: Exclude<TerminalCoverageState, 'ready'>;
  title: string;
  detail: string;
  actionHref?: string;
  actionLabel?: string;
};

/** A compact market metric card for index, source, or mover tickers. */
export type TerminalTickerCardProps = {
  label: string;
  value: string;
  detail: string;
  confidence: TerminalConfidenceLevel;
  freshnessLabel: string;
  sourceLabel: string;
  deltaLabel?: string;
  href?: string;
  state?: TerminalCoverageState;
};

/** A row in a quote table; prices must be observed/source-backed strings. */
export type TerminalQuoteRow = {
  id: string;
  label: string;
  quote: string;
  comparisonLabel: string;
  confidence: TerminalConfidenceLevel;
  freshnessLabel: string;
  sourceLabel: string;
  href?: string;
};

export type TerminalQuoteTableProps = {
  caption: string;
  rows: TerminalQuoteRow[];
  stateMessage?: TerminalStateMessage;
};

/** Deal judgement copy that names the factual rule and claim boundary. */
export type TerminalDealVerdictProps = {
  title: string;
  verdict: string;
  tone: TerminalVerdictTone;
  ruleLabel: string;
  evidenceLabel: string;
  boundary: string;
};

export type TerminalConfidenceBadgeProps = {
  level: TerminalConfidenceLevel;
  label?: string;
  sampleLabel?: string;
};

export type TerminalFreshnessChipProps = {
  label: string;
  state: 'fresh' | 'aging' | 'stale' | 'unknown';
};

export type TerminalSourceCitation = {
  id: string;
  label: string;
  href: string;
  sourceType: string;
  coverageLabel: string;
};

export type TerminalSourceCitationsProps = {
  citations: TerminalSourceCitation[];
  title?: string;
};

export type TerminalMarketOption = {
  id: string;
  label: string;
  href: string;
  active?: boolean;
  state?: 'available' | 'partial' | 'blocked';
  detail?: string;
};

export type TerminalMarketSwitcherProps = {
  label: string;
  markets: TerminalMarketOption[];
};

export type TerminalMethodologyLink = {
  href: string;
  label: string;
  detail: string;
};

export type TerminalMethodologyLinksProps = {
  links: TerminalMethodologyLink[];
  title?: string;
};

const stateTone: Record<TerminalCoverageState, string> = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  loading: 'border-slate-200 bg-slate-50 text-slate-700',
  empty: 'border-slate-200 bg-white text-slate-700',
  partial: 'border-amber-200 bg-amber-50 text-amber-950',
  stale: 'border-orange-200 bg-orange-50 text-orange-950',
  error: 'border-rose-200 bg-rose-50 text-rose-950',
  blocked: 'border-violet-200 bg-violet-50 text-violet-950'
};

const confidenceTone: Record<TerminalConfidenceLevel, string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  medium: 'border-sky-200 bg-sky-50 text-sky-900',
  low: 'border-amber-200 bg-amber-50 text-amber-950',
  unknown: 'border-slate-200 bg-slate-50 text-slate-700'
};

const freshnessTone: Record<TerminalFreshnessChipProps['state'], string> = {
  fresh: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  aging: 'border-amber-200 bg-amber-50 text-amber-950',
  stale: 'border-orange-200 bg-orange-50 text-orange-950',
  unknown: 'border-slate-200 bg-slate-50 text-slate-700'
};

const verdictTone: Record<TerminalVerdictTone, string> = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  neutral: 'border-slate-200 bg-white text-slate-950',
  caution: 'border-amber-200 bg-amber-50 text-amber-950',
  blocked: 'border-violet-200 bg-violet-50 text-violet-950'
};

function stateLabel(state: TerminalCoverageState) {
  if (state === 'ready') return 'Ready';
  if (state === 'partial') return 'Partial coverage';
  if (state === 'blocked') return 'Blocked source';
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function confidenceLabel(level: TerminalConfidenceLevel) {
  return level === 'unknown' ? 'Confidence unknown' : `${level} confidence`;
}

function TerminalSurfaceFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}

export function TerminalStatePanel({ actionHref, actionLabel, detail, state, title }: Readonly<TerminalStateMessage>) {
  return (
    <TerminalSurfaceFrame>
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${stateTone[state]}`}>
        {stateLabel(state)}
      </span>
      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
      {actionHref && actionLabel ? (
        <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </TerminalSurfaceFrame>
  );
}

export function TerminalConfidenceBadge({ label, level, sampleLabel }: Readonly<TerminalConfidenceBadgeProps>) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${confidenceTone[level]}`}>
      {label ?? confidenceLabel(level)}
      {sampleLabel ? <span className="normal-case tracking-normal opacity-75">{sampleLabel}</span> : null}
    </span>
  );
}

export function TerminalFreshnessChip({ label, state }: Readonly<TerminalFreshnessChipProps>) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${freshnessTone[state]}`}>
      {label}
    </span>
  );
}

export function TerminalTickerCard({
  confidence,
  deltaLabel,
  detail,
  freshnessLabel,
  href,
  label,
  sourceLabel,
  state = 'ready',
  value
}: Readonly<TerminalTickerCardProps>) {
  const content = (
    <TerminalSurfaceFrame>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <span className={`rounded-full border px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] ${stateTone[state]}`}>
          {stateLabel(state)}
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      {deltaLabel ? <p className="mt-1 text-sm font-black text-emerald-800">{deltaLabel}</p> : null}
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <TerminalConfidenceBadge level={confidence} />
        <TerminalFreshnessChip label={freshnessLabel} state={state === 'stale' ? 'stale' : state === 'partial' ? 'aging' : 'fresh'} />
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Source: {sourceLabel}</p>
    </TerminalSurfaceFrame>
  );

  return href ? <Link className="block h-full transition hover:-translate-y-0.5" href={href}>{content}</Link> : content;
}

export function TerminalQuoteTable({ caption, rows, stateMessage }: Readonly<TerminalQuoteTableProps>) {
  if (stateMessage) return <TerminalStatePanel {...stateMessage} />;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Instrument</th>
            <th className="px-4 py-3">Quote</th>
            <th className="px-4 py-3">Comparison</th>
            <th className="px-4 py-3">Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-4 align-top">
                {row.href ? <Link className="font-black text-slate-950 underline decoration-emerald-300 underline-offset-4" href={row.href}>{row.label}</Link> : <span className="font-black text-slate-950">{row.label}</span>}
                <p className="mt-1 text-xs font-semibold text-slate-500">{row.sourceLabel}</p>
              </td>
              <td className="px-4 py-4 align-top text-lg font-black text-slate-950">{row.quote}</td>
              <td className="px-4 py-4 align-top font-semibold text-slate-700">{row.comparisonLabel}</td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-wrap gap-2">
                  <TerminalConfidenceBadge level={row.confidence} />
                  <TerminalFreshnessChip label={row.freshnessLabel} state="fresh" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TerminalDealVerdict({ boundary, evidenceLabel, ruleLabel, title, tone, verdict }: Readonly<TerminalDealVerdictProps>) {
  return (
    <TerminalSurfaceFrame>
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${verdictTone[tone]}`}>
        {verdict}
      </span>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{title}</h3>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-black text-slate-950">Rule</dt>
          <dd className="mt-1 font-semibold leading-6 text-slate-600">{ruleLabel}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-black text-slate-950">Evidence</dt>
          <dd className="mt-1 font-semibold leading-6 text-slate-600">{evidenceLabel}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">{boundary}</p>
    </TerminalSurfaceFrame>
  );
}

export function TerminalSourceCitations({ citations, title = 'Source citations' }: Readonly<TerminalSourceCitationsProps>) {
  return (
    <TerminalSurfaceFrame>
      <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {citations.map((citation) => (
          <a className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-400" href={citation.href} key={citation.id}>
            <p className="text-sm font-black text-slate-950">{citation.label}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{citation.sourceType}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{citation.coverageLabel}</p>
          </a>
        ))}
      </div>
    </TerminalSurfaceFrame>
  );
}

export function TerminalMarketSwitcher({ label, markets }: Readonly<TerminalMarketSwitcherProps>) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {markets.map((market) => {
        const blocked = market.state === 'blocked';
        const className = market.active
          ? 'border-slate-950 bg-slate-950 text-white'
          : blocked
            ? 'border-slate-200 bg-slate-50 text-slate-400'
            : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-800';

        return (
          <Link
            aria-disabled={blocked}
            className={`rounded-full border px-4 py-2 text-sm font-black ${className}`}
            href={blocked ? '#' : market.href}
            key={market.id}
            title={market.detail}
          >
            {market.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TerminalMethodologyLinks({ links, title = 'Methodology' }: Readonly<TerminalMethodologyLinksProps>) {
  return (
    <TerminalSurfaceFrame>
      <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {links.map((link) => (
          <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-400" href={link.href} key={link.href}>
            <p className="text-sm font-black text-slate-950">{link.label}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{link.detail}</p>
          </Link>
        ))}
      </div>
    </TerminalSurfaceFrame>
  );
}
