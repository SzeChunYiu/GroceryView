import Link from 'next/link';

export type ChainSelectorOption = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  selected?: boolean;
};

type ChainSelectorProps = {
  label: string;
  description?: string;
  options: ChainSelectorOption[];
  className?: string;
};

function toId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'chain-selector';
}

export function ChainSelector({ label, description, options, className = '' }: ChainSelectorProps) {
  const selectorId = toId(label);
  const descriptionId = description ? `${selectorId}-description` : undefined;

  return (
    <section className={className} aria-labelledby={`${selectorId}-label`} aria-describedby={descriptionId}>
      <p id={`${selectorId}-label`} className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{label}</p>
      {description ? <p id={descriptionId} className="mt-1 text-xs font-semibold leading-5 text-slate-600">{description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label={label} aria-multiselectable="true">
        {options.map((option) => {
          const content = (
            <>
              <span aria-hidden="true" className={option.selected ? 'text-emerald-700' : 'text-slate-400'}>✓</span>
              <span>{option.label}</span>
              {option.description ? <span className="sr-only"> {option.description}</span> : null}
            </>
          );
          const classes = option.selected
            ? 'rounded-full border border-emerald-700 bg-emerald-900 px-4 py-2 text-sm font-black text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2'
            : 'rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2';

          return option.href ? (
            <Link
              aria-selected={option.selected ? 'true' : 'false'}
              className={`${classes} inline-flex items-center gap-2`}
              href={option.href}
              key={option.id}
              role="option"
            >
              {content}
            </Link>
          ) : (
            <span
              aria-selected={option.selected ? 'true' : 'false'}
              className={`${classes} inline-flex items-center gap-2`}
              key={option.id}
              role="option"
              tabIndex={0}
            >
              {content}
            </span>
          );
        })}
      </div>
    </section>
  );
}
