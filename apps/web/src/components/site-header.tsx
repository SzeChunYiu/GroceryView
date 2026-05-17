import Link from "next/link";

const navigationItems = [
  { href: "/", label: "Market" },
  { href: "/weekly-basket", label: "Weekly basket" },
  { href: "/budget", label: "Budget" },
  { href: "/stores/stockholm", label: "Stores" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6">
        <Link className="flex items-center gap-3" href="/" aria-label="GroceryView home">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white shadow-sm">
            GV
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              GroceryView
            </span>
            <span className="hidden text-xs text-zinc-500 sm:block">
              Stockholm price terminal
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <Link
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          href="/products/milk"
        >
          Open terminal
        </Link>
      </div>
    </header>
  );
}
