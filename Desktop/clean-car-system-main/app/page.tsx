"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Servico } from "@/types";

export default function Home() {
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
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-5xl font-bold tracking-tight mb-3">Clean Car</h1>
      <p className="text-lg mb-10" style={{ color: "var(--color-text-secondary)" }}>
        Sistema de atendimento, agendamento, QR Code, acompanhamento e WhatsApp.
      </p>

      {carregando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card px-5 py-5 h-[68px] animate-pulse" />
          ))}
        </div>
      ) : servicos.length === 0 ? (
        <p className="text-sm mb-10" style={{ color: "var(--color-text-muted)" }}>
          Nenhum serviço ativo no momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {servicos.map((s) => (
            <div key={s.id} className="card px-5 py-5">
              <p className="font-semibold">{s.nome}</p>
              {s.descricao && (
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {s.descricao}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/agendar" className="btn-primary px-6 py-3 text-base">
        Agendar serviço
      </Link>
    </main>
  );
}
