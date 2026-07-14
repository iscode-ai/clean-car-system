export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { UserRole, OrdemServico } from "@/types";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

async function autenticarAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAdminAuth().verifyIdToken(token);
    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();
    if (!snap.exists) return null;
    const role = snap.data()!.role as UserRole;
    if (role !== "admin") return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

// GET /api/relatorios?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    const snap = await getAdminDb().collection("ordens_servico").get();
    let ordens = snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrdemServico);

    if (inicio) ordens = ordens.filter((os: OrdemServico) => os.dataAgendada >= inicio);
    if (fim) ordens = ordens.filter((os: OrdemServico) => os.dataAgendada <= fim);

    const validas = ordens.filter((os: OrdemServico) => os.status !== "cancelado");

    // Receita por dia
    const receitaPorDia = new Map<string, number>();
    for (const os of validas) {
      receitaPorDia.set(os.dataAgendada, (receitaPorDia.get(os.dataAgendada) || 0) + (os.servicoPreco || 0));
    }
    const receitaSerie = Array.from(receitaPorDia.entries())
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // Serviços mais vendidos
    const servicoCount = new Map<string, { nome: string; qtd: number; total: number }>();
    for (const os of validas) {
      const atual = servicoCount.get(os.servicoId) || { nome: os.servicoNome, qtd: 0, total: 0 };
      atual.qtd += 1;
      atual.total += os.servicoPreco || 0;
      servicoCount.set(os.servicoId, atual);
    }
    const servicosMaisVendidos = Array.from(servicoCount.values()).sort((a, b) => b.qtd - a.qtd);

    // Clientes recorrentes (mais de 1 atendimento)
    const clienteCount = new Map<string, { nome: string; qtd: number; total: number }>();
    for (const os of validas) {
      const chave = os.clienteTelefone;
      if (!chave) continue;
      const atual = clienteCount.get(chave) || { nome: os.clienteNome, qtd: 0, total: 0 };
      atual.qtd += 1;
      atual.total += os.servicoPreco || 0;
      clienteCount.set(chave, atual);
    }
    const clientesRecorrentes = Array.from(clienteCount.values())
      .filter((c) => c.qtd > 1)
      .sort((a, b) => b.qtd - a.qtd);

    // Totais gerais
    const receitaTotal = validas.reduce((acc, os) => acc + (os.servicoPreco || 0), 0);
    const ticketMedio = validas.length > 0 ? receitaTotal / validas.length : 0;

    return NextResponse.json({
      receitaTotal,
      ticketMedio,
      totalAtendimentos: validas.length,
      totalCancelados: ordens.length - validas.length,
      receitaSerie,
      servicosMaisVendidos,
      clientesRecorrentes,
    });
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
