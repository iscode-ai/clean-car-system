"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Servico } from "@/types";
import { useAuth } from "./context/AuthContext";

const STEPS = [
  { icon: "📅", titulo: "Agende online", desc: "Escolha serviço, data e horário sem precisar ligar." },
  { icon: "📲", titulo: "QR Code de entrada", desc: "Chegue, escaneie e faça seu check-in em segundos." },
  { icon: "🔧", titulo: "Acompanhe ao vivo", desc: "Veja o status do seu carro em tempo real pelo celular." },
  { icon: "🎉", titulo: "Receba avisos", desc: "Notificação via WhatsApp quando estiver pronto." },
];

export default function Home() {
  const { user, perfil } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDocs(query(collection(db, "servicos"), where("ativo", "==", true)));
        setServicos(snap.docs.map((d) => d.data() as Servico));
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
          ✨ Sistema completo de agendamento e acompanhamento
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
          Seu carro em boas mãos,<br />
          <span style={{ color: "var(--color-accent)" }}>você no controle.</span>
        </h1>
        <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
          Agende, acompanhe o serviço em tempo real e receba notificações pelo WhatsApp. Tudo online, sem filas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/agendar" className="btn-primary px-7 py-3 text-base">
            Agendar agora
          </Link>
          {user ? (
            <Link href="/cliente" className="btn-secondary px-7 py-3 text-base">
              Minha área →
            </Link>
          ) : (
            <Link href="/cliente/login" className="btn-secondary px-7 py-3 text-base">
              Área do cliente
            </Link>
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Como funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={i} className="card p-5 relative overflow-hidden">
              <span
                className="absolute top-3 right-4 font-bold text-5xl"
                style={{ color: "var(--color-surface-raised)", lineHeight: 1 }}
              >
                {i + 1}
              </span>
              <span className="text-3xl mb-3 block">{s.icon}</span>
              <p className="font-semibold">{s.titulo}</p>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Serviços */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Serviços disponíveis</h2>
          <Link href="/agendar" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
            Agendar →
          </Link>
        </div>

        {carregando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse" />)}
          </div>
        ) : servicos.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhum serviço ativo no momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {servicos.map((s) => (
              <Link href="/agendar" key={s.id}
                className="card p-5 transition hover:border-(--color-border-strong) block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.nome}</p>
                    {s.descricao && (
                      <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{s.descricao}</p>
                    )}
                    <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>⏱ {s.duracaoMin} min</p>
                  </div>
                  <span className="font-bold shrink-0 text-sm mt-0.5" style={{ color: "var(--color-accent)" }}>
                    R$ {s.preco.toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Banner área cliente */}
      {!user && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="card p-8 text-center"
            style={{ background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-raised) 100%)", borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" }}>
            <p className="text-2xl font-bold mb-2">Crie sua conta e tenha tudo em um lugar</p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
              Histórico de serviços, status em tempo real, QR Code de entrada e muito mais.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/cliente/login" className="btn-primary px-7 py-3">
                Criar conta grátis
              </Link>
              <Link href="/acompanhar" className="btn-secondary px-7 py-3">
                Acompanhar sem conta
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Saudação pra quem está logado */}
      {user && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="card p-7 flex items-center justify-between flex-wrap gap-4"
            style={{ borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" }}>
            <div>
              <p className="font-semibold text-lg">Olá, {perfil?.nome?.split(" ")[0] || "Cliente"}! 👋</p>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Acesse sua área para ver seus agendamentos e acompanhar o status.
              </p>
            </div>
            <Link href="/cliente" className="btn-primary">Minha área →</Link>
          </div>
        </section>
      )}
    </main>
  );
}
