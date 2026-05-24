import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-500">© {new Date().getFullYear()} GroceryView</p>
        <nav aria-label="Legal pages" className="flex gap-4">
          <Link className="hover:text-zinc-900" href="/privacy">
            Integritet
          </Link>
          <Link className="hover:text-zinc-900" href="/terms">
            Användarvillkor
          </Link>
        </nav>
      </div>
    </footer>
  );
}
