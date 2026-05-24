'use client';

type PriceAlertDialogProps = {
  error?: string;
};

export function PriceAlertDialog({ error }: PriceAlertDialogProps) {
  return error ? (
    <p aria-live="assertive" className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-950" role="alert">
      {error}
    </p>
  ) : null;
}
