import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  ClipboardList,
  Home,
  LayoutGrid,
  LineChart,
  Map,
  PiggyBank,
  ScanLine,
  Search,
  ShoppingBag,
  ShoppingBasket,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  href: string;
  label: string;
  icon: LucideIcon;
  items: NavEntry[];
};

const navGroups: NavGroup[] = [
  {
    href: "/",
    label: "Markets",
    icon: BarChart3,
    items: [
      { href: "/", label: "Overview", icon: Home },
      { href: "/market/chains", label: "Chain index", icon: LineChart },
      { href: "/categories", label: "Categories", icon: LayoutGrid },
      { href: "/market/heatmap", label: "Heatmap", icon: Search },
      { href: "/screener", label: "Screener", icon: ScanLine },
    ],
  },
  {
    href: "/products",
    label: "Products",
    icon: ShoppingBag,
    items: [
      { href: "/products", label: "Browse", icon: ShoppingBasket },
      { href: "/products/compare", label: "Compare", icon: LineChart },
    ],
  },
  {
    href: "/stores",
    label: "Stores",
    icon: Store,
    items: [
      { href: "/stores/map", label: "Map", icon: Map },
      { href: "/stores", label: "Stores", icon: Store },
    ],
  },
  {
    href: "/household",
    label: "Personal",
    icon: UserRound,
    items: [
      { href: "/household", label: "Savings", icon: PiggyBank },
      { href: "/watchlist", label: "Watchlist", icon: Bookmark },
      { href: "/weekly-basket", label: "Weekly basket", icon: ShoppingBasket },
      { href: "/meal-planner", label: "Meal planner", icon: ClipboardList },
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

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.label} className="group relative">
                <Link
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                  href={group.href}
                >
                  <GroupIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{group.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:rotate-180" />
                </Link>

                <div className="absolute right-0 z-10 mt-2 hidden min-w-[190px] rounded-xl border border-zinc-200 bg-white p-1 opacity-0 shadow-lg transition group-hover:block group-hover:opacity-100">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        className="inline-flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                        href={item.href}
                        key={item.href}
                      >
                        <ItemIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <Link
          className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"
          href="/login"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
