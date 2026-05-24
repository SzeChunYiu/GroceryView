import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

const footerLinks = [
  { href: "/privacy", label: "Privacy policy", icon: ShieldCheck },
  { href: "/terms", label: "Terms of service", icon: FileText },
];

export function Footer() {
  return (
    <footer className="mt-14 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm">
        <p className="text-zinc-500">© 2026 GroceryView</p>
        <nav className="flex flex-wrap gap-4">
          {footerLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                href={link.href}
                key={link.href}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
