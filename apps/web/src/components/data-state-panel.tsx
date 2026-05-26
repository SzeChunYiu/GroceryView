import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, Ban, Clock3, Loader2, LockKeyhole, MapPinned } from 'lucide-react';

export type DataStateKind =
  | 'no-coverage'
  | 'partial-coverage'
  | 'stale-source'
  | 'connector-failure'
  | 'loading'
  | 'blocked-permissions';

export type DataStateAction = {
  href: string;
  label: string;
};

export const dataStateActions = {
  changeMarket: { href: '/data-sources', label: 'Change market' },
  chooseAnotherChain: { href: '/compare', label: 'Choose another chain' },
  requestAlert: { href: '/alerts', label: 'Request alert' },
  methodology: { href: '/index-methodology', label: 'See methodology' }
} as const satisfies Record<string, DataStateAction>;

const dataStateCopy = {
  'no-coverage': {
    icon: MapPinned,
    eyebrow: 'No coverage',
    title: 'No verified rows for this market yet',
    detail: 'This view is blocked until a real source contributes rows for the selected market.',
    tone: 'border-slate-300 bg-white text-slate-950',
    actions: [dataStateActions.changeMarket, dataStateActions.methodology]
  },
  'partial-coverage': {
    icon: AlertTriangle,
    eyebrow: 'Partial coverage',
    title: 'Only part of this comparison is covered',
    detail: 'Matched products, chains, or stores are missing, so unavailable rows stay visibly incomplete.',
    tone: 'border-amber-300 bg-amber-50 text-amber-950',
    actions: [dataStateActions.chooseAnotherChain, dataStateActions.requestAlert]
  },
  'stale-source': {
    icon: Clock3,
    eyebrow: 'Stale source',
    title: 'Source freshness is outside the expected window',
    detail: 'The last observed rows remain visible with freshness labels until a newer source run lands.',
    tone: 'border-orange-300 bg-orange-50 text-orange-950',
    actions: [dataStateActions.requestAlert, dataStateActions.methodology]
  },
  'connector-failure': {
    icon: Ban,
    eyebrow: 'Connector failure',
    title: 'Latest connector run did not finish',
    detail: 'The UI keeps prior verified rows separate from the failed run instead of filling gaps.',
    tone: 'border-rose-300 bg-rose-50 text-rose-950',
    actions: [dataStateActions.requestAlert, dataStateActions.methodology]
  },
  loading: {
    icon: Loader2,
    eyebrow: 'Loading',
    title: 'Checking live coverage',
    detail: 'Skeleton rows reserve the layout while prices, confidence, and freshness are fetched.',
    tone: 'border-slate-200 bg-slate-50 text-slate-900',
    actions: []
  },
  'blocked-permissions': {
    icon: LockKeyhole,
    eyebrow: 'Blocked permissions',
    title: 'Sign-in or permissions are required',
    detail: 'Private lists, alerts, and household data stay hidden until the session grants access.',
    tone: 'border-blue-300 bg-blue-50 text-blue-950',
    actions: [dataStateActions.methodology]
  }
} as const;

export const dataStateKinds = Object.keys(dataStateCopy) as DataStateKind[];

export function DataStatePanel({
  actions,
  children,
  confidenceLabel,
  detail,
  freshnessLabel,
  kind,
  sourceLabel,
  title
}: Readonly<{
  actions?: readonly DataStateAction[];
  children?: ReactNode;
  confidenceLabel?: string;
  detail?: string;
  freshnessLabel?: string;
  kind: DataStateKind;
  sourceLabel?: string;
  title?: string;
}>) {
  const state = dataStateCopy[kind];
  const Icon = state.icon;
  const panelActions = actions ?? state.actions;

  return (
    <section aria-busy={kind === 'loading'} className={`rounded-lg border p-4 ${state.tone}`} data-ui-state={kind}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/75">
          <Icon className={`h-5 w-5 ${kind === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-75">{state.eyebrow}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">{title ?? state.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 opacity-85">{detail ?? state.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            {sourceLabel ? <span className="rounded-full bg-white/70 px-3 py-1">Source: {sourceLabel}</span> : null}
            {confidenceLabel ? <span className="rounded-full bg-white/70 px-3 py-1">Confidence: {confidenceLabel}</span> : null}
            {freshnessLabel ? <span className="rounded-full bg-white/70 px-3 py-1">Freshness: {freshnessLabel}</span> : null}
          </div>
          {children ? <div className="mt-3 text-sm font-semibold leading-6">{children}</div> : null}
          {panelActions.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {panelActions.map((action) => (
                <Link className="rounded-lg bg-white px-3 py-2 text-sm font-black shadow-sm hover:bg-slate-50" href={action.href} key={`${kind}-${action.href}`}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-2" aria-hidden="true">
              <span className="h-3 rounded-full bg-white/80" />
              <span className="h-3 w-2/3 rounded-full bg-white/70" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
