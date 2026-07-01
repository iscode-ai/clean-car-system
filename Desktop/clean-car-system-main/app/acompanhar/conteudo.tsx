"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { OrdemServico, STATUS_LABELS, STATUS_FLOW, StatusOS } from "@/types";

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

export default function AcompanharConteudo() {
  const params = useSearchParams();
  const osParam = params.get("os");

  const [busca, setBusca] = useState({ placa: "", telefone: "" });
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [selecionada, setSelecionada] = useState<OrdemServico | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (osParam) buscarPorOS(osParam);
  }, [osParam]);

  async function buscarPorOS(osId: string) {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch(`/api/agendamentos?osId=${encodeURIComponent(osId)}`);
      const data = await res.json();
      if (data.resultados?.length) {
        setOrdens(data.resultados);
        setSelecionada(data.resultados[0]);
      } else {
        setErro("OS não encontrada.");
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!busca.placa && !busca.telefone) return;
    setCarregando(true);
    setErro("");
    setSelecionada(null);

    const qs = new URLSearchParams();
    if (busca.placa) qs.set("placa", busca.placa);
    if (busca.telefone) qs.set("telefone", busca.telefone);

    try {
      const res = await fetch(`/api/agendamentos?${qs}`);
      const data = await res.json();
      if (!data.resultados?.length) {
        setErro("Nenhuma OS encontrada.");
        setOrdens([]);
      } else {
        setOrdens(data.resultados);
        setSelecionada(data.resultados[0]);
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }

  const idxStatus = selecionada ? STATUS_FLOW.indexOf(selecionada.status) : -1;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Acompanhar atendimento</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Consulte pelo número da placa ou telefone cadastrado.
        </p>
      </div>

      {!osParam && (
        <form onSubmit={buscar} className="card p-5 space-y-4">
          <label className="block">
            <span className="label">Placa</span>
            <input className="input mt-1.5 uppercase" placeholder="ABC1D23"
              value={busca.placa} onChange={(e) => setBusca({ ...busca, placa: e.target.value })} />
          </label>
          <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>ou</p>
          <label className="block">
            <span className="label">WhatsApp (com DDD)</span>
            <input className="input mt-1.5" placeholder="15996823970"
              value={busca.telefone} onChange={(e) => setBusca({ ...busca, telefone: e.target.value })} />
          </label>
          <button className="btn-primary w-full" disabled={carregando}>
            {carregando ? "Buscando..." : "Buscar"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{erro}</p>}

      {ordens.length > 1 && !selecionada && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selecione o agendamento:</p>
          {ordens.map((os) => (
            <button key={os.id} onClick={() => setSelecionada(os)}
              className="card w-full text-left p-4 transition hover:border-(--color-border-strong)">
              <span className="font-mono text-sm font-semibold">{os.id}</span>
              <span className="ml-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {os.dataAgendada} {os.horaAgendada} — {os.servicoNome}
              </span>
            </button>
          ))}
        </div>
      )}

      {selecionada && (
        <div className="space-y-6">
          {ordens.length > 1 && (
            <button onClick={() => setSelecionada(null)} className="text-sm" style={{ color: "var(--color-accent)" }}>
              ← Voltar
            </button>
          )}

          {/* Header */}
          <div className="card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold">{selecionada.id}</span>
              <span
                className="pill font-medium"
                style={
                  selecionada.status === "cancelado"
                    ? { backgroundColor: "#4a1f24", color: "#f0556b" }
                    : selecionada.status === "entregue"
                    ? { backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }
                    : { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-secondary)" }
                }
              >
                {STATUS_ICONS[selecionada.status]} {STATUS_LABELS[selecionada.status]}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>🚗 {selecionada.placa}{selecionada.veiculoModelo ? ` — ${selecionada.veiculoModelo}` : ""}</p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>🔧 {selecionada.servicoNome}</p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>📅 {selecionada.dataAgendada} às {selecionada.horaAgendada}</p>
            <p className="text-sm font-semibold">R$ {selecionada.servicoPreco.toFixed(2)}</p>
          </div>

          {/* QR Code — só mostra se ainda não fez check-in */}
          {["agendado", "confirmado"].includes(selecionada.status) && (
            <div className="card p-6 flex flex-col items-center gap-3">
              <p className="text-sm font-medium">Seu QR Code de entrada</p>
              <div className="p-3 rounded-lg bg-white">
                <QRCodeSVG value={selecionada.qrCode} size={180} />
              </div>
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                Apresente este QR Code na chegada para fazer o check-in
              </p>
            </div>
          )}

          {/* Progresso */}
          {selecionada.status !== "cancelado" && (
            <div>
              <p className="text-sm font-medium mb-3">Progresso</p>
              <div className="space-y-2">
                {STATUS_FLOW.map((s, idx) => {
                  const feito = idx <= idxStatus;
                  const atual = idx === idxStatus;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={
                          feito
                            ? atual
                              ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", boxShadow: "0 0 0 4px var(--color-accent-soft)" }
                              : { backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }
                            : { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-muted)" }
                        }
                      >
                        {feito && !atual ? "✓" : idx + 1}
                      </div>
                      <span
                        className="text-sm"
                        style={
                          feito
                            ? atual
                              ? { fontWeight: 600, color: "var(--color-accent)" }
                              : { color: "var(--color-text-primary)" }
                            : { color: "var(--color-text-muted)" }
                        }
                      >
                        {STATUS_ICONS[s]} {STATUS_LABELS[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fotos */}
          {selecionada.fotos?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Fotos do serviço</p>
              <div className="grid grid-cols-2 gap-2">
                {selecionada.fotos.map((foto, i) => (
                  <div key={i} className="relative">
                    <img src={foto.url} alt={`Foto ${foto.tipo}`} className="w-full h-32 object-cover rounded-lg" />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {foto.tipo === "antes" ? "Antes" : "Depois"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div>
            <p className="text-sm font-medium mb-2">Histórico</p>
            <div className="space-y-2">
              {[...selecionada.historico].reverse().map((h, i) => (
                <div key={i} className="text-sm border-l-2 pl-3" style={{ borderColor: "var(--color-border-strong)" }}>
                  <span className="font-medium">{STATUS_LABELS[h.status]}</span>
                  <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(h.alteradoEm).toLocaleString("pt-BR")}
                  </span>
                  {h.observacao && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{h.observacao}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
