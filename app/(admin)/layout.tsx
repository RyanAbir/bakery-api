import Link from "next/link";
import type { ReactNode } from "react";
import AuthGuard from "./AuthGuard";

const navItems = [
  { href: "/items", label: "Items" },
  { href: "/stock", label: "Stock" },
  { href: "/accounts", label: "Accounts" },
  { href: "/ledger", label: "Ledger" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <nav className="flex items-center gap-6 text-sm font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-zinc-700 hover:text-zinc-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
              >
                Logout
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}