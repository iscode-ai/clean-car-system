"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Servico } from "@/types";
import { useRouter } from "next/navigation";

export default function AgendarPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    clienteNome: "", clienteTelefone: "", placa: "", veiculoModelo: "",
    servicoId: "", dataAgendada: "", horaAgendada: "",
  });

  useEffect(() => {
    async function carregarServicos() {
      const snap = await getDocs(query(collection(db, "servicos"), where("ativo", "==", true)));
      setServicos(snap.docs.map((d) => d.data() as Servico));
    }
    carregarServicos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Novo Agendamento</h1>
      <p className="mb-8" style={{ color: "var(--color-text-secondary)" }}>
        Cadastro do cliente, veículo e serviço.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome do cliente">
            <input required className="input" placeholder="Nome do cliente" value={form.clienteNome}
              onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} />
          </Campo>
          <Campo label="WhatsApp com DDD">
            <input required placeholder="15996823970" className="input" value={form.clienteTelefone}
              onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })} />
          </Campo>
          <Campo label="Modelo do veículo">
            <input className="input" placeholder="Modelo do veículo" value={form.veiculoModelo}
              onChange={(e) => setForm({ ...form, veiculoModelo: e.target.value })} />
          </Campo>
          <Campo label="Placa">
            <input required placeholder="ABC1D23" className="input uppercase" value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value })} />
          </Campo>
          <Campo label="Serviço">
            <select required className="input" value={form.servicoId}
              onChange={(e) => setForm({ ...form, servicoId: e.target.value })}>
              <option value="">Selecione o serviço</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome} — R$ {s.preco.toFixed(2)}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Data">
            <input required type="date" className="input" value={form.dataAgendada}
              onChange={(e) => setForm({ ...form, dataAgendada: e.target.value })} />
          </Campo>
          <Campo label="Horário">
            <input required type="time" className="input" value={form.horaAgendada}
              onChange={(e) => setForm({ ...form, horaAgendada: e.target.value })} />
          </Campo>
        </div>
        {erro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{erro}</p>}
        <button disabled={enviando} className="btn-primary w-full sm:w-auto px-8 py-3 text-base">
          {enviando ? "Agendando..." : "Confirmar e gerar QR Code"}
        </button>
      </form>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div>{children}</div>
    </label>
  );
}
