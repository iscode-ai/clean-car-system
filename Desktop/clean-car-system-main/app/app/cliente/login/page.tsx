"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function LoginClientePage() {
  const router = useRouter();
  const { recarregarPerfil } = useAuth();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviadoReset, setEnviadoReset] = useState(false);

  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "" });

  function mensagemErro(codigo: string): string {
    const mapa: Record<string, string> = {
      "auth/invalid-email": "E-mail inválido.",
      "auth/user-not-found": "Não existe conta com esse e-mail.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/email-already-in-use": "Já existe uma conta com esse e-mail. Faça login.",
      "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
    };
    return mapa[codigo] || "Não foi possível concluir. Tente novamente.";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.senha);
      router.push("/cliente");
    } catch (err: unknown) {
      const codigo = (err as { code?: string })?.code || "";
      setErro(mensagemErro(codigo));
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!form.nome || !form.telefone) {
      setErro("Preencha nome e telefone.");
      return;
    }
    setCarregando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha);
      const token = await cred.user.getIdToken();
      const res = await fetch("/api/cliente/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: form.nome, telefone: form.telefone }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao criar perfil.");
        setCarregando(false);
        return;
      }
      await recarregarPerfil();
      router.push("/cliente");
    } catch (err: unknown) {
      const codigo = (err as { code?: string })?.code || "";
      setErro(mensagemErro(codigo));
    } finally {
      setCarregando(false);
    }
  }

  async function handleEsqueciSenha() {
    if (!form.email) {
      setErro("Digite seu e-mail para receber o link de redefinição.");
      return;
    }
    setErro("");
    try {
      await sendPasswordResetEmail(auth, form.email);
      setEnviadoReset(true);
    } catch (err: unknown) {
      const codigo = (err as { code?: string })?.code || "";
      setErro(mensagemErro(codigo));
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Área do Cliente</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Acompanhe seus agendamentos, histórico e status em tempo real.
        </p>
      </div>

      <div className="card p-1.5 flex gap-1 mb-6">
        <button
          onClick={() => { setModo("login"); setErro(""); }}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
          style={
            modo === "login"
              ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }
              : { color: "var(--color-text-secondary)" }
          }
        >
          Entrar
        </button>
        <button
          onClick={() => { setModo("cadastro"); setErro(""); }}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
          style={
            modo === "cadastro"
              ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }
              : { color: "var(--color-text-secondary)" }
          }
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={modo === "login" ? handleLogin : handleCadastro} className="card p-5 space-y-4">
        {modo === "cadastro" && (
          <>
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
          </>
        )}

        <label className="block">
          <span className="label">E-mail</span>
          <input required type="email" className="input mt-1.5" placeholder="voce@email.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>

        <label className="block">
          <span className="label">Senha</span>
          <input required type="password" minLength={6} className="input mt-1.5" placeholder="••••••••"
            value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
        </label>

        {modo === "login" && (
          <button type="button" onClick={handleEsqueciSenha} className="text-xs"
            style={{ color: "var(--color-accent)" }}>
            Esqueci minha senha
          </button>
        )}

        {enviadoReset && (
          <p className="text-xs" style={{ color: "var(--color-accent)" }}>
            Enviamos um link de redefinição para o seu e-mail.
          </p>
        )}

        {erro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{erro}</p>}

        <button disabled={carregando} className="btn-primary w-full">
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-muted)" }}>
        Prefere não criar conta?{" "}
        <Link href="/acompanhar" className="font-medium" style={{ color: "var(--color-accent)" }}>
          Acompanhe pelo telefone ou placa
        </Link>
      </p>
    </main>
  );
}
