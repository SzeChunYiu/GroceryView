import type { ReactNode } from 'react';

type ModalAction = {
  label: string;
  tone: 'primary' | 'secondary' | 'danger';
};

type ModalDataRow = {
  label: string;
  value: string;
};

type ModalProps = {
  open: boolean;
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  actions?: ModalAction[];
  dataRows?: ModalDataRow[];
};

function actionClass(tone: ModalAction['tone']) {
  if (tone === 'primary') return 'bg-emerald-700 text-white';
  if (tone === 'danger') return 'bg-rose-100 text-rose-900';
  return 'border border-slate-300 bg-white text-slate-800';
}

function Modal({
  open,
  eyebrow = 'Modal',
  title,
  description,
  children,
  actions = [],
  dataRows = []
}: Readonly<ModalProps>) {
  if (!open) return null;

  return (
    <div className="min-h-[32rem] rounded-[2rem] bg-slate-100 p-6">
      <div className="fixed inset-0 z-10 bg-slate-950/45" />
      <section
        aria-modal="true"
        className="relative z-20 mx-auto mt-10 w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{description}</p>
        {dataRows.length > 0 ? (
          <dl className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3">
            {dataRows.map((row) => (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2" key={row.label}>
                <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{row.label}</dt>
                <dd className="text-sm font-black text-slate-950">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children ? <div className="mt-4 text-sm leading-6 text-slate-600">{children}</div> : null}
        {actions.length > 0 ? (
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {actions.map((action) => (
              <button className={`rounded-full px-4 py-2 text-sm font-black ${actionClass(action.tone)}`} key={action.label} type="button">
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

const meta = {
  title: 'Components/Modal',
  component: Modal,
  args: {
    open: true
  }
};

export default meta;

type Story = {
  args: ModalProps;
  name?: string;
};

export const Default: Story = {
  name: 'default',
  args: {
    open: true,
    eyebrow: 'Confirm action',
    title: 'Save this grocery list?',
    description: 'The modal asks shoppers to confirm a reversible UI action before saving list changes.',
    actions: [
      { label: 'Cancel', tone: 'secondary' },
      { label: 'Save list', tone: 'primary' }
    ]
  }
};

export const WithData: Story = {
  name: 'with-data',
  args: {
    open: true,
    eyebrow: 'Verified price alert',
    title: 'Price alert ready',
    description: 'Shows a compact evidence summary inside the modal without fabricating prices or retailer claims.',
    dataRows: [
      { label: 'Product', value: 'Bananas' },
      { label: 'Source', value: 'OpenPrices' },
      { label: 'Freshness', value: 'Observed this week' }
    ],
    actions: [
      { label: 'Review source', tone: 'secondary' },
      { label: 'Create alert', tone: 'primary' }
    ]
  }
};

export const EdgeCase: Story = {
  name: 'edge-case',
  args: {
    open: true,
    eyebrow: 'Missing evidence',
    title: 'Cannot complete this action yet',
    description: 'The modal remains useful when required verified data is missing, and it gives shoppers a safe fallback.',
    children: (
      <p className="rounded-2xl bg-amber-50 p-3 font-bold text-amber-950">
        No synthetic price rows are shown. Ask the shopper to pick a verified product or return to source coverage.
      </p>
    ),
    actions: [
      { label: 'Go back', tone: 'secondary' },
      { label: 'Discard draft', tone: 'danger' }
    ]
  }
};
