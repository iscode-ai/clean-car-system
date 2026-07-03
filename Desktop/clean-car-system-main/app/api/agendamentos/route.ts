export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { gerarNumeroOS, gerarTokenQRCode, formatarTelefoneE164 } from "@/lib/os";
import { dispararWhatsApp } from "@/lib/n8n";
import { OrdemServico } from "@/types";
import { autenticar } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");
    const osId = searchParams.get("osId");
    const placa = searchParams.get("placa");
    const telefone = searchParams.get("telefone");

    // Busca por ID da OS
    if (osId) {
      const snap = await getAdminDb().collection("ordens_servico").doc(osId).get();
      if (!snap.exists) return NextResponse.json({ resultados: [] });
      return NextResponse.json({ resultados: [snap.data()] });
    }

    // Busca por placa
    if (placa) {
      const snap = await getAdminDb()
        .collection("ordens_servico")
        .where("placa", "==", placa.toUpperCase())
        .get();
      return NextResponse.json({ resultados: snap.docs.map((d: import("firebase-admin/firestore").QueryDocumentSnapshot) => d.data()) });
    }

    // Busca por telefone
    if (telefone) {
      const tel = formatarTelefoneE164(telefone);
      const snap = await getAdminDb()
        .collection("ordens_servico")
        .where("clienteTelefone", "==", tel)
        .get();
      return NextResponse.json({ resultados: snap.docs.map((d: import("firebase-admin/firestore").QueryDocumentSnapshot) => d.data()) });
    }

    // Busca por data (admin)
    if (data) {
      const snap = await getAdminDb()
        .collection("ordens_servico")
        .where("dataAgendada", "==", data)
        .get();
      return NextResponse.json({ ordens: snap.docs.map((d: import("firebase-admin/firestore").QueryDocumentSnapshot) => d.data()) });
    }

    return NextResponse.json({ erro: "Informe osId, placa, telefone ou data." }, { status: 400 });
  } catch (err) {
    console.error("Erro ao buscar agendamentos:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}

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
      historico: [{
        status: "agendado",
        alteradoEm: new Date().toISOString(),
        alteradoPor: "sistema",
        observacao: "Agendamento criado.",
      }],
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
