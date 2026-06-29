"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/agendar", label: "Agendar" },
  { href: "/admin", label: "Painel" },
  { href: "/operador", label: "Check-in QR" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-bg) 92%, transparent)", backdropFilter: "blur(8px)" }}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span style={{ color: "var(--color-text-primary)" }}>Clean</span>{" "}
          <span style={{ color: "var(--color-accent)" }}>Car</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition"
                style={
                  active
                    ? { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-primary)" }
                    : { color: "var(--color-text-secondary)" }
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
