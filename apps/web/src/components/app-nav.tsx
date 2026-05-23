import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Clock,
  Database,
  MapPin,
  ReceiptText,
  ScanSearch,
  ShieldCheck,
  ShoppingBasket,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavGroup = {
  icon: LucideIcon;
  items: NavItem[];
  label: string;
};

const navGroups: NavGroup[] = [
  {
    label: "Markets",
    icon: BarChart3,
    items: [
      { href: "/", label: "Overview", icon: BarChart3 },
      { href: "/?view=chain-index", label: "Chain index", icon: Database },
      { href: "/categories", label: "Categories", icon: ReceiptText },
      { href: "/?view=heatmap", label: "Heatmap", icon: MapPin },
      { href: "/?view=screener", label: "Screener", icon: ScanSearch },
    ],
  },
  {
    label: "Products",
    icon: ShoppingBasket,
    items: [
      { href: "/products", label: "Browse", icon: ShoppingBasket },
      { href: "/products?view=compare", label: "Compare", icon: BarChart3 },
    ],
  },
  {
    label: "Stores",
    icon: MapPin,
    items: [
      { href: "/stores?view=map", label: "Map", icon: MapPin },
      { href: "/stores", label: "Stores", icon: Database },
    ],
  },
  {
    label: "Personal",
    icon: Users,
    items: [
      { href: "/account?view=savings", label: "Savings", icon: Bell },
      { href: "/account?view=watchlist", label: "Watchlist", icon: ShieldCheck },
      { href: "/weekly-basket", label: "Weekly basket", icon: ShoppingBasket },
      { href: "/household?view=meal-planner", label: "Meal planner", icon: Clock },
    ],
  },
];

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link className="text-base font-semibold tracking-tight text-zinc-950" href="/">
          GroceryView
        </Link>
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex">
          {navGroups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <div className="group relative" key={group.label}>
                <button
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:bg-zinc-100 focus:text-zinc-950 focus:outline-none"
                  type="button"
                >
                  <GroupIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{group.label}</span>
                </button>
                <div className="invisible absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-zinc-200 bg-white p-1.5 opacity-0 shadow-lg shadow-zinc-900/10 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus:bg-zinc-100 focus:text-zinc-950 focus:outline-none"
                        href={item.href}
                        key={item.href}
                      >
                        <Icon className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
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
