import Link from "next/link";

const footerLinks = [
  { href: "/weekly-basket", label: "Weekly basket" },
  { href: "/budget", label: "Budget tracker" },
  { href: "/stores/stockholm", label: "Stores" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">GroceryView</p>
          <p className="mt-1 max-w-xl">
            Stockholm grocery price intelligence for ICA, Willys, Coop, Hemköp,
            and Lidl. Prices are placeholders until ingestion goes live.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
