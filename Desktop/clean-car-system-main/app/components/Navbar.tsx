"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/agendar", label: "Agendar" },
  { href: "/acompanhar", label: "Acompanhar" },
  { href: "/admin", label: "Painel" },
  { href: "/operador", label: "Check-in QR" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, perfil, carregando, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  async function handleSair() {
    await sair();
    setMenuAberto(false);
    router.push("/");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-bg) 92%, transparent)", backdropFilter: "blur(8px)" }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight shrink-0">
          <span style={{ color: "var(--color-text-primary)" }}>Clean</span>{" "}
          <span style={{ color: "var(--color-accent)" }}>Car</span>
        </Link>

        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
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

        <div className="flex items-center gap-2 shrink-0">
          {carregando ? (
            <div className="w-24 h-9 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface-raised)" }} />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuAberto((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition"
                style={{ backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-primary)" }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }}
                >
                  {(perfil?.nome || user.email || "C").charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">{perfil?.nome || "Minha conta"}</span>
              </button>
              {menuAberto && (
                <div
                  className="absolute right-0 mt-2 w-48 card p-1.5 shadow-xl"
                  onMouseLeave={() => setMenuAberto(false)}
                >
                  <Link
                    href="/cliente"
                    onClick={() => setMenuAberto(false)}
                    className="block px-3 py-2 rounded-lg text-sm transition hover:bg-(--color-surface-raised)"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Área do cliente
                  </Link>
                  <Link
                    href="/cliente/conta"
                    onClick={() => setMenuAberto(false)}
                    className="block px-3 py-2 rounded-lg text-sm transition hover:bg-(--color-surface-raised)"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Meus dados
                  </Link>
                  <button
                    onClick={handleSair}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm transition hover:bg-(--color-surface-raised)"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/cliente/login" className="btn-primary px-4 py-2 text-sm">
              Área do cliente
            </Link>
          )}
        </div>
      </nav>

      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2.5 -mt-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
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
    </header>
  );
}
