import type { ReactNode } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  error?: string | null;
  hint?: string;
};

export function FormField({ id, label, children, error, hint }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-slate-700" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500" id={hintId}>{hint}</p> : null}
      {error ? (
        <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800" id={errorId} role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
