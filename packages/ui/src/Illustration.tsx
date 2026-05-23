export type IllustrationProps = {
  className?: string;
};

export function Illustration({ className = 'h-40 w-40' }: Readonly<IllustrationProps>) {
  return (
    <div className={`text-market-ink/70 ${className}`} role="img" aria-label="Illustration for empty state">
      <svg viewBox="0 0 200 170" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <rect x="20" y="30" width="160" height="110" rx="12" fill="#f2ebd9" />
        <rect x="34" y="44" width="132" height="82" rx="8" stroke="#101617" strokeWidth="2" fill="#fff7ea" />
        <circle cx="56" cy="74" r="7" fill="#18a77b" />
        <circle cx="82" cy="74" r="7" fill="#d94f3d" />
        <circle cx="108" cy="74" r="7" fill="#18a77b" />
        <circle cx="56" cy="101" r="7" fill="#d94f3d" />
        <circle cx="82" cy="101" r="7" fill="#18a77b" />
        <circle cx="108" cy="101" r="7" fill="#d94f3d" />
        <path d="M132 101L150 119L143 128" stroke="#18a77b" strokeWidth="6" strokeLinecap="round" />
        <path d="M134 120C140 111 151 108 158 108C165 108 172 114 174 121" stroke="#d94f3d" strokeWidth="5" strokeLinecap="round" />
        <path d="M58 38L74 22" stroke="#101617" strokeWidth="3" strokeLinecap="round" />
        <path d="M82 38L96 20" stroke="#101617" strokeWidth="3" strokeLinecap="round" />
        <path d="M142 132L116 158" stroke="#101617" strokeWidth="4" strokeLinecap="round" />
        <path d="M98 158L74 132" stroke="#101617" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
