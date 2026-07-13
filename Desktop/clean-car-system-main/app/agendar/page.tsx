"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Servico } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

export default function AgendarPage() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    clienteNome: "", clienteTelefone: "", placa: "", veiculoModelo: "",
    servicoId: "", dataAgendada: "", horaAgendada: "",
  });

  // Horários disponíveis (8h–18h, de hora em hora)
  const HORARIOS = Array.from({ length: 11 }, (_, i) => {
    const h = i + 8;
    return `${String(h).padStart(2, "0")}:00`;
  });

  // Preenche com dados do cliente logado
  useEffect(() => {
    if (perfil) {
      setForm((f) => ({
        ...f,
        clienteNome: f.clienteNome || perfil.nome || "",
        clienteTelefone: f.clienteTelefone || (perfil.telefone?.replace(/^55/, "") || ""),
      }));
    }
  }, [perfil]);

  useEffect(() => {
    async function carregarServicos() {
      const snap = await getDocs(query(collection(db, "servicos"), where("ativo", "==", true)));
      setServicos(snap.docs.map((d) => d.data() as Servico));
    }
    carregarServicos();
  }, []);

  const servicoSelecionado = servicos.find((s) => s.id === form.servicoId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro || "Erro ao agendar."); setEnviando(false); return; }
      router.push(`/acompanhar?os=${data.osId}`);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setEnviando(false);
    }
  }

  // Data mínima = hoje
  const hoje = new Date().toISOString().split("T")[0];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <PageHeader
        icon="📅"
        title="Novo Agendamento"
        subtitle="Escolha o serviço, data, horário e nos informe seus dados."
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção: Serviço */}
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Serviço
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {servicos.length === 0 && (
              <div className="col-span-2 card p-4 animate-pulse h-16" />
            )}
            {servicos.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setForm({ ...form, servicoId: s.id })}
                className="card p-4 text-left transition"
                style={
                  form.servicoId === s.id
                    ? { borderColor: "var(--color-accent)", backgroundColor: "var(--color-accent-soft)" }
                    : {}
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{s.nome}</span>
                  <span className="font-bold text-sm shrink-0" style={{ color: "var(--color-accent)" }}>
                    R$ {s.preco.toFixed(2)}
                  </span>
                </div>
                {s.descricao && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{s.descricao}</p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  ⏱ {s.duracaoMin} min
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Seção: Data e Horário */}
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Data e Horário
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Data">
              <input required type="date" min={hoje} className="input mt-1.5"
                value={form.dataAgendada} onChange={(e) => setForm({ ...form, dataAgendada: e.target.value })} />
            </Campo>
            <Campo label="Horário">
              <select required className="input mt-1.5"
                value={form.horaAgendada} onChange={(e) => setForm({ ...form, horaAgendada: e.target.value })}>
                <option value="">Selecione o horário</option>
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </Campo>
          </div>
        </section>

        {/* Seção: Dados pessoais */}
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Seus dados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Nome completo">
              <input required className="input mt-1.5" placeholder="Seu nome"
                value={form.clienteNome} onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} />
            </Campo>
            <Campo label="WhatsApp com DDD">
              <input required className="input mt-1.5" placeholder="15996823970"
                value={form.clienteTelefone} onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })} />
            </Campo>
            <Campo label="Modelo do veículo">
              <input className="input mt-1.5" placeholder="Ex: Corolla 2022"
                value={form.veiculoModelo} onChange={(e) => setForm({ ...form, veiculoModelo: e.target.value })} />
            </Campo>
            <Campo label="Placa">
              <input required className="input mt-1.5 uppercase" placeholder="ABC1D23"
                value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
            </Campo>
          </div>
        </section>

        {/* Resumo */}
        {servicoSelecionado && form.dataAgendada && form.horaAgendada && (
          <div className="card p-4 border-(--color-accent)" style={{ borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Resumo do agendamento</p>
            <div className="space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <p>🔧 {servicoSelecionado.nome}</p>
              <p>📅 {formatarData(form.dataAgendada)} às {form.horaAgendada}</p>
              {form.placa && <p>🚗 {form.placa.toUpperCase()}{form.veiculoModelo ? ` — ${form.veiculoModelo}` : ""}</p>}
              <p className="font-bold text-base mt-2" style={{ color: "var(--color-text-primary)" }}>
                Total: R$ {servicoSelecionado.preco.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {erro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{erro}</p>}

        <button
          disabled={enviando || !form.servicoId}
          className="btn-primary w-full sm:w-auto px-8 py-3 text-base"
        >
          {enviando ? "Agendando..." : "Confirmar e gerar QR Code"}
        </button>
      </form>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
