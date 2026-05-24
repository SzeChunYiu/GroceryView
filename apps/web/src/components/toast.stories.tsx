import { Toast } from './toast';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered'
  }
};

export default meta;

export const Variants = {
  render: () => (
    <div className="grid w-[28rem] gap-4 bg-stone-100 p-6">
      <Toast variant="info" title="Price watch armed" message="We will keep checking your target price against fresh store evidence." autoDismiss={false} />
      <Toast variant="success" title="Basket saved" message="Your weekly basket is ready to compare across nearby stores." autoDismiss={false} />
      <Toast variant="warn" title="Stale price" message="One store quote is older than our freshness window." autoDismiss={false} />
      <Toast variant="error" title="Sync failed" message="We could not refresh loyalty offers. Try again in a moment." autoDismiss={false} />
    </div>
  )
};

export const AutoDismissWithAction = {
  render: () => (
    <div className="w-[28rem] bg-stone-100 p-6">
      <Toast
        variant="success"
        title="Deal alert sent"
        message="This toast closes itself after three seconds, but still exposes a manual close control."
        durationMs={3000}
        action={<button className="rounded-full bg-emerald-900 px-3 py-1 text-white">View watchlist</button>}
      />
    </div>
  )
};
