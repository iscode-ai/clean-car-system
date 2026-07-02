"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { OrdemServico, STATUS_LABELS, StatusOS } from "@/types";

const STATUS_COLORS: Record<StatusOS, { bg: string; text: string }> = {
  agendado: { bg: "#1a2235", text: "#60a5fa" },
  confirmado: { bg: "#1a2a1a", text: "#4ade80" },
  checkin_realizado: { bg: "#1a2635", text: "#38bdf8" },
  em_atendimento: { bg: "#2a2010", text: "#fb923c" },
  finalizado: { bg: "#1a2a22", text: "#34d399" },
  aguardando_retirada: { bg: "#261a10", text: "#fbbf24" },
  entregue: { bg: "var(--color-accent-soft)", text: "var(--color-accent)" },
  cancelado: { bg: "#2a1010", text: "#f87171" },
};

const STATUS_ICONS: Record<StatusOS, string> = {
  agendado: "📅",
  confirmado: "✅",
  checkin_realizado: "📲",
  em_atendimento: "🔧",
  finalizado: "✨",
  aguardando_retirada: "🚗",
  entregue: "🎉",
  cancelado: "❌",
};

export default function ClienteArea() {
  const router = useRouter();
  const { user, perfil, carregando } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "ativo" | "concluido">("todos");

  const carregarOrdens = useCallback(async () => {
    if (!user) return;
    setLoadingOrdens(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/cliente/agendamentos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrdens(data.resultados || []);
      }
    } finally {
      setLoadingOrdens(false);
    }
  }, [user]);

  useEffect(() => {
    if (!carregando && !user) {
      router.replace("/cliente/login");
      return;
    }
    if (user) carregarOrdens();
  }, [user, carregando, router, carregarOrdens]);

  if (carregando) return <LoadingFull />;
  if (!user) return null;

  const ATIVOS: StatusOS[] = ["agendado", "confirmado", "checkin_realizado", "em_atendimento", "finalizado", "aguardando_retirada"];
  const ordensFiltradas =
    filtro === "ativo"
      ? ordens.filter((o) => ATIVOS.includes(o.status))
      : filtro === "concluido"
      ? ordens.filter((o) => o.status === "entregue" || o.status === "cancelado")
      : ordens;

  const ativas = ordens.filter((o) => ATIVOS.includes(o.status));
  const concluidas = ordens.filter((o) => o.status === "entregue");

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Saudação */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {perfil?.nome?.split(" ")[0] || "Cliente"} 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {perfil?.email || user.email}
          </p>
        </div>
        <Link href="/agendar" className="btn-primary">
          + Novo agendamento
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Em andamento", valor: ativas.length, cor: "var(--color-accent)" },
          { label: "Concluídos", valor: concluidas.length, cor: "#60a5fa" },
          { label: "Total", valor: ordens.length, cor: "var(--color-text-secondary)" },
        ].map((c) => (
          <div key={c.label} className="card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: c.cor }}>{c.valor}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(["todos", "ativo", "concluido"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition"
            style={
              filtro === f
                ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }
                : { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-secondary)" }
            }
          >
            {f === "todos" ? "Todos" : f === "ativo" ? "Em andamento" : "Concluídos"}
          </button>
        ))}
      </div>

      {/* Lista de OS */}
      {loadingOrdens ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : ordensFiltradas.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">Nenhum agendamento encontrado</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Que tal agendar seu próximo serviço?
          </p>
          <Link href="/agendar" className="btn-primary inline-flex mt-4">
            Agendar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ordensFiltradas.map((os) => (
            <Link
              key={os.id}
              href={`/acompanhar?os=${os.id}`}
              className="card p-4 flex items-center justify-between gap-4 transition hover:border-(--color-border-strong) block"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                    {os.id}
                  </span>
                  <span
                    className="pill text-xs"
                    style={{ backgroundColor: STATUS_COLORS[os.status].bg, color: STATUS_COLORS[os.status].text }}
                  >
                    {STATUS_ICONS[os.status]} {STATUS_LABELS[os.status]}
                  </span>
                </div>
                <p className="font-semibold mt-1 truncate">{os.servicoNome}</p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  🚗 {os.placa}{os.veiculoModelo ? ` — ${os.veiculoModelo}` : ""}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  📅 {formatarData(os.dataAgendada)} às {os.horaAgendada}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">R$ {os.servicoPreco.toFixed(2)}</p>
                <span className="text-xs" style={{ color: "var(--color-accent)" }}>Ver detalhes →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function LoadingFull() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="h-10 w-48 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface-raised)" }} />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
      </div>
    </main>
  );
}
