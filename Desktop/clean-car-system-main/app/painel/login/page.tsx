"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setCarregando(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.senha);
      const token = await cred.user.getIdToken();
      const res = await fetch("/api/painel/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Acesso negado.");
        await auth.signOut();
        setCarregando(false);
        return;
      }
      // window.location força reload completo para o middleware ler o cookie
      window.location.href = data.role === "operador" ? "/operador" : redirect;
    } catch (err: unknown) {
      const codigo = (err as { code?: string })?.code || "";
      const msgs: Record<string, string> = {
        "auth/invalid-credential": "E-mail ou senha incorretos.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde.",
      };
      setErro(msgs[codigo] || "Erro ao entrar.");
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#070a10" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: "var(--color-accent-soft)" }}>
            <span className="text-xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Painel interno</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Acesso restrito a administradores e operadores</p>
        </div>
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <label className="block">
            <span className="label">E-mail</span>
            <input required type="email" className="input mt-1.5" placeholder="admin@cleancar.com.br"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Senha</span>
            <input required type="password" className="input mt-1.5" placeholder="••••••••"
              value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
          </label>
          {erro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{erro}</p>}
          <button disabled={carregando} className="btn-primary w-full">
            {carregando ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
        <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-muted)" }}>
          Cliente? <a href="/cliente/login" style={{ color: "var(--color-accent)" }}>Acesse sua área</a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPainelPage() {
  return <Suspense><LoginForm /></Suspense>;
}
