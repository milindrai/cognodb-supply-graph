"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Graph Explorer" },
  { href: "/simulate", label: "Disruption Simulator" },
  { href: "/risk", label: "Single Points of Failure" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="flex flex-col gap-3 border-b border-edge py-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/20 text-brand">
          {/* chain-link glyph */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 12h6" />
            <path d="M9 12a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h1" />
            <path d="M15 12a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3" transform="rotate(180 15 12)" />
          </svg>
        </span>
        <span className="text-lg font-semibold tracking-tight">
          Chain<span className="text-brand">Lens</span>
        </span>
      </Link>
      <nav className="flex flex-wrap gap-1">
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                active ? "bg-panelalt text-ink" : "text-subtle hover:bg-panel hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
