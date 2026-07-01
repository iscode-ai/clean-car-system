"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function ContaPage() {
  const router = useRouter();
  const { user, perfil, carregando, recarregarPerfil } = useAuth();

  const [form, setForm] = useState({ nome: "", telefone: "" });
  const [senhaForm, setSenhaForm] = useState({ atual: "", nova: "", confirmar: "" });
  const [salvando, setSalvando] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [feedbackPerfil, setFeedbackPerfil] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  const [feedbackSenha, setFeedbackSenha] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  useEffect(() => {
    if (!carregando && !user) {
      router.replace("/cliente/login");
    }
    if (perfil) {
      setForm({ nome: perfil.nome || "", telefone: perfil.telefone || "" });
    }
  }, [user, perfil, carregando, router]);

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSalvando(true);
    setFeedbackPerfil(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/cliente/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await recarregarPerfil();
        setFeedbackPerfil({ tipo: "ok", msg: "Dados atualizados com sucesso!" });
      } else {
        const data = await res.json();
        setFeedbackPerfil({ tipo: "erro", msg: data.erro || "Erro ao salvar." });
      }
    } catch {
      setFeedbackPerfil({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !user.email) return;
    if (senhaForm.nova !== senhaForm.confirmar) {
      setFeedbackSenha({ tipo: "erro", msg: "As senhas novas não coincidem." });
      return;
    }
    if (senhaForm.nova.length < 6) {
      setFeedbackSenha({ tipo: "erro", msg: "A nova senha precisa ter pelo menos 6 caracteres." });
      return;
    }
    setSalvandoSenha(true);
    setFeedbackSenha(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, senhaForm.atual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, senhaForm.nova);
      setSenhaForm({ atual: "", nova: "", confirmar: "" });
      setFeedbackSenha({ tipo: "ok", msg: "Senha alterada com sucesso!" });
    } catch (err: unknown) {
      const codigo = (err as { code?: string })?.code || "";
      const msg =
        codigo === "auth/wrong-password" || codigo === "auth/invalid-credential"
          ? "Senha atual incorreta."
          : "Não foi possível alterar a senha. Tente novamente.";
      setFeedbackSenha({ tipo: "erro", msg });
    } finally {
      setSalvandoSenha(false);
    }
  }

  if (carregando) {
    return (
      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        {[1, 2].map((i) => <div key={i} className="card h-40 animate-pulse" />)}
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente" className="text-sm" style={{ color: "var(--color-accent)" }}>← Voltar</Link>
        <h1 className="text-2xl font-bold tracking-tight">Meus dados</h1>
      </div>

      {/* Perfil */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-base">Informações pessoais</h2>
        <form onSubmit={salvarPerfil} className="space-y-4">
          <label className="block">
            <span className="label">Nome completo</span>
            <input required className="input mt-1.5" placeholder="Seu nome"
              value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">WhatsApp com DDD</span>
            <input required className="input mt-1.5" placeholder="15996823970"
              value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">E-mail</span>
            <input disabled className="input mt-1.5 opacity-50 cursor-not-allowed" value={user.email || ""} />
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>O e-mail não pode ser alterado por aqui.</p>
          </label>

          {feedbackPerfil && (
            <p className="text-sm" style={{ color: feedbackPerfil.tipo === "ok" ? "var(--color-accent)" : "var(--color-danger)" }}>
              {feedbackPerfil.msg}
            </p>
          )}

          <button disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Salvar dados"}
          </button>
        </form>
      </section>

      {/* Senha */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-base">Alterar senha</h2>
        <form onSubmit={salvarSenha} className="space-y-4">
          <label className="block">
            <span className="label">Senha atual</span>
            <input required type="password" className="input mt-1.5" placeholder="••••••••"
              value={senhaForm.atual} onChange={(e) => setSenhaForm({ ...senhaForm, atual: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Nova senha</span>
            <input required type="password" minLength={6} className="input mt-1.5" placeholder="••••••••"
              value={senhaForm.nova} onChange={(e) => setSenhaForm({ ...senhaForm, nova: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Confirmar nova senha</span>
            <input required type="password" className="input mt-1.5" placeholder="••••••••"
              value={senhaForm.confirmar} onChange={(e) => setSenhaForm({ ...senhaForm, confirmar: e.target.value })} />
          </label>

          {feedbackSenha && (
            <p className="text-sm" style={{ color: feedbackSenha.tipo === "ok" ? "var(--color-accent)" : "var(--color-danger)" }}>
              {feedbackSenha.msg}
            </p>
          )}

          <button disabled={salvandoSenha} className="btn-primary">
            {salvandoSenha ? "Salvando..." : "Alterar senha"}
          </button>
        </form>
      </section>
    </main>
  );
}
