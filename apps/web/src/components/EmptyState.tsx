import Link from 'next/link';
import { Illustration } from '../../../packages/ui/src/Illustration';

export type EmptyStateSuggestion = {
  label: string;
  href: string;
  description?: string;
};

export function EmptyState({
  title,
  message,
  suggestions
}: Readonly<{
  title: string;
  message: string;
  suggestions: EmptyStateSuggestion[];
}>) {
  return (
    <section className="rounded-lg border border-market-ink/10 bg-white p-8 text-center">
      <div className="mx-auto max-w-md">
        <Illustration className="mx-auto h-40 w-40" />
        <h2 className="mt-6 text-2xl font-black">{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-market-ink/65">{message}</p>

        <ul className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.href + suggestion.label} className="rounded-md border border-market-ink/10 p-3">
              <Link
                href={suggestion.href}
                className="block text-sm font-bold text-market-mint transition hover:text-market-ink"
              >
                {suggestion.label}
              </Link>
              {suggestion.description ? (
                <p className="mt-1 text-xs leading-6 text-market-ink/55">{suggestion.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
