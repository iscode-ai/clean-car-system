"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Servico } from "@/types";
import { useAuth } from "./context/AuthContext";
import StatusStepper from "./components/StatusStepper";

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
      <section className="max-w-6xl mx-auto px-6 py-20 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 pointer-events-none"
          style={{
            width: 600,
            height: 400,
            background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
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

        {/* Mockup visual do acompanhamento */}
        <div className="mt-16 max-w-xl mx-auto">
          <div className="card p-5 text-left" style={{ borderColor: "color-mix(in srgb, var(--color-accent) 25%, transparent)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                OS-260710-104829
              </span>
              <span className="pill text-xs" style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                🔧 Em atendimento
              </span>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>🚗 ABC1D23 — Corolla 2022</p>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Lavagem completa + polimento</p>
            <div className="pt-4" style={{ borderTop: "0.5px solid var(--color-border)" }}>
              <StatusStepper status="em_atendimento" />
            </div>
          </div>
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

      {/* Números */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="card p-6 sm:p-8 grid grid-cols-3 gap-4 text-center">
          {[
            { valor: "100%", label: "Online, sem filas" },
            { valor: "WhatsApp", label: "Notificação automática" },
            { valor: "Tempo real", label: "Acompanhamento do status" },
          ].map((n) => (
            <div key={n.label}>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: "var(--color-accent)" }}>{n.valor}</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{n.label}</p>
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

      {/* Planos */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Planos para quem usa sempre</h2>
        <p className="text-sm text-center mb-10" style={{ color: "var(--color-text-secondary)" }}>
          Economize com pacotes recorrentes. Fale conosco pelo WhatsApp para contratar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { nome: "Avulso", desc: "Pague por serviço, sem compromisso.", destaque: false },
            { nome: "Mensal 4x", desc: "4 lavagens por mês com desconto progressivo.", destaque: true },
            { nome: "Ilimitado", desc: "Lavagens ilimitadas no mês, ideal para uso frequente.", destaque: false },
          ].map((p) => (
            <div key={p.nome} className="card p-6 relative"
              style={p.destaque ? { borderColor: "var(--color-accent)", borderWidth: 2 } : {}}>
              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 pill text-xs font-semibold"
                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }}>
                  Mais popular
                </span>
              )}
              <p className="font-bold text-lg mt-1">{p.nome}</p>
              <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>{p.desc}</p>
              <a href="https://wa.me/" className="btn-secondary w-full mt-5 inline-flex justify-center">
                Falar no WhatsApp
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Quem usa, recomenda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { nome: "Renata M.", texto: "Não preciso mais ligar pra saber se o carro tá pronto. Chega uma mensagem no WhatsApp e pronto." },
            { nome: "Diego A.", texto: "Cheguei, escaneei o QR Code e já entrei na fila. Muito mais rápido que antes." },
            { nome: "Camila S.", texto: "Consigo ver o status em tempo real pelo celular. Sistema simples e direto ao ponto." },
          ].map((d) => (
            <div key={d.nome} className="card p-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                &ldquo;{d.texto}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                  {d.nome.charAt(0)}
                </span>
                <span className="text-sm font-medium">{d.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {[
            { p: "Preciso criar conta para agendar?", r: "Não. Você pode agendar como visitante e acompanhar pelo número da placa ou telefone. Criar conta só facilita ver o histórico completo depois." },
            { p: "Como funciona o QR Code?", r: "Depois de agendar, você recebe um QR Code. Basta apresentar na chegada para o operador fazer seu check-in em segundos, sem precisar repetir seus dados." },
            { p: "Vou ser avisado quando o carro estiver pronto?", r: "Sim. Assim que o status muda para finalizado, enviamos uma notificação automática pelo WhatsApp." },
            { p: "Posso cancelar ou remarcar um agendamento?", r: "Sim, entre em contato pelo WhatsApp informando o número da OS para cancelar ou remarcar." },
            { p: "Quais formas de pagamento são aceitas?", r: "Aceitamos dinheiro, cartão de débito/crédito e Pix diretamente no local." },
          ].map((item) => (
            <details key={item.p} className="card p-4 group">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between list-none">
                {item.p}
                <span className="text-xs transition group-open:rotate-45" style={{ color: "var(--color-accent)" }}>+</span>
              </summary>
              <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>{item.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Banner área cliente */}
      {!user && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="card p-8 text-center"
            style={{ background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-raised) 100%)", borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
              🚗 Leva menos de 1 minuto
            </div>
            <p className="text-2xl font-bold mb-2">Agende agora e chegue sem esperar</p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
              Crie sua conta e tenha histórico, status em tempo real e QR Code de entrada — tudo em um lugar.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/agendar" className="btn-primary px-7 py-3">
                Agendar agora
              </Link>
              <Link href="/cliente/login" className="btn-secondary px-7 py-3">
                Criar conta grátis
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
