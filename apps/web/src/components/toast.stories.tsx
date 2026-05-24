type ToastTone = 'info' | 'success' | 'warning' | 'error';

type ToastProps = {
  title?: string;
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  timestamp?: string;
};

const toneClasses: Record<ToastTone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  error: 'border-rose-200 bg-rose-50 text-rose-950'
};

function Toast({ title = 'GroceryView', message, tone = 'info', actionLabel, timestamp }: ToastProps) {
  return (
    <aside className={`w-80 rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`} role="status">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
        </div>
        {timestamp ? <time className="text-xs font-bold opacity-70">{timestamp}</time> : null}
      </div>
      {actionLabel ? (
        <button className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm" type="button">
          {actionLabel}
        </button>
      ) : null}
    </aside>
  );
}

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered'
  }
};

export default meta;

export const Default = {
  name: 'default',
  args: {
    message: 'Your shopping list was saved.',
    tone: 'success'
  }
};

export const WithData = {
  name: 'with-data',
  args: {
    title: 'Price alert',
    message: 'ICA Maxi dropped oat milk to 18,90 kr.',
    tone: 'info',
    actionLabel: 'View deal',
    timestamp: 'now'
  }
};

export const EdgeCase = {
  name: 'edge-case',
  args: {
    title: 'Sync delayed',
    message: 'We could not sync 12 offline edits yet. They stay queued until the connection is stable again.',
    tone: 'warning',
    actionLabel: 'Retry sync',
    timestamp: '2m ago'
  }
};
