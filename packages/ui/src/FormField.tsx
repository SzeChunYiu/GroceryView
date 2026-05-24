import { type ReactNode } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ id, label, error, children }: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <label className="grid gap-2 text-sm font-semibold" htmlFor={id}>
      <span>{label}</span>
      {children}
      {error ? (
        <span aria-live="assertive" className="text-sm font-bold text-rose-700" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
