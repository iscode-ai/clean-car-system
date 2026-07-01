export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb() } from "@/lib/firebaseAdmin";
import { dispararWhatsApp } from "@/lib/n8n";
import { transicaoValida } from "@/lib/os";
import { StatusHistoricoItem, StatusOS } from "@/types";

const EVENTO_POR_STATUS: Partial<Record<StatusOS, string>> = {
  em_atendimento: "status_atualizado",
  finalizado: "servico_finalizado",
  aguardando_retirada: "status_atualizado",
  entregue: "veiculo_entregue",
};

export async function PATCH(req: NextRequest) {
  try {
    const { osId, novoStatus, operadorUid, observacao } = await req.json();
    if (!osId || !novoStatus || !operadorUid) {
      return NextResponse.json({ erro: "osId, novoStatus e operadorUid são obrigatórios." }, { status: 400 });
    }

    const osRef = getAdminDb().collection("ordens_servico").doc(osId);
    const osSnap = await osRef.get();
    if (!osSnap.exists) return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });

    const os = osSnap.data()!;
    if (!transicaoValida(os.status, novoStatus)) {
      return NextResponse.json({ erro: `Transição inválida: "${os.status}" → "${novoStatus}".` }, { status: 409 });
    }

    const novoHistorico: StatusHistoricoItem = {
      status: novoStatus,
      alteradoEm: new Date().toISOString(),
      alteradoPor: operadorUid,
      observacao,
    };

    await osRef.update({ status: novoStatus, historico: [...os.historico, novoHistorico] });

    const evento = EVENTO_POR_STATUS[novoStatus as StatusOS] || "status_atualizado";
    await dispararWhatsApp({
      evento: evento as any,
      telefone: os.clienteTelefone,
      osId: os.id,
      nomeCliente: os.clienteNome,
      dados: { novoStatus },
    });

    if (novoStatus === "entregue") {
      await dispararWhatsApp({
        evento: "pedido_avaliacao",
        telefone: os.clienteTelefone,
        osId: os.id,
        nomeCliente: os.clienteNome,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ erro: "Erro interno ao atualizar status." }, { status: 500 });
  }
}
