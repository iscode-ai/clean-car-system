// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { OrdemServico, Servico, UsuarioSistema, STATUS_LABELS, StatusOS } from "@/types";

type Aba = "dashboard" | "agenda" | "servicos" | "usuarios";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");
  const [aba, setAba] = useState<Aba>("dashboard");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <main className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoginErro("");
            try {
              await signInWithEmailAndPassword(auth, loginForm.email, loginForm.senha);
            } catch {
              setLoginErro("E-mail ou senha inválidos.");
            }
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="label">E-mail</span>
            <input type="email" required className="input mt-1.5" value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Senha</span>
            <input type="password" required className="input mt-1.5" value={loginForm.senha}
              onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })} />
          </label>
          {loginErro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{loginErro}</p>}
          <button className="btn-primary w-full">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <div>
      {/* Sub-navbar de abas */}
      <div className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["dashboard", "agenda", "servicos", "usuarios"] as Aba[]).map((a) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className="px-3.5 py-3 text-sm font-medium transition border-b-2"
                style={
                  aba === a
                    ? { color: "var(--color-text-primary)", borderColor: "var(--color-accent)" }
                    : { color: "var(--color-text-muted)", borderColor: "transparent" }
                }
              >
                {{ dashboard: "Dashboard", agenda: "Agenda", servicos: "Serviços", usuarios: "Usuários" }[a]}
              </button>
            ))}
          </div>
          <button onClick={() => signOut(auth)} className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sair
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {aba === "dashboard" && <Dashboard user={user} />}
        {aba === "agenda" && <Agenda user={user} />}
        {aba === "servicos" && <Servicos user={user} />}
        {aba === "usuarios" && <Usuarios user={user} />}
      </main>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard({ user }: { user: User }) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const hoje = new Date().toISOString().slice(0, 10);
      const snap = await getDocs(
        query(collection(db, "ordens_servico"), where("dataAgendada", "==", hoje))
      );
      setOrdens(snap.docs.map((d) => d.data() as OrdemServico));
      setCarregando(false);
    }
    carregar();
  }, []);

  const total = ordens.length;
  const emAndamento = ordens.filter((o) =>
    ["checkin_realizado", "em_atendimento"].includes(o.status)
  ).length;
  const finalizados = ordens.filter((o) =>
    ["finalizado", "aguardando_retirada", "entregue"].includes(o.status)
  ).length;
  const faturamento = ordens
    .filter((o) => o.status !== "cancelado")
    .reduce((acc, o) => acc + o.servicoPreco, 0);

  if (carregando) return <p className="text-sm mt-8" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Controle dos agendamentos, status e WhatsApp automático.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agendamentos", valor: total },
          { label: "Em andamento", valor: emAndamento },
          { label: "Finalizados", valor: finalizados },
          { label: "Faturamento", valor: `R$ ${faturamento.toFixed(2)}` },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>{k.valor}</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface-raised)" }}>
              {["OS", "Cliente", "Placa", "Serviço", "Horário", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordens.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>Nenhum agendamento hoje</td></tr>
            )}
            {ordens.map((os, i) => (
              <tr key={os.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                <td className="px-4 py-3 font-mono text-xs">{os.id}</td>
                <td className="px-4 py-3">{os.clienteNome}</td>
                <td className="px-4 py-3 font-mono">{os.placa}</td>
                <td className="px-4 py-3">{os.servicoNome}</td>
                <td className="px-4 py-3">{os.horaAgendada}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={os.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AGENDA ──────────────────────────────────────────────────────────────────

function Agenda({ user }: { user: User }) {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => { carregar(); }, [data]);

  async function carregar() {
    setCarregando(true);
    const snap = await getDocs(
      query(collection(db, "ordens_servico"), where("dataAgendada", "==", data), orderBy("horaAgendada"))
    );
    setOrdens(snap.docs.map((d) => d.data() as OrdemServico));
    setCarregando(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">Agenda</h2>
        <input type="date" className="input text-sm w-auto" value={data}
          onChange={(e) => setData(e.target.value)} />
      </div>

      {carregando ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
      ) : ordens.length === 0 ? (
        <p className="text-sm mt-8 text-center" style={{ color: "var(--color-text-muted)" }}>Nenhum agendamento nesta data.</p>
      ) : (
        <div className="space-y-2">
          {ordens.map((os) => (
            <div key={os.id} className="card p-4 flex items-center gap-4">
              <div className="text-center w-14 shrink-0">
                <p className="text-lg font-bold" style={{ color: "var(--color-accent)" }}>{os.horaAgendada}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{os.clienteNome}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{os.placa}{os.veiculoModelo ? ` — ${os.veiculoModelo}` : ""}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{os.servicoNome} · R$ {os.servicoPreco.toFixed(2)}</p>
              </div>
              <StatusBadge status={os.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SERVIÇOS ────────────────────────────────────────────────────────────────

function Servicos({ user }: { user: User }) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState({ nome: "", descricao: "", preco: "", duracaoMin: "" });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const token = await user.getIdToken();
    const res = await fetch("/api/servicos?todos=1", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setServicos(data.servicos ?? []);
  }

  function iniciarEdicao(s: Servico) {
    setEditandoId(s.id);
    setForm({
      nome: s.nome,
      descricao: s.descricao || "",
      preco: String(s.preco),
      duracaoMin: String(s.duracaoMin),
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({ nome: "", descricao: "", preco: "", duracaoMin: "" });
    setErro("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    const token = await user.getIdToken();

    if (editandoId) {
      const res = await fetch("/api/servicos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: editandoId,
          nome: form.nome,
          descricao: form.descricao,
          preco: parseFloat(form.preco),
          duracaoMin: parseInt(form.duracaoMin),
        }),
      });
      if (res.ok) {
        cancelarEdicao();
        await carregar();
      } else {
        const d = await res.json();
        setErro(d.erro || "Erro ao salvar.");
      }
    } else {
      const res = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao,
          preco: parseFloat(form.preco),
          duracaoMin: parseInt(form.duracaoMin),
        }),
      });
      if (res.ok) {
        setForm({ nome: "", descricao: "", preco: "", duracaoMin: "" });
        await carregar();
      } else {
        const d = await res.json();
        setErro(d.erro || "Erro ao salvar.");
      }
    }
    setSalvando(false);
  }

  async function toggleAtivo(s: Servico) {
    const token = await user.getIdToken();
    await fetch("/api/servicos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: s.id, ativo: !s.ativo }),
    });
    await carregar();
  }

  async function excluir(s: Servico) {
    if (!confirm(`Excluir o serviço "${s.nome}"? Essa ação não pode ser desfeita.`)) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/servicos?id=${s.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await carregar();
    } else {
      const d = await res.json();
      alert(d.erro || "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Serviços</h2>

      <form onSubmit={salvar} className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{editandoId ? "Editar serviço" : "Novo serviço"}</p>
          {editandoId && (
            <button type="button" onClick={cancelarEdicao} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Cancelar edição
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 block">
            <span className="label text-xs">Nome</span>
            <input required className="input mt-1.5 text-sm" value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </label>
          <label className="block">
            <span className="label text-xs">Preço (R$)</span>
            <input required type="number" step="0.01" min="0" className="input mt-1.5 text-sm"
              value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
          </label>
          <label className="block">
            <span className="label text-xs">Duração (min)</span>
            <input required type="number" min="1" className="input mt-1.5 text-sm"
              value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: e.target.value })} />
          </label>
          <label className="col-span-2 block">
            <span className="label text-xs">Descrição (opcional)</span>
            <input className="input mt-1.5 text-sm" value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </label>
        </div>
        {erro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{erro}</p>}
        <button disabled={salvando} className="btn-primary text-sm px-4 py-2.5">
          {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Adicionar serviço"}
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface-raised)" }}>
              {["Nome", "Preço", "Duração", "Ativo", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-left" style={{ color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servicos.map((s, i) => (
              <tr key={s.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.nome}</p>
                  {s.descricao && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.descricao}</p>}
                </td>
                <td className="px-4 py-3">R$ {s.preco.toFixed(2)}</td>
                <td className="px-4 py-3">{s.duracaoMin} min</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAtivo(s)}
                    className="pill font-medium"
                    style={
                      s.ativo
                        ? { backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }
                        : { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-muted)" }
                    }
                  >
                    {s.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => iniciarEdicao(s)} className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                      Editar
                    </button>
                    <button onClick={() => excluir(s)} className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// ─── USUÁRIOS ────────────────────────────────────────────────────────────────

function Usuarios({ user }: { user: User }) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [form, setForm] = useState({ uid: "", nome: "", role: "operador" });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const token = await user.getIdToken();
    const res = await fetch("/api/usuarios", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsuarios(data.usuarios ?? []);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const token = await user.getIdToken();
    await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setForm({ uid: "", nome: "", role: "operador" });
    await carregar();
    setSalvando(false);
  }

  async function toggleAtivo(u: UsuarioSistema) {
    const token = await user.getIdToken();
    await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uid: u.uid, ativo: !u.ativo }),
    });
    await carregar();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Usuários do sistema</h2>

      <form onSubmit={salvar} className="card p-5 space-y-4">
        <div>
          <p className="text-sm font-medium">Adicionar usuário</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>O usuário já deve ter sido criado no Firebase Auth antes.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 block">
            <span className="label text-xs">UID do Firebase</span>
            <input required className="input mt-1.5 text-sm font-mono" value={form.uid}
              onChange={(e) => setForm({ ...form, uid: e.target.value })} />
          </label>
          <label className="block">
            <span className="label text-xs">Nome</span>
            <input required className="input mt-1.5 text-sm" value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </label>
          <label className="block">
            <span className="label text-xs">Role</span>
            <select className="input mt-1.5 text-sm" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="operador">Operador</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <button disabled={salvando} className="btn-primary text-sm px-4 py-2.5">
          {salvando ? "Salvando..." : "Adicionar"}
        </button>
      </form>

      <div className="space-y-2">
        {usuarios.map((u) => (
          <div key={u.uid} className="card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{u.nome}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-text-muted)" }}>{u.uid}</p>
            </div>
            <span className="pill" style={{ backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-secondary)" }}>{u.role}</span>
            <button
              onClick={() => toggleAtivo(u)}
              className="pill font-medium"
              style={
                u.ativo
                  ? { backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }
                  : { backgroundColor: "var(--color-surface-raised)", color: "var(--color-text-muted)" }
              }
            >
              {u.ativo ? "Ativo" : "Inativo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENTES SHARED ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusOS }) {
  const cores: Partial<Record<StatusOS, { bg: string; fg: string }>> = {
    agendado: { bg: "#1e3a5f", fg: "#7cb8f0" },
    confirmado: { bg: "#1a4a4f", fg: "#5fd4e0" },
    checkin_realizado: { bg: "#2a2a5c", fg: "#a5a8f5" },
    em_atendimento: { bg: "#4a3a14", fg: "#e0c060" },
    finalizado: { bg: "var(--color-accent-soft)", fg: "var(--color-accent)" },
    aguardando_retirada: { bg: "#4a2e14", fg: "#f0a060" },
    entregue: { bg: "var(--color-accent-soft)", fg: "var(--color-accent)" },
    cancelado: { bg: "#4a1f24", fg: "#f0556b" },
  };
  const c = cores[status] ?? { bg: "var(--color-surface-raised)", fg: "var(--color-text-muted)" };
  return (
    <span className="pill font-medium" style={{ backgroundColor: c.bg, color: c.fg }}>
      {STATUS_LABELS[status]}
    </span>
  );
}
