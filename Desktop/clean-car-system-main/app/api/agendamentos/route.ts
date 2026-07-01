export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb() } from "@/lib/firebaseAdmin";
import { gerarNumeroOS, gerarTokenQRCode, formatarTelefoneE164 } from "@/lib/os";
import { dispararWhatsApp } from "@/lib/n8n";
import { OrdemServico } from "@/types";
import { autenticar } from "@/lib/authServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clienteNome, clienteTelefone, placa, veiculoModelo, servicoId, dataAgendada, horaAgendada } = body;

    // Se o cliente estiver logado, vincula a OS à conta dele (opcional)
    const caller = await autenticar(req, { exigirCadastro: false });

    if (!clienteNome || !clienteTelefone || !placa || !servicoId || !dataAgendada || !horaAgendada) {
      return NextResponse.json({ erro: "Campos obrigatórios faltando." }, { status: 400 });
    }

    const servicoSnap = await getAdminDb().collection("servicos").doc(servicoId).get();
    if (!servicoSnap.exists) {
      return NextResponse.json({ erro: "Serviço não encontrado." }, { status: 404 });
    }

    const servico = servicoSnap.data()!;
    const osId = gerarNumeroOS();
    const telefoneFormatado = formatarTelefoneE164(clienteTelefone);

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
      historico: [{ status: "agendado", alteradoEm: new Date().toISOString(), alteradoPor: "sistema" }],
      fotos: [],
      criadoEm: new Date().toISOString(),
    };

    await getAdminDb().collection("ordens_servico").doc(osId).set(novaOS);

    await dispararWhatsApp({
      evento: "agendamento_criado",
      telefone: telefoneFormatado,
      osId,
      nomeCliente: clienteNome,
      dados: { qrCode: novaOS.qrCode, servicoNome: servico.nome, dataAgendada, horaAgendada },
    });

    return NextResponse.json({ ok: true, osId, qrCode: novaOS.qrCode });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ erro: "Erro interno ao criar agendamento." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const osId = searchParams.get("osId");
  const placa = searchParams.get("placa");
  const telefone = searchParams.get("telefone");

  if (!osId && !placa && !telefone) {
    return NextResponse.json({ erro: "Informe osId, placa ou telefone." }, { status: 400 });
  }

  if (osId) {
    const snap = await getAdminDb().collection("ordens_servico").doc(osId).get();
    if (!snap.exists) return NextResponse.json({ resultados: [] });
    return NextResponse.json({ resultados: [snap.data()] });
  }

  let q;
  if (placa) {
    q = getAdminDb().collection("ordens_servico")
      .where("placa", "==", placa.toUpperCase().replace(/\s/g, ""))
      .orderBy("criadoEm", "desc").limit(5);
  } else {
    q = getAdminDb().collection("ordens_servico")
      .where("clienteTelefone", "==", formatarTelefoneE164(telefone!))
      .orderBy("criadoEm", "desc").limit(5);
  }

  const snap = await q.get();
  return NextResponse.json({ resultados: snap.docs.map((d) => d.data()) });
}
