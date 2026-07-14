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

// GET /api/clientes — agrega ordens_servico por telefone do cliente
export async function GET(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const snap = await getAdminDb().collection("ordens_servico").get();
    const ordens = snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrdemServico);

    const mapa = new Map<
      string,
      {
        telefone: string;
        nome: string;
        totalGasto: number;
        qtdServicos: number;
        ultimoAtendimento: string;
        placas: Set<string>;
      }
    >();

    for (const os of ordens) {
      const chave = os.clienteTelefone;
      if (!chave) continue;

      const existente = mapa.get(chave);
      const contaNoTotal = os.status !== "cancelado";

      if (existente) {
        if (contaNoTotal) {
          existente.totalGasto += os.servicoPreco || 0;
          existente.qtdServicos += 1;
        }
        if (os.criadoEm > existente.ultimoAtendimento) {
          existente.ultimoAtendimento = os.criadoEm;
          existente.nome = os.clienteNome || existente.nome;
        }
        if (os.placa) existente.placas.add(os.placa);
      } else {
        mapa.set(chave, {
          telefone: chave,
          nome: os.clienteNome,
          totalGasto: contaNoTotal ? os.servicoPreco || 0 : 0,
          qtdServicos: contaNoTotal ? 1 : 0,
          ultimoAtendimento: os.criadoEm,
          placas: new Set(os.placa ? [os.placa] : []),
        });
      }
    }

    const clientes = Array.from(mapa.values())
      .map((c) => ({ ...c, placas: Array.from(c.placas) }))
      .sort((a, b) => b.totalGasto - a.totalGasto);

    return NextResponse.json({ clientes });
  } catch (err) {
    console.error("Erro ao listar clientes:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
