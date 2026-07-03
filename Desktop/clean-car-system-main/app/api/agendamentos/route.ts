export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { gerarNumeroOS, gerarTokenQRCode, formatarTelefoneE164 } from "@/lib/os";
import { dispararWhatsApp } from "@/lib/n8n";
import { OrdemServico } from "@/types";
import { autenticar } from "@/lib/authServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clienteNome, clienteTelefone, placa, veiculoModelo, servicoId, dataAgendada, horaAgendada } = body;

    if (!clienteNome || !clienteTelefone || !placa || !servicoId || !dataAgendada || !horaAgendada) {
      return NextResponse.json({ erro: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    const caller = await autenticar(req, { exigirCadastro: false });
    const telefoneFormatado = formatarTelefoneE164(clienteTelefone);

    const servicoSnap = await getAdminDb().collection("servicos").doc(servicoId).get();
    if (!servicoSnap.exists) {
      return NextResponse.json({ erro: "Serviço não encontrado." }, { status: 404 });
    }
    const servico = servicoSnap.data()!;

    const osId = gerarNumeroOS();
    const novaOS: OrdemServico = {
      id: osId,
      qrCode: gerarTokenQRCode(),
      qrUsado: false,
      clienteNome,
      clienteTelefone: telefoneFormatado,
      ...(caller ? { clienteUid: caller.uid } : {}),
      placa: placa.toUpperCase().replace(/\s/g, ""),
      veiculoModelo: veiculoModelo || "",
      servicoId,
      servicoNome: servico.nome,
      servicoPreco: servico.preco,
      dataAgendada,
      horaAgendada,
      status: "agendado",
      historico: [
        {
          status: "agendado",
          alteradoEm: new Date().toISOString(),
          alteradoPor: "sistema",
          observacao: "Agendamento criado pelo cliente.",
        },
      ],
      fotos: [],
      criadoEm: new Date().toISOString(),
    };

    await getAdminDb().collection("ordens_servico").doc(osId).set(novaOS);
    await dispararWhatsApp("agendamento_criado", novaOS);

    return NextResponse.json({ osId, qrCode: novaOS.qrCode });
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    return NextResponse.json({ erro: "Erro interno ao criar agendamento." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");
    if (!data) {
      return NextResponse.json({ erro: "Parâmetro 'data' obrigatório." }, { status: 400 });
    }
    const snap = await getAdminDb()
      .collection("ordens_servico")
      .where("dataAgendada", "==", data)
      .get();
    const ordens = snap.docs.map((d: QueryDocumentSnapshot) => d.data());
    return NextResponse.json({ ordens });
  } catch (err) {
    console.error("Erro ao listar agendamentos:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
