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

// GET /api/veiculos — agrega ordens_servico por placa
export async function GET(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const snap = await getAdminDb().collection("ordens_servico").get();
    const ordens = snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrdemServico);

    const mapa = new Map<
      string,
      {
        placa: string;
        modelo: string;
        clienteNome: string;
        clienteTelefone: string;
        qtdServicos: number;
        ultimoServico: string;
        historico: { id: string; servicoNome: string; data: string; status: string }[];
      }
    >();

    for (const os of ordens) {
      if (!os.placa) continue;
      const existente = mapa.get(os.placa);
      const item = {
        id: os.id,
        servicoNome: os.servicoNome,
        data: os.dataAgendada,
        status: os.status,
      };

      if (existente) {
        existente.qtdServicos += 1;
        existente.historico.push(item);
        if (os.criadoEm > existente.ultimoServico) {
          existente.ultimoServico = os.criadoEm;
          existente.modelo = os.veiculoModelo || existente.modelo;
          existente.clienteNome = os.clienteNome;
          existente.clienteTelefone = os.clienteTelefone;
        }
      } else {
        mapa.set(os.placa, {
          placa: os.placa,
          modelo: os.veiculoModelo || "",
          clienteNome: os.clienteNome,
          clienteTelefone: os.clienteTelefone,
          qtdServicos: 1,
          ultimoServico: os.criadoEm,
          historico: [item],
        });
      }
    }

    const veiculos = Array.from(mapa.values())
      .map((v) => ({
        ...v,
        historico: v.historico.sort((a, b) => b.data.localeCompare(a.data)),
      }))
      .sort((a, b) => b.ultimoServico.localeCompare(a.ultimoServico));

    return NextResponse.json({ veiculos });
  } catch (err) {
    console.error("Erro ao listar veículos:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
