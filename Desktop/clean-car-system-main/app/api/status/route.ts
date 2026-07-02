export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { dispararWhatsApp } from "@/lib/n8n";
import { StatusHistoricoItem, StatusOS } from "@/types";
import { autenticar } from "@/lib/authServer";

const TRANSICOES_VALIDAS: Record<StatusOS, StatusOS[]> = {
  agendado: ["confirmado", "cancelado"],
  confirmado: ["checkin_realizado", "cancelado"],
  checkin_realizado: ["em_atendimento", "cancelado"],
  em_atendimento: ["finalizado"],
  finalizado: ["aguardando_retirada", "entregue"],
  aguardando_retirada: ["entregue"],
  entregue: [],
  cancelado: [],
};

export async function PATCH(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || (caller.role !== "operador" && caller.role !== "admin")) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  }

  try {
    const { osId, novoStatus, observacao } = await req.json();
    if (!osId || !novoStatus) {
      return NextResponse.json({ erro: "osId e novoStatus são obrigatórios." }, { status: 400 });
    }

    const ref = getAdminDb().collection("ordens_servico").doc(osId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });

    const os = snap.data()!;
    const statusAtual = os.status as StatusOS;
    const transicoes = TRANSICOES_VALIDAS[statusAtual] || [];

    if (!transicoes.includes(novoStatus)) {
      return NextResponse.json(
        { erro: `Transição inválida: ${statusAtual} → ${novoStatus}` },
        { status: 400 }
      );
    }

    const novoHistorico: StatusHistoricoItem = {
      status: novoStatus,
      timestamp: new Date().toISOString(),
      operadorUid: caller.uid,
      observacao: observacao || "",
    };

    await ref.update({
      status: novoStatus,
      historico: [...(os.historico || []), novoHistorico],
      ...(caller.role === "operador" ? { operadorResponsavel: caller.uid } : {}),
    });

    await dispararWhatsApp(`status_${novoStatus}`, { ...os, status: novoStatus });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
