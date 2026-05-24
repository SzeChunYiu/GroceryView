import type { ReactNode } from 'react';

type FormFieldProps = {
  children: ReactNode;
  error?: string | null;
  hint?: string;
  id: string;
  label: string;
};

export function FormField({ children, error, hint, id, label }: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={id}>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-semibold text-slate-500" id={hintId}>{hint}</span> : null}
      {error ? (
        <span aria-live="assertive" className="text-sm font-black text-rose-700" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
