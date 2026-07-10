"use client";

import { StatusOS, STATUS_LABELS } from "@/types";

const FLUXO_NORMAL: StatusOS[] = [
  "agendado",
  "confirmado",
  "checkin_realizado",
  "em_atendimento",
  "finalizado",
  "entregue",
];

const ICONES: Record<StatusOS, string> = {
  agendado: "📅",
  confirmado: "✅",
  checkin_realizado: "📲",
  em_atendimento: "🔧",
  finalizado: "✨",
  aguardando_retirada: "🚗",
  entregue: "🎉",
  cancelado: "❌",
};

export default function StatusStepper({ status }: { status: StatusOS }) {
  if (status === "cancelado") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "#2a1010", color: "#f87171" }}>
        <span className="text-lg">❌</span>
        <span className="font-medium text-sm">Agendamento cancelado</span>
      </div>
    );
  }

  // aguardando_retirada substitui a posição de "finalizado" visualmente quando presente
  const passos = status === "aguardando_retirada"
    ? ["agendado", "confirmado", "checkin_realizado", "em_atendimento", "aguardando_retirada", "entregue"] as StatusOS[]
    : FLUXO_NORMAL;

  const indiceAtual = passos.indexOf(status);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center min-w-max">
        {passos.map((passo, i) => {
          const concluido = i < indiceAtual;
          const atual = i === indiceAtual;
          const pendente = i > indiceAtual;

          return (
            <div key={passo} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5" style={{ width: 84 }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 transition-all"
                  style={
                    atual
                      ? {
                          backgroundColor: "var(--color-accent)",
                          color: "var(--color-accent-text)",
                          boxShadow: "0 0 0 4px var(--color-accent-soft)",
                        }
                      : concluido
                      ? { backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }
                      : { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-muted)" }
                  }
                >
                  {concluido ? "✓" : ICONES[passo]}
                </div>
                <span
                  className="text-[10px] text-center leading-tight font-medium"
                  style={{
                    color: atual
                      ? "var(--color-accent)"
                      : concluido
                      ? "var(--color-text-secondary)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {STATUS_LABELS[passo]}
                </span>
              </div>
              {i < passos.length - 1 && (
                <div
                  className="h-0.5 shrink-0 transition-all"
                  style={{
                    width: 28,
                    marginBottom: 18,
                    backgroundColor: concluido || (atual && i < indiceAtual)
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
