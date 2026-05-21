import Link from "next/link";
import { Bell, Home, ScanLine, ShieldCheck, ShoppingBasket, Users } from "lucide-react";

const navItems = [
  { href: "/", label: "Market", icon: Home },
  { href: "/weekly-basket", label: "Basket", icon: ShoppingBasket },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/watchlist", label: "Watchlist", icon: Bell },
  { href: "/household", label: "Household", icon: Users },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck },
  { href: "/account", label: "Alerts", icon: Bell },
];

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link className="text-base font-semibold tracking-tight text-zinc-950" href="/">
          GroceryView
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <Link className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white" href="/login">
          Sign in
        </Link>
      </nav>
    </header>
  );
}
